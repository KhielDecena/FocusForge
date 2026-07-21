/* storage.js
   Single source of truth for all persisted FocusForge data.
   Everything lives under one LocalStorage key so we never end up with
   half-migrated or orphaned fragments across versions.
*/
(function (global) {
  const KEY = "focusforge_state_v1";

  const DEFAULT_HABITS = [
    { id: "programming", name: "Programming", icon: "💻", frequency: "daily", target: 1, customIntervalDays: 3 },
    { id: "math", name: "Math", icon: "∑", frequency: "weekly", target: 1, customIntervalDays: 3 },
    { id: "reading", name: "Reading", icon: "📖", frequency: "daily", target: 1, customIntervalDays: 3 },
    { id: "exercise", name: "Exercise", icon: "🏋", frequency: "weekly", target: 1, customIntervalDays: 3 },
    { id: "sleep", name: "Sleep", icon: "🌙", frequency: "daily", target: 1, customIntervalDays: 3 },
    { id: "water", name: "Water Intake", icon: "💧", frequency: "daily", target: 1, customIntervalDays: 3 }
  ];

  function todayKey(d) {
    const date = d || new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function defaultState() {
    return {
      version: 1,
      theme: "dark",
      xp: 0,
      level: 1,
      profile: {
        name: "",
        goal: "Build discipline",
        focusStyle: "Balanced",
        dailyTarget: "2 focus sessions",
        needsSetup: true
      },
      tasks: [],           // {id, text, category, done, top3, createdAt, completedAt}
      habits: DEFAULT_HABITS.map(h => ({ ...h, log: {} })), // log: {"YYYY-MM-DD": true}
      brainDump: [],        // {id, text, createdAt}
      notes: [],            // {id, title, content, createdAt}
      goals: [],            // {id, title, description, status, createdAt}
      journalEntries: [],   // {id, title, content, createdAt}
      projects: [],         // {id, name, description, status, createdAt}
      achievements: {},     // {id: unlockedAtISOString}
      dailyChallenge: { date: null, text: "", reward: 25, done: false, type: null },
      focusHistory: [],     // {date, minutes, task}
      dailyLog: {},         // {"YYYY-MM-DD": {tasksCompleted, focusMinutes, habitsCompleted, score}}
      streak: { current: 0, longest: 0, lastActiveDate: null },
      lastPlantCheck: null
    };
  }

  function normalizeHabit(habit, index) {
    const fallback = DEFAULT_HABITS[index] || DEFAULT_HABITS[0];
    return {
      id: habit.id || fallback.id || `habit-${index + 1}`,
      name: habit.name || fallback.name || `Habit ${index + 1}`,
      icon: habit.icon || fallback.icon || "✨",
      frequency: habit.frequency || fallback.frequency || "daily",
      target: Number(habit.target) || Number(fallback.target) || 1,
      customIntervalDays: Number(habit.customIntervalDays) || Number(fallback.customIntervalDays) || 3,
      log: habit.log || {}
    };
  }

  function normalizeState(parsed) {
    const base = defaultState();
    const normalizedHabits = Array.isArray(parsed.habits)
      ? parsed.habits.map((habit, index) => normalizeHabit(habit, index))
      : base.habits;

    return {
      ...base,
      ...parsed,
      profile: {
        ...base.profile,
        ...(parsed.profile || {})
      },
      habits: normalizedHabits,
      notes: Array.isArray(parsed.notes) ? parsed.notes : base.notes,
      goals: Array.isArray(parsed.goals) ? parsed.goals : base.goals,
      journalEntries: Array.isArray(parsed.journalEntries) ? parsed.journalEntries : base.journalEntries,
      projects: Array.isArray(parsed.projects) ? parsed.projects : base.projects,
      dailyLog: parsed.dailyLog || {},
      streak: parsed.streak || base.streak
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return normalizeState(parsed);
    } catch (e) {
      console.error("FocusForge: failed to load state, resetting.", e);
      return defaultState();
    }
  }

  let state = load();

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.error("FocusForge: failed to save state.", e);
    }
  }

  function get() {
    return state;
  }

  function set(mutatorFn) {
    mutatorFn(state);
    save();
  }

  function ensureDailyLog(dateKey) {
    if (!state.dailyLog[dateKey]) {
      state.dailyLog[dateKey] = { tasksCompleted: 0, focusMinutes: 0, habitsCompleted: 0, score: 0 };
    }
    return state.dailyLog[dateKey];
  }

  function recomputeScore(dateKey) {
    const log = ensureDailyLog(dateKey);
    // Weighted productivity score 0-100: tasks + focus minutes + habits
    const taskScore = Math.min(40, log.tasksCompleted * 10);
    const focusScore = Math.min(40, (log.focusMinutes / 90) * 40);
    const habitScore = Math.min(20, log.habitsCompleted * (20 / 6));
    log.score = Math.round(taskScore + focusScore + habitScore);
    return log.score;
  }

  function updateStreakForToday() {
    const key = todayKey();
    const s = state.streak;
    if (s.lastActiveDate === key) return; // already counted today
    const yesterday = todayKey(new Date(Date.now() - 86400000));
    if (s.lastActiveDate === yesterday) {
      s.current += 1;
    } else {
      s.current = 1;
    }
    s.lastActiveDate = key;
    s.longest = Math.max(s.longest, s.current);
    save();
  }

  global.FFStorage = {
    KEY,
    get,
    set,
    save,
    todayKey,
    ensureDailyLog,
    recomputeScore,
    updateStreakForToday,
    defaultState
  };
})(window);
