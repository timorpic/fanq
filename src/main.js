import { PomodoroTimer, TIMER_MODES } from './timer.js';
import { 
  toggleTrack, 
  updateVolume, 
  toggleMuteAll, 
  playCompletionBell, 
  getAudioContext 
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
      
      // 3. Set header subtitle text
      if (timerStatus) timerStatus.textContent = STATUS_TEXTS[mode];
      
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
});
