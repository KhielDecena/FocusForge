/* calendar.js — monthly productivity heatmap */
(function (global) {
  let viewYear, viewMonth; // viewMonth 0-indexed

  function init() {
    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();
  }

  function scoreColor(score) {
    if (score === undefined || score === 0) return "dot-none";
    if (score < 35) return "dot-low";
    if (score < 70) return "dot-mid";
    return "dot-high";
  }

  function render() {
    if (viewYear === undefined) init();
    const grid = document.getElementById("cal-grid");
    const label = document.getElementById("cal-month-label");
    if (!grid || !label) return;

    const state = FFStorage.get();
    const first = new Date(viewYear, viewMonth, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    label.textContent = first.toLocaleDateString(undefined, { month: "long", year: "numeric" });

    let html = "";
    for (let i = 0; i < startDay; i++) html += `<div class="cal-cell cal-empty"></div>`;
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(viewYear, viewMonth, day);
      const key = FFStorage.todayKey(d);
      const log = state.dailyLog[key];
      const cls = scoreColor(log ? log.score : 0);
      const isToday = key === FFStorage.todayKey();
      html += `<div class="cal-cell ${cls} ${isToday ? "cal-today" : ""}" title="${key} · score ${log ? log.score : 0}">
        <span class="cal-daynum">${day}</span>
      </div>`;
    }
    grid.innerHTML = html;
  }

  function bindEvents() {
    document.getElementById("cal-prev").addEventListener("click", () => {
      viewMonth -= 1;
      if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
      render();
    });
    document.getElementById("cal-next").addEventListener("click", () => {
      viewMonth += 1;
      if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
      render();
    });
  }

  global.FFCalendar = { render, bindEvents };
})(window);
