/* dashboard.js — the command-center home view */
(function (global) {

  const QUOTES = [
    "Discipline is the bridge between goals and accomplishment.",
    "You don't rise to the level of your goals, you fall to the level of your systems.",
    "Small daily improvements are the key to staggering long-term results.",
    "Focus is a decision, made over and over, quietly.",
    "The successful warrior is the average person with laser-like focus.",
    "What you do consistently matters more than what you do occasionally.",
    "Motivation gets you started. Discipline keeps you going.",
    "Deep work is the superpower of the 21st century.",
    "One focused hour beats four distracted ones.",
    "Progress, not perfection."
  ];

  const CHALLENGES = [
    { type: "study_hours", text: "Study for 2 hours today.", reward: 25, test: (s, log) => log.focusMinutes >= 120 },
    { type: "tasks_3", text: "Complete 3 tasks today.", reward: 25, test: (s, log) => log.tasksCompleted >= 3 },
    { type: "one_session", text: "Finish one focus session.", reward: 25, test: (s) => hasSessionToday(s) },
    { type: "all_habits", text: "Complete all your habits today.", reward: 25, test: (s, log) => log.habitsCompleted >= s.habits.length },
    { type: "no_social", text: "Stay off social media for 1 hour (self-reported).", reward: 25, test: () => true }
  ];

  function hasSessionToday(s) {
    const todayKey = FFStorage.todayKey();
    return s.focusHistory.some(f => f.date.slice(0, 10) === todayKey);
  }

  function ensureDailyChallenge() {
    const key = FFStorage.todayKey();
    const state = FFStorage.get();
    if (state.dailyChallenge.date !== key) {
      const pick = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
      FFStorage.set(s => {
        s.dailyChallenge = { date: key, text: pick.text, reward: pick.reward, done: false, type: pick.type };
      });
    }
  }

  function checkChallengeAutoComplete() {
    const state = FFStorage.get();
    const key = FFStorage.todayKey();
    const log = state.dailyLog[key] || { tasksCompleted: 0, focusMinutes: 0, habitsCompleted: 0 };
    const def = CHALLENGES.find(c => c.type === state.dailyChallenge.type);
    if (def && !state.dailyChallenge.done && def.test(state, log) && def.type !== "no_social") {
      completeChallenge();
    }
  }

  function completeChallenge() {
    const state = FFStorage.get();
    if (state.dailyChallenge.done) return;
    FFStorage.set(s => { s.dailyChallenge.done = true; });
    FFXP.addXP(state.dailyChallenge.reward, "Daily Challenge");
  }

  function updateGreeting() {
    const state = FFStorage.get();
    const profile = state.profile || {};
    const hour = new Date().getHours();
    let text = "Good Evening";
    if (hour < 12) text = "Good Morning";
    else if (hour < 18) text = "Good Afternoon";

    const name = (profile.name || "").trim();
    document.getElementById("greeting-text").textContent = name ? `${text}, ${name}` : text;
  }

  function updateClock() {
    const now = new Date();
    document.getElementById("live-clock").textContent = now.toLocaleTimeString();
    document.getElementById("live-date").textContent = now.toLocaleDateString(undefined, {
      weekday: "long", month: "long", day: "numeric"
    });
  }

  function updateQuote() {
    document.getElementById("quote-of-day").textContent =
      "“" + QUOTES[Math.floor(Math.random() * QUOTES.length)] + "”";
  }

  function updateScrollProgress() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const pct = maxScroll > 0 ? Math.min(100, (window.scrollY / maxScroll) * 100) : 0;
    const bar = document.getElementById("scroll-progress");
    if (bar) bar.style.width = pct + "%";
  }

  function updateMomentumCard() {
    const state = FFStorage.get();
    const key = FFStorage.todayKey();
    const todayLog = state.dailyLog[key];
    const focusScore = todayLog ? todayLog.score : 0;
    const streak = state.streak.current;
    const profile = state.profile || {};
    const name = (profile.name || "").trim();
    const goal = (profile.goal || "Build discipline").toLowerCase();

    let pillText = "Momentum ready";
    let titleText = name ? `Welcome back, ${name}.` : "A calmer, sharper day starts here.";
    let bodyText = `You’re building habits around your ${goal} goals.`;

    if (focusScore >= 80) {
      pillText = "Momentum soaring";
      titleText = name ? `${name}, your focus is glowing today.` : "Your focus is glowing today.";
      bodyText = `You’re at ${focusScore}% focus today — keep that energy rolling.`;
    } else if (focusScore >= 50) {
      pillText = "Steady progress";
      titleText = name ? `${name}, you’re in a strong rhythm.` : "You’re in a strong rhythm.";
      bodyText = `You’ve kept your streak alive with ${focusScore}% focus today.`;
    } else if (streak >= 3) {
      pillText = "Streak alive";
      titleText = name ? `${name}, consistency is working for you.` : "Consistency is working for you.";
      bodyText = `Your ${streak}-day streak is proof that small steps matter.`;
    }

    const pill = document.getElementById("momentum-pill");
    const title = document.getElementById("momentum-title");
    const body = document.getElementById("momentum-text");

    if (pill) pill.textContent = pillText;
    if (title) title.textContent = titleText;
    if (body) body.textContent = bodyText;
  }

  const RING_CIRCUMFERENCE = 2 * Math.PI * 60;

  function render() {
    const state = FFStorage.get();
    ensureDailyChallenge();
    checkChallengeAutoComplete();

    // stat strip
    const levelInfo = FFXP.computeLevelInfo(state.xp);
    document.getElementById("stat-level").textContent = levelInfo.level;
    document.getElementById("stat-xp").textContent = state.xp;
    document.getElementById("stat-streak").textContent = state.streak.current + "d";

    const key = FFStorage.todayKey();
    const todayLog = state.dailyLog[key];
    const focusScore = todayLog ? todayLog.score : 0;
    document.getElementById("stat-focus-score").textContent = focusScore + "%";

    updateMomentumCard();

    // mission
    const top3 = FFTasks.getTop3();
    const missionTask = top3[0] || FFTasks.getIncomplete()[0];
    document.getElementById("mission-task").textContent = missionTask ? missionTask.text : "No tasks yet — add your Top 3.";

    // progress ring (today's score as %)
    const ring = document.getElementById("dash-ring");
    ring.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;
    ring.style.strokeDashoffset = `${RING_CIRCUMFERENCE * (1 - focusScore / 100)}`;
    document.getElementById("ring-percent").textContent = focusScore + "%";

    // level card
    document.getElementById("level-badge").textContent = "Lv " + levelInfo.level;
    const pct = Math.min(100, (levelInfo.xpIntoLevel / levelInfo.xpForThisLevel) * 100);
    document.getElementById("dash-xp-fill").style.width = pct + "%";
    document.getElementById("dash-xp-text").textContent = `${levelInfo.xpIntoLevel} / ${levelInfo.xpForThisLevel} XP`;

    // top3 list
    const top3list = document.getElementById("top3-list");
    top3list.innerHTML = top3.map(t => `<li class="top3-line"><span class="tag tag-${t.category.toLowerCase()}">${t.category}</span> ${t.text}</li>`).join("")
      || `<li class="empty-state">Pin up to 3 tasks from the Tasks view.</li>`;

    // challenge
    document.getElementById("challenge-text").textContent = state.dailyChallenge.text;
    document.getElementById("challenge-reward").textContent = "+" + state.dailyChallenge.reward + " XP";
    const checkBtn = document.getElementById("challenge-check");
    checkBtn.textContent = state.dailyChallenge.done ? "Completed ✓" : "Mark Complete";
    checkBtn.disabled = state.dailyChallenge.done;

    if (global.FFPlant) global.FFPlant.render();
    if (global.FFAchievements) global.FFAchievements.render();
  }

  function bindEvents() {
    document.getElementById("challenge-check").addEventListener("click", completeChallenge);
    document.getElementById("top3-manage").addEventListener("click", () => FFApp.navigate("tasks"));
    document.getElementById("hero-start-focus")?.addEventListener("click", () => FFApp.navigate("focus"));
    document.getElementById("hero-open-tasks")?.addEventListener("click", () => FFApp.navigate("tasks"));
    updateGreeting();
    updateQuote();
    updateClock();
    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    setInterval(updateClock, 1000);
  }

  global.FFDashboard = { render, bindEvents };
})(window);
