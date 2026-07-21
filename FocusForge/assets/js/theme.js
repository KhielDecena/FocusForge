/* theme.js — dark/light theme toggle, persisted via storage.js */
(function (global) {
  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const icon = document.getElementById("theme-icon");
    if (icon) icon.textContent = theme === "dark" ? "☾" : "☀";
  }

  function init() {
    const state = FFStorage.get();
    apply(state.theme || "dark");

    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.addEventListener("click", () => {
        const s = FFStorage.get();
        const next = s.theme === "dark" ? "light" : "dark";
        FFStorage.set(st => { st.theme = next; });
        apply(next);
      });
    }
  }

  global.FFTheme = { init, apply };
})(window);
