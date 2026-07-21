/* focus.js — the core Focus Mode timer experience */
(function (global) {
  const MOTIVATIONS = [
    "Stay with it. One session at a time.",
    "Discipline is choosing what you want most over what you want now.",
    "Small sessions, repeated, build mastery.",
    "No notifications. No noise. Just this.",
    "You don't need motivation. You need this timer.",
    "Future you is grateful for this session.",
    "Depth over speed. Stay in it.",
    "The work is the reward."
  ];

  let selectedMinutes = 25;
  let totalSeconds = 25 * 60;
  let remainingSeconds = 25 * 60;
  let timerId = null;
  let isPaused = false;
  let currentTaskId = "";
  let currentTaskLabel = "";

  const RING_CIRCUMFERENCE = 2 * Math.PI * 115;

  function selectPreset(mins) {
    selectedMinutes = mins;
    totalSeconds = mins * 60;
    remainingSeconds = totalSeconds;
    document.querySelectorAll(".preset-btn").forEach(b => {
      b.classList.toggle("is-active", Number(b.dataset.mins) === mins);
    });
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function beginSession() {
    const select = document.getElementById("focus-task-select");
    currentTaskId = select.value;
    const state = FFStorage.get();
    const task = state.tasks.find(t => t.id === currentTaskId);
    currentTaskLabel = task ? task.text : "Deep, undistracted work";

    document.getElementById("overlay-task").textContent = currentTaskLabel;
    document.getElementById("overlay-motivation").textContent =
      MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)];
    document.getElementById("overlay-pause").textContent = "Pause";
    isPaused = false;

    remainingSeconds = totalSeconds;
    updateOverlay();
    document.getElementById("focus-overlay").classList.add("is-active");
    requestFullscreenIfPossible();

    clearInterval(timerId);
    timerId = setInterval(tick, 1000);
  }

  function requestFullscreenIfPossible() {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (req) { req.call(el).catch(() => {}); }
  }

  function exitFullscreenIfActive() {
    if (document.fullscreenElement) {
      (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
    }
  }

  function tick() {
    if (isPaused) return;
    remainingSeconds -= 1;
    updateOverlay();
    if (remainingSeconds <= 0) {
      completeSession();
    }
  }

  function updateOverlay() {
    document.getElementById("overlay-time").textContent = formatTime(remainingSeconds);
    const progress = 1 - remainingSeconds / totalSeconds;
    const ring = document.getElementById("overlay-ring");
    ring.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;
    ring.style.strokeDashoffset = `${RING_CIRCUMFERENCE * (1 - progress)}`;
  }

  function togglePause() {
    isPaused = !isPaused;
    document.getElementById("overlay-pause").textContent = isPaused ? "Resume" : "Pause";
  }

  function endSession(completedFully) {
    clearInterval(timerId);
    document.getElementById("focus-overlay").classList.remove("is-active");
    exitFullscreenIfActive();
    FFSounds.stop();

    const minutesDone = Math.round((totalSeconds - remainingSeconds) / 60);
    if (minutesDone < 1) return;

    FFStorage.set(s => {
      s.focusHistory.push({ date: new Date().toISOString(), minutes: minutesDone, task: currentTaskLabel });
      const key = FFStorage.todayKey();
      const log = FFStorage.ensureDailyLog(key);
      log.focusMinutes += minutesDone;
      FFStorage.recomputeScore(key);
    });
    FFStorage.updateStreakForToday();

    if (completedFully) {
      FFXP.addXP(50, "Focus session complete");
    } else if (minutesDone >= 1) {
      FFXP.addXP(Math.max(5, Math.round(minutesDone * (50 / selectedMinutes))), "Partial focus session");
    }

    if (global.FFCalendar) global.FFCalendar.render();
    if (global.FFStatistics) global.FFStatistics.render();
    if (global.FFDashboard) global.FFDashboard.render();
  }

  function completeSession() {
    endSession(true);
  }

  function bindEvents() {
    document.querySelectorAll(".preset-btn").forEach(btn => {
      btn.addEventListener("click", () => selectPreset(Number(btn.dataset.mins)));
    });
    document.getElementById("custom-mins").addEventListener("change", (e) => {
      const v = Math.max(1, Math.min(240, Number(e.target.value) || 25));
      document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("is-active"));
      selectedMinutes = v;
      totalSeconds = v * 60;
      remainingSeconds = totalSeconds;
    });
    document.getElementById("begin-focus-btn").addEventListener("click", beginSession);
    document.getElementById("overlay-pause").addEventListener("click", togglePause);
    document.getElementById("overlay-end").addEventListener("click", () => endSession(false));
    document.getElementById("mission-start-focus").addEventListener("click", () => {
      FFApp.navigate("focus");
    });
    selectPreset(25);
  }

  global.FFFocus = { bindEvents, selectPreset, beginSession };
})(window);
