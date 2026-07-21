/* tasks.js — task CRUD, categories, Top 3, drag & drop, completion XP */
(function (global) {
  let currentFilter = "All";
  let dragSrcId = null;

  function uid() {
    return "t_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function addTask(text, category, top3) {
    FFStorage.set(s => {
      s.tasks.push({
        id: uid(), text, category, done: false,
        top3: !!top3, createdAt: new Date().toISOString(), completedAt: null
      });
    });
    render();
    if (global.FFDashboard) global.FFDashboard.render();
  }

  function removeTask(id) {
    FFStorage.set(s => { s.tasks = s.tasks.filter(t => t.id !== id); });
    render();
    if (global.FFDashboard) global.FFDashboard.render();
  }

  function editTask(id, newText) {
    FFStorage.set(s => {
      const t = s.tasks.find(t => t.id === id);
      if (t) t.text = newText;
    });
    render();
  }

  function toggleTop3(id) {
    const state = FFStorage.get();
    const pinnedCount = state.tasks.filter(t => t.top3 && !t.done).length;
    const target = state.tasks.find(t => t.id === id);
    if (!target) return;
    if (!target.top3 && pinnedCount >= 3) {
      FFXP.toast("Top 3 is full — unpin a task first.", "warn");
      return;
    }
    FFStorage.set(s => {
      const t = s.tasks.find(t => t.id === id);
      t.top3 = !t.top3;
    });
    render();
    if (global.FFDashboard) global.FFDashboard.render();
  }

  function completeTask(id) {
    const state = FFStorage.get();
    const t = state.tasks.find(t => t.id === id);
    if (!t || t.done) return;
    FFStorage.set(s => {
      const task = s.tasks.find(t => t.id === id);
      task.done = true;
      task.completedAt = new Date().toISOString();
      const key = FFStorage.todayKey();
      const log = FFStorage.ensureDailyLog(key);
      log.tasksCompleted += 1;
      FFStorage.recomputeScore(key);
    });
    FFStorage.updateStreakForToday();
    FFXP.addXP(10, "Task complete");
    render();
    if (global.FFDashboard) global.FFDashboard.render();
    if (global.FFCalendar) global.FFCalendar.render();
    if (global.FFStatistics) global.FFStatistics.render();
  }

  function reorder(draggedId, targetId) {
    FFStorage.set(s => {
      const from = s.tasks.findIndex(t => t.id === draggedId);
      const to = s.tasks.findIndex(t => t.id === targetId);
      if (from === -1 || to === -1) return;
      const [item] = s.tasks.splice(from, 1);
      s.tasks.splice(to, 0, item);
    });
    render();
  }

  function getTop3() {
    return FFStorage.get().tasks.filter(t => t.top3 && !t.done).slice(0, 3);
  }

  function getIncomplete() {
    return FFStorage.get().tasks.filter(t => !t.done);
  }

  function render() {
    const list = document.getElementById("task-list");
    if (!list) return;
    const state = FFStorage.get();
    const tasks = state.tasks.filter(t => currentFilter === "All" || t.category === currentFilter);

    list.innerHTML = tasks.map(t => `
      <li class="task-item ${t.done ? "is-done" : ""}" draggable="true" data-id="${t.id}">
        <span class="drag-handle">⠿</span>
        <input type="checkbox" class="task-check" ${t.done ? "checked" : ""} data-id="${t.id}" />
        <span class="task-text" data-id="${t.id}">${escapeHtml(t.text)}</span>
        <span class="tag tag-${t.category.toLowerCase()}">${t.category}</span>
        <button class="icon-btn top3-btn ${t.top3 ? "is-active" : ""}" data-id="${t.id}" title="Pin to Top 3">★</button>
        <button class="icon-btn edit-btn" data-id="${t.id}" title="Edit">✎</button>
        <button class="icon-btn delete-btn" data-id="${t.id}" title="Delete">✕</button>
      </li>
    `).join("") || `<li class="empty-state">No tasks in this view yet. Add one above.</li>`;

    // populate focus task select
    const select = document.getElementById("focus-task-select");
    if (select) {
      const incomplete = getIncomplete();
      select.innerHTML = `<option value="">No specific task</option>` +
        incomplete.map(t => `<option value="${t.id}">${escapeHtml(t.text)}</option>`).join("");
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function bindEvents() {
    const form = document.getElementById("task-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("task-input");
      const cat = document.getElementById("task-category");
      const top3 = document.getElementById("task-top3");
      if (!input.value.trim()) return;
      addTask(input.value.trim(), cat.value, top3.checked);
      input.value = "";
      top3.checked = false;
    });

    document.getElementById("task-filters").addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-chip");
      if (!btn) return;
      document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentFilter = btn.dataset.filter;
      render();
    });

    const list = document.getElementById("task-list");
    list.addEventListener("click", (e) => {
      const check = e.target.closest(".task-check");
      if (check) { completeTask(check.dataset.id); return; }
      const star = e.target.closest(".top3-btn");
      if (star) { toggleTop3(star.dataset.id); return; }
      const del = e.target.closest(".delete-btn");
      if (del) { removeTask(del.dataset.id); return; }
      const edit = e.target.closest(".edit-btn");
      if (edit) {
        const span = list.querySelector(`.task-text[data-id="${edit.dataset.id}"]`);
        const newText = prompt("Edit task:", span.textContent);
        if (newText && newText.trim()) editTask(edit.dataset.id, newText.trim());
      }
    });

    list.addEventListener("dragstart", (e) => {
      const item = e.target.closest(".task-item");
      if (!item) return;
      dragSrcId = item.dataset.id;
      item.classList.add("is-dragging");
    });
    list.addEventListener("dragend", (e) => {
      const item = e.target.closest(".task-item");
      if (item) item.classList.remove("is-dragging");
    });
    list.addEventListener("dragover", (e) => {
      e.preventDefault();
      const item = e.target.closest(".task-item");
      if (item) item.classList.add("drag-over");
    });
    list.addEventListener("dragleave", (e) => {
      const item = e.target.closest(".task-item");
      if (item) item.classList.remove("drag-over");
    });
    list.addEventListener("drop", (e) => {
      e.preventDefault();
      const item = e.target.closest(".task-item");
      if (item) item.classList.remove("drag-over");
      if (item && dragSrcId && item.dataset.id !== dragSrcId) {
        reorder(dragSrcId, item.dataset.id);
      }
      dragSrcId = null;
    });
  }

  global.FFTasks = { addTask, removeTask, editTask, toggleTop3, completeTask, getTop3, getIncomplete, render, bindEvents };
})(window);
