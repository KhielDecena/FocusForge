/* profile.js — onboarding and personalization for FocusForge */
(function (global) {
  function ensureProfile() {
    const state = FFStorage.get();
    if (!state.profile) {
      state.profile = {
        name: "",
        goal: "Build discipline",
        focusStyle: "Balanced",
        dailyTarget: "2 focus sessions",
        needsSetup: true
      };
      return state.profile;
    }

    state.profile = {
      name: state.profile.name || "",
      goal: state.profile.goal || "Build discipline",
      focusStyle: state.profile.focusStyle || "Balanced",
      dailyTarget: state.profile.dailyTarget || "2 focus sessions",
      needsSetup: typeof state.profile.needsSetup === "boolean" ? state.profile.needsSetup : !state.profile.name
    };

    return state.profile;
  }

  function setProfile(profileData) {
    FFStorage.set(state => {
      state.profile = {
        ...ensureProfile(),
        ...profileData,
        needsSetup: false
      };
    });
    updateProfileFields();
    updatePageIdentity();
    if (global.FFDashboard) global.FFDashboard.render();
  }

  function updatePageIdentity() {
    const profile = ensureProfile();
    const name = profile.name?.trim();
    const title = name ? `${name}'s FocusForge` : "FocusForge";
    document.title = title;
  }

  function updateProfileFields() {
    const profile = ensureProfile();
    const nameInput = document.getElementById("profile-name");
    const goalSelect = document.getElementById("profile-goal");
    const styleSelect = document.getElementById("profile-focus-style");
    const targetInput = document.getElementById("profile-daily-target");

    if (nameInput) nameInput.value = profile.name || "";
    if (goalSelect) goalSelect.value = profile.goal || "Build discipline";
    if (styleSelect) styleSelect.value = profile.focusStyle || "Balanced";
    if (targetInput) targetInput.value = profile.dailyTarget || "2 focus sessions";
  }

  function showModal() {
    const modal = document.getElementById("profile-modal");
    if (!modal) return;
    modal.classList.add("is-active");
    modal.setAttribute("aria-hidden", "false");
    const nameInput = document.getElementById("profile-name");
    if (nameInput) nameInput.focus();
  }

  function hideModal() {
    const modal = document.getElementById("profile-modal");
    if (!modal) return;
    modal.classList.remove("is-active");
    modal.setAttribute("aria-hidden", "true");
  }

  function handleSubmit(event) {
    event.preventDefault();
    const name = document.getElementById("profile-name")?.value?.trim() || "";
    if (!name) {
      document.getElementById("profile-name")?.focus();
      return;
    }

    setProfile({
      name,
      goal: document.getElementById("profile-goal")?.value || "Build discipline",
      focusStyle: document.getElementById("profile-focus-style")?.value || "Balanced",
      dailyTarget: document.getElementById("profile-daily-target")?.value || "2 focus sessions"
    });
    hideModal();
  }

  function handleSkip() {
    setProfile({
      name: ensureProfile().name || "",
      goal: "Build discipline",
      focusStyle: "Balanced",
      dailyTarget: "2 focus sessions"
    });
    hideModal();
  }

  function bindEvents() {
    document.getElementById("profile-form")?.addEventListener("submit", handleSubmit);
    document.getElementById("profile-close")?.addEventListener("click", hideModal);
    document.getElementById("profile-skip")?.addEventListener("click", handleSkip);
    document.getElementById("profile-edit-btn")?.addEventListener("click", showModal);
    document.getElementById("profile-modal")?.addEventListener("click", event => {
      if (event.target.id === "profile-modal") hideModal();
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") hideModal();
    });
  }

  function init() {
    ensureProfile();
    updateProfileFields();
    updatePageIdentity();
    bindEvents();

    if (ensureProfile().needsSetup) {
      showModal();
    }
  }

  global.FFProfile = { init, bindEvents, ensureProfile, showModal, hideModal, setProfile };
})(window);
