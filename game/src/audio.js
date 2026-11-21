// Nightshift: The Meridian Vault - all sound is synthesized with WebAudio.
// No audio files ship with the game: every beep, footstep and sting is made
// here, so the game plays fully offline.
export function makeAudio() {
  let ctx = null;
  let muted = false;
  let master = null;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    return ctx;
  }

  function tone(freq, dur, type, vol, when, slideTo) {
    const c = ensure();
    if (!c || muted) return;
    const t0 = c.currentTime + (when || 0);
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noiseBurst(dur, vol, freq) {
    const c = ensure();
    if (!c || muted) return;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq || 900;
    const gain = c.createGain();
    gain.gain.value = vol || 0.12;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start();
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    step(sneaking) {
      noiseBurst(0.05, sneaking ? 0.03 : 0.08, sneaking ? 500 : 900);
    },
    pickup() {
      tone(660, 0.09, 'sine', 0.22, 0);
      tone(990, 0.14, 'sine', 0.22, 0.08);
    },
    coin() {
      tone(1250, 0.07, 'triangle', 0.16, 0);
      tone(1750, 0.1, 'triangle', 0.14, 0.05);
    },
    coinLand() {
      noiseBurst(0.08, 0.2, 2400);
      tone(880, 0.06, 'triangle', 0.1, 0.02);
    },
    alert() {
      tone(220, 0.22, 'sawtooth', 0.2, 0, 440);
      tone(440, 0.22, 'sawtooth', 0.16, 0.1, 660);
    },
    caught() {
      tone(196, 0.3, 'sawtooth', 0.24, 0, 98);
      tone(147, 0.4, 'sawtooth', 0.2, 0.18, 73);
    },
    clear() {
      tone(523, 0.12, 'sine', 0.22, 0);
      tone(659, 0.12, 'sine', 0.22, 0.11);
      tone(784, 0.2, 'sine', 0.24, 0.22);
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'sine', 0.22, i * 0.13));
    },
    click() {
      tone(520, 0.05, 'square', 0.08, 0);
    },
  };
}
