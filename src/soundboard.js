/**
 * Glassmorphic Soundboard Module
 * Synthesizes 100% pure audio ambient tracks (Rain, Fire, Wind, Space, Keyboard)
 * using the Web Audio API without needing external network mp3 resources.
 */

let audioCtx = null;

export function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Global state tracking
const synthTracks = {
  rain: { node: null, gainNode: null, active: false, volume: 0.5 },
  campfire: { node: null, gainNode: null, active: false, volume: 0.5 },
  wind: { node: null, gainNode: null, active: false, volume: 0.5 },
  space: { node: null, gainNode: null, active: false, volume: 0.5 },
  keyboard: { node: null, gainNode: null, active: false, volume: 0.3 },
  lofi: { node: null, gainNode: null, active: false, volume: 0.4 }
};

let isMutedAll = false;

/**
 * Noise buffer builder for synthesizer
 */
function createNoiseBuffer(type, ctx) {
  const bufferSize = ctx.sampleRate * 2; // 2-second buffer
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (type === 'white') {
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  } else if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // normalize volume
      b6 = white * 0.115926;
    }
  } else if (type === 'brown') {
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.025 * white)) / 1.025;
      lastOut = data[i];
      data[i] *= 3.5; // amplify
    }
  }
  return buffer;
}

/**
 * 1. RAIN SYNTHESIZER
 */
function startRainSynth(ctx, targetNode) {
  const source = ctx.createBufferSource();
  source.buffer = createNoiseBuffer('pink', ctx);
  source.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(950, ctx.currentTime);

  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.setValueAtTime(80, ctx.currentTime);

  source.connect(lowpass);
  lowpass.connect(highpass);
  highpass.connect(targetNode);

  source.start();
  return {
    stop: () => {
      source.stop();
    }
  };
}

/**
 * 2. CAMPFIRE SYNTHESIZER (Brown hum + click bursts)
 */
function startCampfireSynth(ctx, targetNode) {
  const hum = ctx.createBufferSource();
  hum.buffer = createNoiseBuffer('brown', ctx);
  hum.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(140, ctx.currentTime);

  const humGain = ctx.createGain();
  humGain.gain.setValueAtTime(0.65, ctx.currentTime);

  hum.connect(lowpass);
  lowpass.connect(humGain);
  humGain.connect(targetNode);
  hum.start();

  // Pops loop
  let active = true;
  function triggerPop() {
    if (!active) return;

    const osc = ctx.createOscillator();
    const bandpass = ctx.createBiquadFilter();
    const popGain = ctx.createGain();

    osc.type = Math.random() > 0.5 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(700 + Math.random() * 1200, ctx.currentTime);

    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1600, ctx.currentTime);
    bandpass.Q.setValueAtTime(2.0, ctx.currentTime);

    // Short snap decay
    popGain.gain.setValueAtTime(0.08 * Math.random(), ctx.currentTime);
    popGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.005 + Math.random() * 0.015);

    osc.connect(bandpass);
    bandpass.connect(popGain);
    popGain.connect(targetNode);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);

    // Random timing for campfire spark sounds
    const delay = 120 + Math.random() * 600;
    setTimeout(triggerPop, delay);
  }
  
  triggerPop();

  return {
    stop: () => {
      hum.stop();
      active = false;
    }
  };
}

/**
 * 3. FOREST WIND SYNTHESIZER (Slow oscillating LFO)
 */
function startWindSynth(ctx, targetNode) {
  const source = ctx.createBufferSource();
  source.buffer = createNoiseBuffer('brown', ctx);
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(320, ctx.currentTime);
  filter.Q.setValueAtTime(1.5, ctx.currentTime);

  // Slow LFO to sway wind frequency
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(0.06, ctx.currentTime); // 0.06 Hz (about every 16s)

  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(120, ctx.currentTime); // sway by 120Hz

  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  source.connect(filter);
  filter.connect(targetNode);

  lfo.start();
  source.start();

  return {
    stop: () => {
      source.stop();
      lfo.stop();
    }
  };
}

/**
 * 4. DEEP SPACE SYNTHESIZER (Theta waves binaural beat)
 */
