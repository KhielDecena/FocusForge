/* sounds.js
   Focus ambient sounds, synthesized entirely with the Web Audio API.
   No external audio files are fetched, so the whole app keeps working offline
   and on GitHub Pages without needing to ship binary assets.
*/
(function (global) {
  let ctx = null;
  let activeSound = null;
  let nodes = {}; // { source, gain, filters... }
  let masterVolume = 0.5;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function makeNoiseBuffer(audioCtx, seconds = 4) {
    const bufferSize = audioCtx.sampleRate * seconds;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  function stop() {
    if (nodes.gain) {
      const g = nodes.gain;
      const now = getCtx().currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.linearRampToValueAtTime(0, now + 0.4);
    }
    const toStop = nodes;
    setTimeout(() => {
      Object.values(toStop).forEach(n => { try { n.stop && n.stop(); } catch (e) {} });
    }, 450);
    nodes = {};
    activeSound = null;
    document.querySelectorAll(".sound-btn").forEach(b => b.classList.remove("is-active"));
  }

  function buildRain(audioCtx) {
    const source = audioCtx.createBufferSource();
    source.buffer = makeNoiseBuffer(audioCtx);
    source.loop = true;
    const filter = audioCtx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 1200;
    const gain = audioCtx.createGain();
    gain.gain.value = masterVolume * 0.5;
    source.connect(filter).connect(gain).connect(audioCtx.destination);
    source.start();
    return { source, gain, filter };
  }

  function buildOcean(audioCtx) {
    const source = audioCtx.createBufferSource();
    source.buffer = makeNoiseBuffer(audioCtx);
    source.loop = true;
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 500;
    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 250;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
    const gain = audioCtx.createGain();
    gain.gain.value = masterVolume * 0.6;
    source.connect(filter).connect(gain).connect(audioCtx.destination);
    source.start();
    return { source, gain, filter, lfo };
  }

  function buildFireplace(audioCtx) {
    const source = audioCtx.createBufferSource();
    source.buffer = makeNoiseBuffer(audioCtx);
    source.loop = true;
    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 300;
    filter.Q.value = 0.6;
    const gain = audioCtx.createGain();
    gain.gain.value = masterVolume * 0.45;
    source.connect(filter).connect(gain).connect(audioCtx.destination);
    source.start();
    return { source, gain, filter };
  }

  function buildCafe(audioCtx) {
    const source = audioCtx.createBufferSource();
    source.buffer = makeNoiseBuffer(audioCtx);
    source.loop = true;
    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 800;
    filter.Q.value = 0.4;
    const gain = audioCtx.createGain();
    gain.gain.value = masterVolume * 0.35;
    source.connect(filter).connect(gain).connect(audioCtx.destination);
    source.start();
    return { source, gain, filter };
  }

  function buildNight(audioCtx) {
    const source = audioCtx.createBufferSource();
    source.buffer = makeNoiseBuffer(audioCtx);
    source.loop = true;
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    const gain = audioCtx.createGain();
    gain.gain.value = masterVolume * 0.3;
    source.connect(filter).connect(gain).connect(audioCtx.destination);
    source.start();
    return { source, gain, filter };
  }

  const BUILDERS = { rain: buildRain, ocean: buildOcean, fireplace: buildFireplace, cafe: buildCafe, night: buildNight };

  function play(name) {
    const audioCtx = getCtx();
    if (audioCtx.state === "suspended") audioCtx.resume();
    if (activeSound === name) { stop(); return; }
    if (activeSound) stop();
    const builder = BUILDERS[name];
    if (!builder) return;
    nodes = builder(audioCtx);
    activeSound = name;
    document.querySelectorAll(".sound-btn").forEach(b => {
      b.classList.toggle("is-active", b.dataset.sound === name);
    });
  }

  function setVolume(v) {
    masterVolume = v / 100;
    if (nodes.gain) nodes.gain.gain.value = masterVolume * 0.5;
  }

  function bindEvents() {
    const row = document.getElementById("sound-row");
    if (!row) return;
    row.addEventListener("click", (e) => {
      const btn = e.target.closest(".sound-btn");
      if (btn) play(btn.dataset.sound);
    });
    const vol = document.getElementById("sound-volume");
    if (vol) vol.addEventListener("input", (e) => setVolume(Number(e.target.value)));
  }

  global.FFSounds = { play, stop, setVolume, bindEvents };
})(window);
