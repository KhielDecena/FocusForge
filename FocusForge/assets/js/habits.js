/* habits.js — advanced habit tracking with frequencies, heatmaps, streak graphs, and completion percentages */
(function (global) {
  const DAY_MS = 86400000;

  function normalizeHabit(habit) {
    return {
      ...habit,
      frequency: habit.frequency || "daily",
      target: Number(habit.target) || 1,
      customIntervalDays: Number(habit.customIntervalDays) || 3,
      log: habit.log || {}
    };
  }

  function ensureHabitsShape() {
    const state = FFStorage.get();
    let changed = false;
    const habits = state.habits.map((habit, index) => {
      const nextHabit = normalizeHabit(habit);
      if (nextHabit.id !== habit.id || nextHabit.frequency !== habit.frequency || nextHabit.target !== (habit.target || 1) || nextHabit.customIntervalDays !== (habit.customIntervalDays || 3)) {
        changed = true;
      }
      return nextHabit;
    });

    if (changed) {
      FFStorage.set(s => {
        s.habits = habits;
      });
    }

    return FFStorage.get();
  }

  function isCheckedToday(habit) {
    return !!habit.log[FFStorage.todayKey()];
  }

  function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function sortDates(log) {
    return Object.keys(log || {}).filter(key => !!log[key]).sort();
  }

  function hasCompletionInRange(habit, startDate, endDate) {
    return sortDates(habit.log).some(key => {
      if (!key) return false;
      const date = new Date(`${key}T00:00:00`);
      return date >= startDate && date <= endDate;
    });
  }

  function startOfWeek(date) {
    const copy = new Date(date);
    const day = copy.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    copy.setDate(copy.getDate() + diff);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  function startOfMonth(date) {
    const copy = new Date(date);
    copy.setDate(1);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  function getPeriodBounds(date, habit) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    switch (habit.frequency) {
      case "weekly":
        return { start: startOfWeek(copy), end: new Date(startOfWeek(copy).getTime() + 6 * DAY_MS) };
      case "monthly": {
        const start = startOfMonth(copy);
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        end.setHours(0, 0, 0, 0);
        return { start, end };
      }
      case "custom": {
        const interval = Math.max(1, Number(habit.customIntervalDays || 3));
        return { start: new Date(copy.getTime() - (interval - 1) * DAY_MS), end: copy };
      }
      default:
        return { start: copy, end: copy };
    }
  }

  function computeStreak(habit) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let cursor = new Date(today);

    if (habit.frequency === "weekly") {
      while (hasCompletionInRange(habit, startOfWeek(cursor), new Date(startOfWeek(cursor).getTime() + 6 * DAY_MS))) {
        streak += 1;
        cursor = new Date(cursor.getTime() - 7 * DAY_MS);
      }
      return streak;
    }

    if (habit.frequency === "monthly") {
      while (hasCompletionInRange(habit, startOfMonth(cursor), new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0))) {
        streak += 1;
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
        cursor.setHours(0, 0, 0, 0);
      }
      return streak;
    }

    if (habit.frequency === "custom") {
      const interval = Math.max(1, Number(habit.customIntervalDays || 3));
      while (hasCompletionInRange(habit, new Date(cursor.getTime() - (interval - 1) * DAY_MS), cursor)) {
        streak += 1;
        cursor = new Date(cursor.getTime() - interval * DAY_MS);
      }
      return streak;
    }

    while (habit.log[getDateKey(cursor)]) {
      streak += 1;
      cursor = new Date(cursor.getTime() - DAY_MS);
    }
    return streak;
  }

  function dailyStreak(habit) {
    return computeStreak(habit);
  }

  function weeklyCount(habit) {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end.getTime() - 6 * DAY_MS);
    return sortDates(habit.log).filter(key => {
      const date = new Date(`${key}T00:00:00`);
      return date >= start && date <= end;
    }).length;
  }

  function monthlyCount(habit) {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end.getTime() - 29 * DAY_MS);
    return sortDates(habit.log).filter(key => {
      const date = new Date(`${key}T00:00:00`);
      return date >= start && date <= end;
    }).length;
  }

  function getCompletionPercentage(habit, days = 30) {
    const rangeDays = Math.max(1, days);
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end.getTime() - (rangeDays - 1) * DAY_MS);
    const actual = sortDates(habit.log).filter(key => {
      const date = new Date(`${key}T00:00:00`);
      return date >= start && date <= end;
    }).length;

    let expected = rangeDays;
    if (habit.frequency === "weekly") expected = Math.max(1, Math.ceil(rangeDays / 7));
    if (habit.frequency === "monthly") expected = Math.max(1, Math.ceil(rangeDays / 30));
    if (habit.frequency === "custom") expected = Math.max(1, Math.ceil(rangeDays / Math.max(1, Number(habit.customIntervalDays || 3))));

    return expected ? Math.min(100, Math.round((actual / expected) * 100)) : 0;
  }

  function getFrequencyLabel(habit) {
    return habit.frequency === "custom" ? `Every ${habit.customIntervalDays || 3} days` : habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1);
  }

  function renderHeatmap(habit) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cells = [];

    for (let i = 34; i >= 0; i--) {
      const date = new Date(today.getTime() - i * DAY_MS);
      const key = getDateKey(date);
      const done = !!habit.log[key];
      cells.push(`<span class="habit-heat-cell ${done ? "is-on" : ""}" title="${key}"></span>`);
    }

    return `<div class="habit-heatmap">${cells.join("")}</div>`;
  }

  function renderTrendBars(habit) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bars = [];

    if (habit.frequency === "weekly") {
      for (let i = 9; i >= 0; i--) {
        const cursor = new Date(today.getTime() - i * 7 * DAY_MS);
        const done = hasCompletionInRange(habit, startOfWeek(cursor), new Date(startOfWeek(cursor).getTime() + 6 * DAY_MS));
        bars.push(`<span class="habit-trend-bar ${done ? "is-on" : ""}" style="height:${done ? 32 + (i % 3) * 12 : 16}%"></span>`);
      }
    } else if (habit.frequency === "monthly") {
      for (let i = 9; i >= 0; i--) {
        const cursor = new Date(today.getFullYear(), today.getMonth() - i, 1);
        cursor.setHours(0, 0, 0, 0);
        const done = hasCompletionInRange(habit, startOfMonth(cursor), new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0));
        bars.push(`<span class="habit-trend-bar ${done ? "is-on" : ""}" style="height:${done ? 32 + (i % 3) * 12 : 16}%"></span>`);
      }
    } else if (habit.frequency === "custom") {
      const interval = Math.max(1, Number(habit.customIntervalDays || 3));
      for (let i = 9; i >= 0; i--) {
        const cursor = new Date(today.getTime() - i * interval * DAY_MS);
        const done = hasCompletionInRange(habit, new Date(cursor.getTime() - (interval - 1) * DAY_MS), cursor);
        bars.push(`<span class="habit-trend-bar ${done ? "is-on" : ""}" style="height:${done ? 32 + (i % 3) * 12 : 16}%"></span>`);
      }
    } else {
      for (let i = 9; i >= 0; i--) {
        const cursor = new Date(today.getTime() - i * DAY_MS);
        const done = !!habit.log[getDateKey(cursor)];
        bars.push(`<span class="habit-trend-bar ${done ? "is-on" : ""}" style="height:${done ? 32 + (i % 3) * 12 : 16}%"></span>`);
      }
    }

    return `<div class="habit-trend-bars">${bars.join("")}</div>`;
  }

  function toggleHabit(id) {
    const key = FFStorage.todayKey();
    const state = FFStorage.get();
    const habit = state.habits.find(h => h.id === id);
    if (!habit) return;
    const wasChecked = !!habit.log[key];

    FFStorage.set(s => {
      const h = s.habits.find(h => h.id === id);
      const log = FFStorage.ensureDailyLog(key);
      if (wasChecked) {
        delete h.log[key];
        log.habitsCompleted = Math.max(0, log.habitsCompleted - 1);
      } else {
        h.log[key] = true;
        log.habitsCompleted += 1;
      }
      FFStorage.recomputeScore(key);
    });

    if (!wasChecked) {
      FFStorage.updateStreakForToday();
      FFXP.addXP(5, `${habit.name} habit`);
    }
    render();
    if (global.FFDashboard) global.FFDashboard.render();
    if (global.FFCalendar) global.FFCalendar.render();
    if (global.FFStatistics) global.FFStatistics.render();
  }

  function renderSummary(state) {
    const summaryEl = document.getElementById("habit-summary");
    if (!summaryEl) return;

    const habits = state.habits.map(normalizeHabit);
    const bestStreak = habits.reduce((best, habit) => Math.max(best, computeStreak(habit)), 0);
    const avgCompletion = habits.length
      ? Math.round(habits.reduce((sum, habit) => sum + getCompletionPercentage(habit), 0) / habits.length)
      : 0;

    summaryEl.innerHTML = `
      <div class="habit-summary-item">
        <div class="habit-summary-number">${habits.length}</div>
        <div class="habit-summary-label">Active habits</div>
      </div>
      <div class="habit-summary-item">
        <div class="habit-summary-number">${bestStreak}x</div>
        <div class="habit-summary-label">Best streak</div>
      </div>
      <div class="habit-summary-item">
        <div class="habit-summary-number">${avgCompletion}%</div>
        <div class="habit-summary-label">Avg completion</div>
      </div>`;
  }

  function render() {
    const grid = document.getElementById("habit-grid");
    if (!grid) return;
    const state = ensureHabitsShape();
    renderSummary(state);

    grid.innerHTML = state.habits.map(habit => {
      const normalizedHabit = normalizeHabit(habit);
      const checked = isCheckedToday(normalizedHabit);
      const streak = dailyStreak(normalizedHabit);
      const completion = getCompletionPercentage(normalizedHabit);
      return `
      <div class="habit-card ${checked ? "is-checked" : ""}">
        <div class="habit-top">
          <div class="habit-title-wrap">
            <span class="habit-icon">${normalizedHabit.icon}</span>
            <div>
              <div class="habit-name">${normalizedHabit.name}</div>
              <div class="habit-meta">${getFrequencyLabel(normalizedHabit)}</div>
            </div>
          </div>
          <button class="habit-check-btn ${checked ? "is-active" : ""}" data-id="${normalizedHabit.id}">
            ${checked ? "✓ Done" : "Mark Done"}
          </button>
        </div>
        <div class="habit-stat-grid">
          <div class="habit-stat-pill">
            <span class="habit-stat-label">Streak</span>
            <strong>${streak}x</strong>
          </div>
          <div class="habit-stat-pill">
            <span class="habit-stat-label">Completion</span>
            <strong>${completion}%</strong>
          </div>
        </div>
        <div class="habit-progress"><span style="width:${completion}%"></span></div>
        <div class="habit-visuals">
          ${renderHeatmap(normalizedHabit)}
          ${renderTrendBars(normalizedHabit)}
        </div>
        <div class="habit-footer">
          <span class="habit-pill">${weeklyCount(normalizedHabit)}/7 week</span>
          <span class="habit-pill">${monthlyCount(normalizedHabit)}/30 month</span>
        </div>
      </div>`;
    }).join("");
  }

  function handleCreateHabit(event) {
    event.preventDefault();
    const nameInput = document.getElementById("habit-name");
    const iconInput = document.getElementById("habit-icon");
    const frequencyInput = document.getElementById("habit-frequency");
    const targetInput = document.getElementById("habit-target");
    const customIntervalInput = document.getElementById("habit-custom-interval");

    const name = nameInput?.value.trim();
    if (!name) return;

    const habit = {
      id: `habit-${Date.now()}`,
      name,
      icon: iconInput?.value.trim() || "✨",
      frequency: frequencyInput?.value || "daily",
      target: Number(targetInput?.value) || 1,
      customIntervalDays: Number(customIntervalInput?.value) || 3,
      log: {}
    };

    FFStorage.set(s => {
      s.habits.push(habit);
    });

    if (nameInput) nameInput.value = "";
    if (iconInput) iconInput.value = "";
    if (frequencyInput) frequencyInput.value = "daily";
    if (targetInput) targetInput.value = "1";
    if (customIntervalInput) customIntervalInput.value = "3";

    render();
    if (global.FFDashboard) global.FFDashboard.render();
    if (global.FFCalendar) global.FFCalendar.render();
    if (global.FFStatistics) global.FFStatistics.render();
  }

  function bindEvents() {
    const grid = document.getElementById("habit-grid");
    const form = document.getElementById("habit-form");
    const frequencySelect = document.getElementById("habit-frequency");
    const customField = document.getElementById("habit-custom-field");

    function syncCustomField() {
      if (customField && frequencySelect) {
        customField.classList.toggle("is-visible", frequencySelect.value === "custom");
      }
    }

    if (grid) {
      grid.addEventListener("click", (e) => {
        const btn = e.target.closest(".habit-check-btn");
        if (btn) toggleHabit(btn.dataset.id);
      });
    }

    if (form) {
      form.addEventListener("submit", handleCreateHabit);
    }

    if (frequencySelect) {
      frequencySelect.addEventListener("change", syncCustomField);
      syncCustomField();
    }
  }

  global.FFHabits = { toggleHabit, dailyStreak, weeklyCount, monthlyCount, render, bindEvents };
})(window);
