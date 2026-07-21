/* app.js — wires every module together and drives view navigation */
(function (global) {

  function navigate(viewName) {
    document.querySelectorAll(".view").forEach(v => v.classList.toggle("is-active", v.dataset.view === viewName));
    document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("is-active", b.dataset.view === viewName));
    document.getElementById("sidebar").classList.remove("is-open");

    if (viewName === "statistics") FFStatistics.render();
    if (viewName === "calendar") FFCalendar.render();
    if (viewName === "habits") FFHabits.render();
    if (viewName === "achievements") FFAchievements.render();
    if (viewName === "braindump") FFBrainDump.render();
    if (viewName === "tasks") FFTasks.render();
  }

  function bindNav() {
    document.querySelectorAll(".nav-item").forEach(btn => {
      btn.addEventListener("click", () => navigate(btn.dataset.view));
    });
    document.getElementById("mobile-nav-toggle").addEventListener("click", () => {
      document.getElementById("sidebar").classList.toggle("is-open");
    });
  }

  function init() {
    FFTheme.init();
    FFProfile.init();
    FFTasks.bindEvents();
    FFHabits.bindEvents();
    FFFocus.bindEvents();
    FFSounds.bindEvents();
    FFCalendar.bindEvents();
    FFBrainDump.bindEvents();
    FFDashboard.bindEvents();
    FFSearch.bindEvents();
    bindNav();

    FFTasks.render();
    FFHabits.render();
    FFCalendar.render();
    FFBrainDump.render();
    FFStatistics.render();
    FFAchievements.render();
    FFDashboard.render();
    FFPlant.render();
    FFSearch.renderResults("");

    navigate("dashboard");
  }

  global.FFApp = { navigate, init };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
