import { PomodoroTimer, TIMER_MODES } from './timer.js';
import { 
  toggleTrack, 
  updateVolume, 
  toggleMuteAll, 
  playCompletionBell, 
  getAudioContext,
  setKeyboardAxis
} from './soundboard.js';
import { 
  recordPomodoro, 
  getTodayCount, 
  resetStats, 
  renderWeeklyChart 
} from './stats.js';

// SVG progress indicator calculation variables
const SVG_RADIUS = 120;
const CIRCUMFERENCE = 2 * Math.PI * SVG_RADIUS;

// Status texts for mode indicator
const STATUS_TEXTS = {
  [TIMER_MODES.FOCUS]: '专注于当下',
  [TIMER_MODES.SHORT_BREAK]: '稍作小憩吧',
  [TIMER_MODES.LONG_BREAK]: '深度放松时间'
};

document.addEventListener('DOMContentLoaded', () => {
  // --- UI Elements ---
  const countdownText = document.getElementById('timer-countdown');
  const timerStatus = document.getElementById('timer-status');
  const progressRing = document.getElementById('progress-indicator');
  const btnToggleTimer = document.getElementById('btn-toggle-timer');
  const btnSkipTimer = document.getElementById('btn-skip-timer');
  
  const modeTabs = document.querySelectorAll('.mode-tab');
  const soundTracks = document.querySelectorAll('.sound-track');
  
  const btnMuteAll = document.getElementById('btn-mute-all');
  const btnResetData = document.getElementById('btn-reset-data');
  const todayCountDisplay = document.getElementById('today-count');
  const weeklyChartSvg = document.getElementById('weekly-chart');
  const breathingCircle = document.getElementById('breathing-circle');

  // E-Ink Theme & Keyboard Axis selector elements
  const btnThemeEink = document.getElementById('btn-theme-eink');
  const axisBtns = document.querySelectorAll('.axis-btn');

  // Focus Completion Card Modal elements
  const completionModal = document.getElementById('completion-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const modalInputNote = document.getElementById('modal-input-note');
  const cardNotePreview = document.getElementById('card-note-preview');
  const cardDate = document.getElementById('card-date');
  const cardStatsSessions = document.getElementById('card-stats-sessions');
  const cardSoundboardMix = document.getElementById('card-soundboard-mix');
  const btnExportCard = document.getElementById('btn-export-card');

  // --- Initializing Circular Progress Ring Styles ---
  if (progressRing) {
    progressRing.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;
    progressRing.style.strokeDashoffset = CIRCUMFERENCE;
  }

  // --- Initialize Statistics Display ---
  function updateStatsUI() {
    const todayCount = getTodayCount();
    if (todayCountDisplay) todayCountDisplay.textContent = todayCount;
    renderWeeklyChart(weeklyChartSvg);
  }
  updateStatsUI();

  // --- Breathing Guide Interval Manager ---
  let breathingInterval = null;
  
  function startBreathingGuide() {
    if (breathingInterval) clearInterval(breathingInterval);
    if (breathingCircle) breathingCircle.classList.add('active-breath');
    
    let state = 0; // 0: inhale, 1: exhale
    const breatheTexts = ['吸气...', '呼气...'];
    
    if (timerStatus) {
      timerStatus.textContent = breatheTexts[state];
      timerStatus.style.color = 'var(--accent-color)';
    }

    breathingInterval = setInterval(() => {
      state = (state + 1) % 2;
      if (timerStatus) {
        timerStatus.textContent = breatheTexts[state];
      }
    }, 4000); // 4 seconds inhale, 4 seconds exhale
  }

  function stopBreathingGuide() {
    if (breathingInterval) {
      clearInterval(breathingInterval);
      breathingInterval = null;
    }
    if (breathingCircle) breathingCircle.classList.remove('active-breath');
    if (timerStatus) {
      timerStatus.style.color = '';
    }
  }

  // --- Timer Instantiation ---
  const timer = new PomodoroTimer({
    onTick: (formattedTime, percentage) => {
      // 1. Update countdown text digits
      if (countdownText) countdownText.textContent = formattedTime;
      
      // 2. Animate SVG circle remaining progress ring
      if (progressRing) {
        const offset = CIRCUMFERENCE - (percentage * CIRCUMFERENCE);
        progressRing.style.strokeDashoffset = offset;
      }
    },
    
    onComplete: (mode) => {
      // 1. Play Completion Bell Chimes
      playCompletionBell();
      
      // 2. Save stats if it was a Focus mode session
      if (mode === TIMER_MODES.FOCUS) {
        recordPomodoro();
        updateStatsUI();
        // Open achievement card modal
        setTimeout(showCompletionModal, 1000);
      }
    },
    
    onModeSwitch: (mode) => {
      // 1. Morph body styling colors
      document.body.className = `mode-${mode}`;
      
      // 2. Change active tab button styling
      modeTabs.forEach(tab => {
        if (tab.dataset.mode === mode) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
      
      // 3. Set header subtitle text & trigger breathing guide
      if (mode === TIMER_MODES.FOCUS) {
        stopBreathingGuide();
        if (timerStatus) timerStatus.textContent = STATUS_TEXTS[mode];
      } else {
        startBreathingGuide();
      }
      
      // 4. Reset Toggle button text and icon back to initial "Play"
      resetToggleBtnUI();
    }
  });

  // Helper to force play/pause button back to idle "Start" mode
  function resetToggleBtnUI() {
    btnToggleTimer.innerHTML = '<i class="fa-solid fa-play"></i> <span>开始</span>';
    btnToggleTimer.classList.remove('active');
  }

  // --- Event Bindings: Timer Action Controls ---
  btnToggleTimer.addEventListener('click', () => {
    // Lazily resume Audio Context on user interaction to avoid browser blockages
    getAudioContext();

    if (timer.isRunning) {
      timer.pause();
      resetToggleBtnUI();
    } else {
      timer.start();
      btnToggleTimer.innerHTML = '<i class="fa-solid fa-pause"></i> <span>暂停</span>';
      btnToggleTimer.classList.add('active');
    }
  });

  btnSkipTimer.addEventListener('click', () => {
    getAudioContext();
    timer.skip();
  });

  // Event Bindings: Navigation Tabs switching modes
  modeTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      getAudioContext();
      const mode = e.currentTarget.dataset.mode;
      timer.switchMode(mode);
    });
  });

  // --- Event Bindings: Soundboard Mixer Track Cards ---
  soundTracks.forEach(trackElement => {
    const trackName = trackElement.dataset.track;
    const btnToggle = trackElement.querySelector('.track-toggle');
    const volumeSlider = trackElement.querySelector('.sound-slider');
    const sliderProgress = trackElement.querySelector('.slider-progress');

    // 1. Play/Pause Track Toggle Click
    btnToggle.addEventListener('click', () => {
      const activeCtx = getAudioContext();
      const isNowActive = toggleTrack(trackName);

      if (isNowActive) {
        trackElement.classList.add('playing');
        btnToggle.innerHTML = '<i class="fa-solid fa-pause"></i>';
      } else {
        trackElement.classList.remove('playing');
        btnToggle.innerHTML = '<i class="fa-solid fa-play"></i>';
      }
    });

    // 2. Volume Slider adjustment
    volumeSlider.addEventListener('input', (e) => {
      const value = e.target.value;
      const volumeFraction = value / 100;
      
      // Update synthesizer volume
      updateVolume(trackName, volumeFraction);
      
      // Color slider track background matching position
      if (sliderProgress) {
        sliderProgress.style.width = `${value}%`;
      }
    });
  });

  // --- Event Bindings: Header Utility Control Buttons ---
  
  // Toggle Master Mute/Unmute
  btnMuteAll.addEventListener('click', () => {
    const activeCtx = getAudioContext();
    const isMuted = toggleMuteAll();
    
    if (isMuted) {
      btnMuteAll.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
      btnMuteAll.classList.add('muted');
    } else {
      btnMuteAll.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
      btnMuteAll.classList.remove('muted');
    }
  });

  // Reset stats database
  btnResetData.addEventListener('click', () => {
    const confirmReset = confirm('您确定要清空全部专注统计数据吗？此操作无法撤销。');
    if (confirmReset) {
      resetStats();
      updateStatsUI();
    }
  });

  // --- E-Ink Theme Switch Event ---
  btnThemeEink.addEventListener('click', () => {
    document.body.classList.toggle('theme-eink');
    const isEink = document.body.classList.contains('theme-eink');
    btnThemeEink.innerHTML = isEink ? '<i class="fa-solid fa-lightbulb"></i>' : '<i class="fa-solid fa-book-open"></i>';
  });

  // --- Keyboard Switch Selector Event ---
  axisBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Avoid triggering main keyboard track play click
      getAudioContext();
      
      const axis = e.currentTarget.dataset.axis;
      setKeyboardAxis(axis);
      
      // Toggle CSS selection styling
      axisBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
    });
  });

  // --- Completion Modal Event Bindings & Live Previews ---
  
  function showCompletionModal() {
    const today = new Date();
    if (cardDate) {
      cardDate.textContent = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
    }
    
    const todayCount = getTodayCount();
    if (cardStatsSessions) {
      cardStatsSessions.textContent = `完成了今日第 ${todayCount} 个番茄钟`;
    }
    
    // Fetch active soundboard recipes
    const activeMix = [];
    document.querySelectorAll('.sound-track.playing').forEach(track => {
      const name = track.querySelector('.track-info span').textContent;
      activeMix.push(name);
    });
    if (cardSoundboardMix) {
      cardSoundboardMix.textContent = activeMix.length > 0 ? `配方: ${activeMix.join(' + ')}` : '配方: 绝对静音';
    }
    
    if (modalInputNote) {
      modalInputNote.value = '';
    }
    if (cardNotePreview) {
      cardNotePreview.textContent = '我今天又变强了';
    }
    
    if (completionModal) {
      completionModal.classList.add('active');
    }
  }

  // Live note keyboard input reflection
  modalInputNote.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (cardNotePreview) {
      cardNotePreview.textContent = val ? `“${val}”` : '我今天又变强了';
    }
  });

  // Close modal click
  btnCloseModal.addEventListener('click', () => {
    if (completionModal) {
      completionModal.classList.remove('active');
    }
  });

  // Canvas-based Polaroid card generation and download
  btnExportCard.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 520;
    const ctx = canvas.getContext('2d');
    
    // 1. Polaroid White background card body
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 520);
    
    // Card outer border
    ctx.strokeStyle = '#e1e1de';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 4, 392, 512);
    
    // 2. Card Header
    ctx.fillStyle = '#8c8c8c';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ZENSPACE FOCUS', 200, 28);
    
    // 3. Photo Frame (340x280) from x=30, y=40
    const frameGrad = ctx.createLinearGradient(30, 40, 370, 320);
    frameGrad.addColorStop(0, '#1c1d27');
    frameGrad.addColorStop(1, '#0e0f14');
    ctx.fillStyle = frameGrad;
    ctx.fillRect(30, 40, 340, 280);
    
    // 4. Large centered Emoji
    ctx.font = '80px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧘', 200, 160);
    
    // 5. Date stamp bottom-right
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    const dateStr = cardDate ? cardDate.textContent : new Date().toLocaleDateString();
    ctx.fillText(dateStr, 355, 305);
    
    // 6. User Note (centered Georgia font)
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'italic bold 18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const rawNote = modalInputNote ? modalInputNote.value.trim() : '';
    const noteStr = rawNote ? `“${rawNote}”` : '“我今天又变强了”';
    
    if (noteStr.length <= 18) {
      ctx.fillText(noteStr, 200, 375);
    } else {
      ctx.fillText(noteStr.slice(0, 18), 200, 362);
      ctx.fillText(noteStr.slice(18), 200, 388);
    }
    
    // 7. Dashed line divider
    ctx.strokeStyle = '#e1e1de';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, 420);
    ctx.lineTo(370, 420);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // 8. Footers
    ctx.fillStyle = '#7c7c7a';
    ctx.font = '600 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    const statsStr = cardStatsSessions ? cardStatsSessions.textContent : '完成了今日专注';
    ctx.fillText(statsStr, 30, 452);
    
    const mixStr = cardSoundboardMix ? cardSoundboardMix.textContent : '配方: 绝对静音';
    ctx.fillText(mixStr, 30, 482);
    
    // 9. Download trigger
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    const cleanNote = rawNote ? rawNote.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_') : 'focus';
    link.download = `zenspace-${cleanNote}-${dateStr.replace(/\./g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Close modal after saving
    if (completionModal) {
      completionModal.classList.remove('active');
    }
  });
});

