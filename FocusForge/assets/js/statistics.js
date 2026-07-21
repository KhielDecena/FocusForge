/* statistics.js — aggregate stats + hand-rolled canvas bar charts (no chart libs) */
(function (global) {

  function lastNDays(n) {
    const days = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      days.push({ key: FFStorage.todayKey(d), label: d.toLocaleDateString(undefined, { weekday: "short" }) });
    }
    return days;
  }

  function drawBarChart(canvas, labels, values, color) {
    const ctx = canvas && canvas.getContext && canvas.getContext("2d");
    if (!ctx) return; // canvas 2D context unavailable in this environment
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const styles = getComputedStyle(document.documentElement);
    const gridColor = styles.getPropertyValue("--border").trim() || "#30363d";
    const textColor = styles.getPropertyValue("--text-dim").trim() || "#8b949e";

    const paddingLeft = 34, paddingBottom = 26, paddingTop = 12, paddingRight = 10;
    const chartW = w - paddingLeft - paddingRight;
    const chartH = h - paddingTop - paddingBottom;
    const maxVal = Math.max(1, ...values);

    // gridlines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.font = "10px JetBrains Mono, monospace";
    ctx.fillStyle = textColor;
    for (let i = 0; i <= 4; i++) {
      const y = paddingTop + chartH - (chartH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(w - paddingRight, y);
      ctx.globalAlpha = 0.35;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillText(Math.round((maxVal * i) / 4), 2, y + 3);
    }

    const barWidth = chartW / values.length * 0.55;
    const gap = chartW / values.length;

    values.forEach((v, i) => {
      const barH = (v / maxVal) * chartH;
      const x = paddingLeft + i * gap + (gap - barWidth) / 2;
      const y = paddingTop + chartH - barH;
      const grad = ctx.createLinearGradient(0, y, 0, paddingTop + chartH);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + "55");
      ctx.fillStyle = grad;
      roundRect(ctx, x, y, barWidth, barH, 4);
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.fillText(labels[i], x + barWidth / 2, h - 8);
    });
    ctx.textAlign = "left";
  }

  function roundRect(ctx, x, y, w, h, r) {
    if (h <= 0) h = 0.0001;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function render() {
    const state = FFStorage.get();

    const totalMinutes = FFAchievements.totalFocusMinutes(state);
    document.getElementById("s-hours").textContent = (totalMinutes / 60).toFixed(1);
    document.getElementById("s-sessions").textContent = state.focusHistory.length;
    document.getElementById("s-tasks").textContent = state.tasks.filter(t => t.done).length;
    document.getElementById("s-streak").textContent = state.streak.current;
    document.getElementById("s-longest").textContent = state.streak.longest;
    document.getElementById("s-xp").textContent = state.xp;

    // weekly chart: score per day, last 7 days
    const week = lastNDays(7);
    const weekValues = week.map(d => (state.dailyLog[d.key] ? state.dailyLog[d.key].score : 0));
    const weeklyCanvas = document.getElementById("chart-weekly");
    if (weeklyCanvas) drawBarChart(weeklyCanvas, week.map(d => d.label), weekValues, "#3B82F6");

    // monthly chart: score per day, last 30 days, grouped into 6 buckets of 5 days averaged
    const month = lastNDays(30);
    const bucketed = [];
    const bucketLabels = [];
    for (let i = 0; i < month.length; i += 5) {
      const slice = month.slice(i, i + 5);
      const avg = slice.reduce((sum, d) => sum + (state.dailyLog[d.key] ? state.dailyLog[d.key].score : 0), 0) / slice.length;
      bucketed.push(Math.round(avg));
      bucketLabels.push(`${i + 1}-${Math.min(i + 5, 30)}`);
    }
    const monthlyCanvas = document.getElementById("chart-monthly");
    if (monthlyCanvas) drawBarChart(monthlyCanvas, bucketLabels, bucketed, "#22C55E");
  }

  global.FFStatistics = { render };
})(window);
