/* search.js — instant global search across tasks, habits, notes, goals, journal, achievements, projects, and ideas */
(function (global) {
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function normalize(text) {
    return (text || "").toString().toLowerCase();
  }

  function getState() {
    return FFStorage.get();
  }

  function buildRecords() {
    const state = getState();
    const records = [];

    state.tasks.forEach(task => {
      records.push({
        id: task.id,
        category: "Tasks",
        view: "tasks",
        title: task.text,
        subtitle: task.category,
        description: task.done ? "Completed" : "Pending",
        meta: task.top3 ? "Pinned" : ""
      });
    });

    state.notes.forEach(note => {
      records.push({
        id: note.id,
        category: "Notes",
        view: "braindump",
        title: note.title || note.content || "Untitled note",
        subtitle: "Saved note",
        description: note.content || "",
        meta: ""
      });
    });

    state.goals.forEach(goal => {
      records.push({
        id: goal.id,
        category: "Goals",
        view: "tasks",
        title: goal.title,
        subtitle: goal.status || "Active",
        description: goal.description || "",
        meta: ""
      });
    });

    state.journalEntries.forEach(entry => {
      records.push({
        id: entry.id,
        category: "Journal",
        view: "dashboard",
        title: entry.title,
        subtitle: "Journal",
        description: entry.content || "",
        meta: ""
      });
    });

    state.projects.forEach(project => {
      records.push({
        id: project.id,
        category: "Projects",
        view: "tasks",
        title: project.name,
        subtitle: project.status || "In progress",
        description: project.description || "",
        meta: ""
      });
    });

    state.habits.forEach(habit => {
      records.push({
        id: habit.id,
        category: "Habits",
        view: "habits",
        title: habit.name,
        subtitle: habit.frequency || "daily",
        description: `${habit.target || 1} target • ${habit.customIntervalDays || 3} day interval`,
        meta: ""
      });
    });

    state.brainDump.forEach(idea => {
      records.push({
        id: idea.id,
        category: "Ideas",
        view: "braindump",
        title: idea.text,
        subtitle: "Idea Box",
        description: "Captured thought",
        meta: ""
      });
    });

    if (global.FFAchievements && global.FFAchievements.CATALOGUE) {
      const achievementState = state.achievements || {};
      global.FFAchievements.CATALOGUE.forEach(achievement => {
        records.push({
          id: achievement.id,
          category: "Achievements",
          view: "achievements",
          title: achievement.name,
          subtitle: achievementState[achievement.id] ? "Unlocked" : "Locked",
          description: achievement.desc,
          meta: ""
        });
      });
    }

    return records;
  }

  function filterRecords(query) {
    const normalized = normalize(query).trim();
    if (!normalized) return [];

    return buildRecords().filter(record => {
      const haystack = [record.title, record.subtitle, record.description, record.category, record.meta].join(" ");
      return normalize(haystack).includes(normalized);
    });
  }

  function renderResults(query) {
    const panel = document.getElementById("search-results");
    if (!panel) return;

    const normalized = (query || "").toString().trim();
    if (!normalized) {
      panel.hidden = true;
      panel.innerHTML = "";
      return;
    }

    const results = filterRecords(normalized).slice(0, 12);
    if (!results.length) {
      panel.hidden = false;
      panel.innerHTML = `<div class="search-empty">No matches for “${escapeHtml(normalized)}”.</div>`;
      return;
    }

    panel.hidden = false;
    panel.innerHTML = `<div class="search-result-list">${results.map(item => `
      <button class="search-result" data-view="${item.view}" data-id="${item.id}" data-category="${item.category}">
        <span class="search-result-badge">${escapeHtml(item.category)}</span>
        <span class="search-result-title">${escapeHtml(item.title)}</span>
        <span class="search-result-subtitle">${escapeHtml(item.subtitle)}</span>
        <span class="search-result-desc">${escapeHtml(item.description)}</span>
      </button>
    `).join("")}</div>`;
  }

  function bindEvents() {
    const input = document.getElementById("global-search-input");
    const panel = document.getElementById("search-results");
    if (!input) return;

    input.addEventListener("input", (e) => renderResults(e.target.value));
    input.addEventListener("focus", () => renderResults(input.value));

    if (panel) {
      panel.addEventListener("click", (e) => {
        const btn = e.target.closest(".search-result");
        if (!btn) return;
        const view = btn.dataset.view;
        if (global.FFApp && typeof global.FFApp.navigate === "function") {
          global.FFApp.navigate(view);
        }
        panel.hidden = true;
      });
    }
  }

  global.FFSearch = { renderResults, bindEvents, filterRecords };
})(window);