function startSpaceSynth(ctx, targetNode) {
  const oscL = ctx.createOscillator();
  const oscR = ctx.createOscillator();
  
  // Detuning to create soothing brain wave entrainment
  oscL.type = 'sine';
  oscL.frequency.setValueAtTime(80, ctx.currentTime); // Left Channel 80Hz
  
  oscR.type = 'sine';
  oscR.frequency.setValueAtTime(84, ctx.currentTime); // Right Channel 84Hz (4Hz Theta wave)

  const spaceFilter = ctx.createBiquadFilter();
  spaceFilter.type = 'lowpass';
  spaceFilter.frequency.setValueAtTime(120, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.7, ctx.currentTime); // reduce base load

  // Stereo merger
  const pannerL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  const pannerR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

  if (pannerL && pannerR) {
    pannerL.pan.setValueAtTime(-1, ctx.currentTime);
    pannerR.pan.setValueAtTime(1, ctx.currentTime);
    
    oscL.connect(pannerL);
    pannerL.connect(spaceFilter);

    oscR.connect(pannerR);
    pannerR.connect(spaceFilter);
  } else {
    oscL.connect(spaceFilter);
    oscR.connect(spaceFilter);
  }

  spaceFilter.connect(gain);
  gain.connect(targetNode);

  oscL.start();
  oscR.start();

  return {
    stop: () => {
      oscL.stop();
      oscR.stop();
    }
  };
}

/**
 * 5. MECHANICAL KEYBOARD CLICK SYNTHESIZER
 * Triggered on keydown. Note that this doesn't run a continuous loop.
 */
let activeKeyboardAxis = 'blue';

export function setKeyboardAxis(axis) {
  if (['blue', 'tea', 'red'].includes(axis)) {
    activeKeyboardAxis = axis;
  }
  return activeKeyboardAxis;
}

export function playKeyboardClick() {
  const track = synthTracks.keyboard;
  if (!track.active || isMutedAll) return;

  const ctx = getAudioContext();
  const now = ctx.currentTime;

  if (activeKeyboardAxis === 'blue') {
    // Blue Switch: High pitched click + sharp metallic click snap
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1250 + Math.random() * 250, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.025);
    
    gain.gain.setValueAtTime(track.volume * 0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    
    osc.connect(gain);
    gain.connect(track.gainNode);
    osc.start(now);
    osc.stop(now + 0.04);
    
    // Metallic spring tick click
    const tick = ctx.createOscillator();
    const tickFilter = ctx.createBiquadFilter();
    const tickGain = ctx.createGain();
    
    tick.type = 'sawtooth';
    tick.frequency.setValueAtTime(4800, now);
    
    tickFilter.type = 'highpass';
    tickFilter.frequency.setValueAtTime(3800, now);
    
    tickGain.gain.setValueAtTime(track.volume * 0.04, now);
    tickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.005);
    
    tick.connect(tickFilter);
    tickFilter.connect(tickGain);
    tickGain.connect(track.gainNode);
    tick.start(now);
    tick.stop(now + 0.01);
    
  } else if (activeKeyboardAxis === 'red') {
    // Red Switch: Linear, thocky, low frequency
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420 + Math.random() * 80, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.045);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now); // Deep muffle
    
    gain.gain.setValueAtTime(track.volume * 0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(track.gainNode);
    osc.start(now);
    osc.stop(now + 0.07);
    
  } else if (activeKeyboardAxis === 'tea') {
    // Tea Switch: Muted tactile feel, medium pitch, moderate snap
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(680 + Math.random() * 120, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.038);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, now);
    
    gain.gain.setValueAtTime(track.volume * 0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(track.gainNode);
    osc.start(now);
    osc.stop(now + 0.06);
    
    // Soft release transient tick
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'sine';
    click.frequency.setValueAtTime(2000, now);
    clickGain.gain.setValueAtTime(track.volume * 0.015, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);
    click.connect(clickGain);
    clickGain.connect(track.gainNode);
    click.start(now);
    click.stop(now + 0.01);
  }
}

/**
 * Play a relaxing multi-chime bell to notify user of timer completion
 */
export function playCompletionBell() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Additive chime nodes
  const freqs = [523.25, 659.25, 783.99, 1046.50]; // C major chord arpeggio
  
  freqs.forEach((f, idx) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, now);

    const volume = 0.08 / (idx + 1);
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.0 - (idx * 0.25));

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now + idx * 0.05);
    osc.stop(now + 2.2);
  });
}

/**
 * 6. ZEN LOFI SYNTHESIZER (Infinite procedural melody and chords)
 */
