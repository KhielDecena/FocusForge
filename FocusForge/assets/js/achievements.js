/* achievements.js — achievement catalogue + unlock detection */
(function (global) {

  const BASE_CATALOGUE = [
    { id: "first_focus", name: "First Focus Session", icon: "◎", desc: "Complete your first focus session.",
      test: (s) => s.focusHistory.length >= 1 },
    { id: "tasks_10", name: "10 Tasks Completed", icon: "▤", desc: "Complete 10 tasks.",
      test: (s) => s.tasks.filter(t => t.done).length >= 10 },
    { id: "tasks_50", name: "50 Tasks Completed", icon: "▤", desc: "Complete 50 tasks.",
      test: (s) => s.tasks.filter(t => t.done).length >= 50 },
    { id: "tasks_100", name: "100 Tasks Completed", icon: "▤", desc: "Complete 100 tasks.",
      test: (s) => s.tasks.filter(t => t.done).length >= 100 },
    { id: "streak_7", name: "7 Day Streak", icon: "🔥", desc: "Stay active 7 days in a row.",
      test: (s) => s.streak.longest >= 7 },
    { id: "streak_30", name: "30 Day Streak", icon: "🔥", desc: "Stay active 30 days in a row.",
      test: (s) => s.streak.longest >= 30 },
    { id: "hours_100", name: "100 Hours Studied", icon: "⏱", desc: "Log 100 hours of focus time.",
      test: (s) => totalFocusMinutes(s) >= 100 * 60 },
    { id: "sessions_100", name: "100 Focus Sessions", icon: "◎", desc: "Complete 100 focus sessions.",
      test: (s) => s.focusHistory.length >= 100 },
    { id: "math_master", name: "Math Master", icon: "∑", desc: "Complete 30 Math habit check-ins.",
      test: (s) => habitCount(s, "math") >= 30 },
    { id: "programming_master", name: "Programming Master", icon: "💻", desc: "Complete 30 Programming habit check-ins.",
      test: (s) => habitCount(s, "programming") >= 30 },
    { id: "habit_master", name: "Habit Master", icon: "✚", desc: "Complete all habits in a single day, 10 times.",
      test: (s) => Object.values(s.dailyLog).filter(l => l.habitsCompleted >= s.habits.length).length >= 10 }
  ];

  function buildExpandedCatalogue() {
    const expanded = [];
    for (let index = 1; index <= 189; index += 1) {
      if (index <= 50) {
        const target = index;
        expanded.push({
          id: `task_milestone_${index}`,
          name: `Task Milestone ${target}`,
          icon: "▣",
          desc: `Complete ${target} tasks.`,
          test: (s) => s.tasks.filter(t => t.done).length >= target
        });
      } else if (index <= 100) {
        const target = index - 50;
        expanded.push({
          id: `session_milestone_${index}`,
          name: `Focus Milestone ${target}`,
          icon: "◎",
          desc: `Complete ${target} focus sessions.`,
          test: (s) => s.focusHistory.length >= target
        });
      } else if (index <= 150) {
        const target = index - 100;
        expanded.push({
          id: `hour_milestone_${index}`,
          name: `Hour Milestone ${target}`,
          icon: "⏱",
          desc: `Log ${target} hours of focused work.`,
          test: (s) => totalFocusMinutes(s) >= target * 60
        });
      } else {
        const target = index - 150;
        expanded.push({
          id: `streak_milestone_${index}`,
          name: `Streak Milestone ${target}`,
          icon: "⚡",
          desc: `Hold a streak of ${target} days.`,
          test: (s) => s.streak.longest >= target
        });
      }
    }
    return expanded;
  }

  const CATALOGUE = [...BASE_CATALOGUE, ...buildExpandedCatalogue()];

  function totalFocusMinutes(s) {
    return s.focusHistory.reduce((sum, f) => sum + f.minutes, 0);
  }

  function habitCount(s, habitId) {
    const h = s.habits.find(h => h.id === habitId);
    if (!h) return 0;
    return Object.values(h.log).filter(Boolean).length;
  }

  function checkAll() {
    const state = FFStorage.get();
    let newlyUnlocked = [];
    CATALOGUE.forEach(a => {
      if (!state.achievements[a.id] && a.test(state)) {
        newlyUnlocked.push(a);
      }
    });
    if (newlyUnlocked.length) {
      FFStorage.set(s => {
        newlyUnlocked.forEach(a => { s.achievements[a.id] = new Date().toISOString(); });
      });
      newlyUnlocked.forEach((a, i) => {
        setTimeout(() => {
          FFXP.toast(`Achievement Unlocked: ${a.name}`, "achievement");
          FFXP.confetti();
        }, i * 400);
      });
    }
    render();
  }

  function render() {
    const grid = document.getElementById("achievement-grid");
    if (!grid) return;
    const state = FFStorage.get();
    grid.innerHTML = CATALOGUE.map(a => {
      const unlocked = !!state.achievements[a.id];
      return `
        <div class="achievement-card ${unlocked ? "is-unlocked" : "is-locked"}">
          <div class="achievement-icon">${a.icon}</div>
          <div class="achievement-name">${a.name}</div>
          <div class="achievement-desc">${a.desc}</div>
          ${unlocked ? `<div class="achievement-date">Unlocked ${new Date(state.achievements[a.id]).toLocaleDateString()}</div>` : `<div class="achievement-locked-label">Locked</div>`}
        </div>`;
    }).join("");
  }

  global.FFAchievements = { CATALOGUE, checkAll, render, totalFocusMinutes };
})(window);
