/* brainDump.js — quick-capture Idea Box to keep stray thoughts from becoming distractions */
(function (global) {

  function uid() {
    return "i_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function add(text) {
    FFStorage.set(s => {
      s.brainDump.unshift({ id: uid(), text, createdAt: new Date().toISOString() });
    });
    render();
  }

  function edit(id, text) {
    FFStorage.set(s => {
      const item = s.brainDump.find(i => i.id === id);
      if (item) item.text = text;
    });
    render();
  }

  function remove(id) {
    FFStorage.set(s => { s.brainDump = s.brainDump.filter(i => i.id !== id); });
    render();
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function render() {
    const list = document.getElementById("idea-list");
    if (!list) return;
    const state = FFStorage.get();
    list.innerHTML = state.brainDump.map(item => `
      <li class="idea-item" data-id="${item.id}">
        <span class="idea-text" data-id="${item.id}">${escapeHtml(item.text)}</span>
        <span class="idea-date subtle small">${new Date(item.createdAt).toLocaleDateString()}</span>
        <button class="icon-btn edit-idea" data-id="${item.id}" title="Edit">✎</button>
        <button class="icon-btn delete-idea" data-id="${item.id}" title="Delete">✕</button>
      </li>
    `).join("") || `<li class="empty-state">Your Idea Box is empty. Capture a thought above.</li>`;
  }

  function bindEvents() {
    const form = document.getElementById("braindump-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("braindump-input");
      if (!input.value.trim()) return;
      add(input.value.trim());
      input.value = "";
    });

    const list = document.getElementById("idea-list");
    list.addEventListener("click", (e) => {
      const del = e.target.closest(".delete-idea");
      if (del) { remove(del.dataset.id); return; }
      const editBtn = e.target.closest(".edit-idea");
      if (editBtn) {
        const span = list.querySelector(`.idea-text[data-id="${editBtn.dataset.id}"]`);
        const newText = prompt("Edit idea:", span.textContent);
        if (newText && newText.trim()) edit(editBtn.dataset.id, newText.trim());
      }
    });
  }

  global.FFBrainDump = { add, edit, remove, render, bindEvents };
})(window);
