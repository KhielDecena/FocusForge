/* xp.js — XP, levels, toast notifications, floating XP popups */
(function (global) {

  // XP required to COMPLETE a given level (increasing curve)
  function xpForLevel(level) {
    return Math.round(100 * Math.pow(level, 1.35));
  }

  function totalXpToReachLevel(level) {
    let total = 0;
    for (let l = 1; l < level; l++) total += xpForLevel(l);
    return total;
  }

  function computeLevelInfo(totalXp) {
    let level = 1;
    let remaining = totalXp;
    while (remaining >= xpForLevel(level)) {
      remaining -= xpForLevel(level);
      level += 1;
    }
    return { level, xpIntoLevel: remaining, xpForThisLevel: xpForLevel(level) };
  }

  function toast(message, kind) {
    const layer = document.getElementById("xp-toast-layer");
    if (!layer) return;
    const el = document.createElement("div");
    el.className = `toast toast-${kind || "info"}`;
    el.textContent = message;
    layer.appendChild(el);
    requestAnimationFrame(() => el.classList.add("toast-show"));
    setTimeout(() => {
      el.classList.remove("toast-show");
      setTimeout(() => el.remove(), 300);
    }, 2600);
  }

  function xpPopup(amount) {
    const layer = document.getElementById("xp-toast-layer");
    if (!layer) return;
    const el = document.createElement("div");
    el.className = "xp-popup";
    el.textContent = `+${amount} XP`;
    layer.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  function confetti() {
    const layer = document.getElementById("confetti-layer");
    if (!layer) return;
    const colors = ["#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#E6EDF3"];
    for (let i = 0; i < 60; i++) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = (2 + Math.random() * 1.5) + "s";
      piece.style.animationDelay = (Math.random() * 0.4) + "s";
      layer.appendChild(piece);
      setTimeout(() => piece.remove(), 4000);
    }
  }

  function addXP(amount, reason) {
    const state = FFStorage.get();
    const before = computeLevelInfo(state.xp);
    FFStorage.set(s => { s.xp += amount; });
    const after = computeLevelInfo(FFStorage.get().xp);

    xpPopup(amount);
    if (reason) toast(`${reason} · +${amount} XP`, "xp");

    if (after.level > before.level) {
      FFStorage.set(s => { s.level = after.level; });
      confetti();
      setTimeout(() => toast(`Level Up! You reached Level ${after.level}`, "levelup"), 250);
    } else {
      FFStorage.set(s => { s.level = after.level; });
    }

    if (global.FFDashboard) global.FFDashboard.render();
    if (global.FFAchievements) global.FFAchievements.checkAll();
  }

  global.FFXP = { xpForLevel, computeLevelInfo, addXP, toast, xpPopup, confetti };
})(window);