function startLofiSynth(ctx, targetNode) {
  let active = true;
  let chordIndex = 0;

  // Create delay node for ambient echo
  const delay = ctx.createDelay();
  delay.delayTime.setValueAtTime(0.4, ctx.currentTime);

  const feedback = ctx.createGain();
  feedback.gain.setValueAtTime(0.35, ctx.currentTime);

  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(targetNode);

  // Soothing chord progression
  const progressions = [
    [130.81, 164.81, 196.00, 246.94], // Cmaj7
    [110.00, 130.81, 164.81, 196.00], // Am7
    [87.31, 130.81, 174.61, 220.00],  // Fmaj7
    [98.00, 146.83, 196.00, 246.94]   // G7
  ];

  const activeOscs = [];

  // Play slow chord pads
  function playChordPad() {
    if (!active) return;
    const now = ctx.currentTime;
    const notes = progressions[chordIndex];
    chordIndex = (chordIndex + 1) % progressions.length;

    notes.forEach(f => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gainNode = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(240, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.045, now + 2.0);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 7.8);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(targetNode);

      osc.start(now);
      osc.stop(now + 8.0);
      activeOscs.push(osc);
    });

    setTimeout(playChordPad, 8000);
  }

  // Play random pentatonic chimes
  const melodyScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25]; // C pentatonic

  function playMelodyChime() {
    if (!active) return;
    const now = ctx.currentTime;
    const note = melodyScale[Math.floor(Math.random() * melodyScale.length)];

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(note, now);

    // Warm envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.06, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

    osc.connect(gainNode);
    gainNode.connect(targetNode);
    gainNode.connect(delay); // route through echo filter

    osc.start(now);
    osc.stop(now + 3.0);
    activeOscs.push(osc);

    const delayTime = 2500 + Math.random() * 2500;
    setTimeout(playMelodyChime, delayTime);
  }

  playChordPad();
  setTimeout(playMelodyChime, 1500);

  return {
    stop: () => {
      active = false;
      activeOscs.forEach(o => {
        try { o.stop(); } catch(e) {}
      });
    }
  };
}

/**
 * Hook up global physical keyboard event listener
 */
function initKeyboardListener() {
  window.addEventListener('keydown', (e) => {
    // Prevent typing sounds when typing in input fields (if any are added)
    if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
    
    // Play sound
    playKeyboardClick();
  });
}

// Run key listener setup
initKeyboardListener();

/**
 * Toggles a track on or off
 * @param {string} trackName 
 */
export function toggleTrack(trackName) {
  const track = synthTracks[trackName];
  if (!track) return false;

  const ctx = getAudioContext();

  if (track.active) {
    // Turn off
    if (track.node) {
      if (track.node.stop) {
        track.node.stop();
      }
      track.node = null;
    }
    track.active = false;
  } else {
    // Turn on
    track.active = true;

    // Create persistent gain node if it doesn't exist
    if (!track.gainNode) {
      track.gainNode = ctx.createGain();
      track.gainNode.connect(ctx.destination);
    }

    // Set gain based on track volume and global mute
    track.gainNode.gain.setValueAtTime(isMutedAll ? 0 : track.volume, ctx.currentTime);

    // Keyboard is manual, others are loops
    if (trackName === 'rain') {
      track.node = startRainSynth(ctx, track.gainNode);
    } else if (trackName === 'campfire') {
      track.node = startCampfireSynth(ctx, track.gainNode);
    } else if (trackName === 'wind') {
      track.node = startWindSynth(ctx, track.gainNode);
    } else if (trackName === 'space') {
      track.node = startSpaceSynth(ctx, track.gainNode);
    } else if (trackName === 'lofi') {
      track.node = startLofiSynth(ctx, track.gainNode);
    }
  }

  return track.active;
}

/**
 * Update the volume of a track
 * @param {string} trackName 
 * @param {number} value (0.0 to 1.0)
 */
export function updateVolume(trackName, value) {
  const track = synthTracks[trackName];
  if (!track) return;

  track.volume = Math.max(0, Math.min(1, value));

  if (track.gainNode && !isMutedAll && track.active) {
    track.gainNode.gain.linearRampToValueAtTime(track.volume, getAudioContext().currentTime + 0.1);
  }
}

/**
 * Toggle Master Mute state
 */
export function toggleMuteAll() {
  isMutedAll = !isMutedAll;
  
  const ctx = getAudioContext();

  Object.keys(synthTracks).forEach((key) => {
    const track = synthTracks[key];
    if (track.gainNode) {
      const targetVolume = isMutedAll ? 0 : (track.active ? track.volume : 0);
      track.gainNode.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + 0.15);
    }
  });

  return isMutedAll;
}
