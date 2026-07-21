/* plant.js — a CSS-only virtual plant that grows with consistency, wilts with inactivity */
(function (global) {

  // Stage is derived from current streak + whether today has any activity yet.
  function computeStage() {
    const state = FFStorage.get();
    const streak = state.streak.current;
    const todayKey = FFStorage.todayKey();
    const todayLog = state.dailyLog[todayKey];
    const activeToday = state.streak.lastActiveDate === todayKey;

    let daysSinceActive = 0;
    if (state.streak.lastActiveDate) {
      const last = new Date(state.streak.lastActiveDate);
      daysSinceActive = Math.floor((Date.now() - last.getTime()) / 86400000);
    } else {
      daysSinceActive = 99;
    }

    if (daysSinceActive >= 3) return { stage: 0, label: "Wilting — your plant misses you. Start a session today." };
    if (streak === 0 && !activeToday) return { stage: 1, label: "A seedling, waiting for its first day of focus." };
    if (streak < 3) return { stage: 2, label: "Sprouting nicely. Keep the streak alive." };
    if (streak < 7) return { stage: 3, label: "Growing strong — a full week is in sight." };
    if (streak < 21) return { stage: 4, label: "Thriving. Your consistency is showing." };
    return { stage: 5, label: "Flourishing — a habit truly rooted." };
  }

  function paint(stemEl, stage) {
    stemEl.className = "plant-stem stage-" + stage;
  }

  function render() {
    const stem = document.getElementById("plant-stem");
    const status = document.getElementById("plant-status");
    const sidebarPlant = document.getElementById("sidebar-plant");
    if (!stem) return;
    const { stage, label } = computeStage();
    paint(stem, stage);
    if (status) status.textContent = label;
    if (sidebarPlant) sidebarPlant.className = "mini-plant stage-" + stage;
  }

  global.FFPlant = { render, computeStage };
})(window);
