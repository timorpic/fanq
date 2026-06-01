/**
 * Glassmorphic Pomodoro Timer Module
 * Handles all countdown state, ticking, mode transitions, and tick/completion callbacks.
 */

export const TIMER_MODES = {
  FOCUS: 'focus',
  SHORT_BREAK: 'short-break',
  LONG_BREAK: 'long-break'
};

const MODE_DURATIONS = {
  [TIMER_MODES.FOCUS]: 25 * 60,       // 25 minutes
  [TIMER_MODES.SHORT_BREAK]: 5 * 60,   // 5 minutes
  [TIMER_MODES.LONG_BREAK]: 15 * 60    // 15 minutes
};

export class PomodoroTimer {
  constructor(options = {}) {
    this.activeMode = TIMER_MODES.FOCUS;
    this.duration = MODE_DURATIONS[this.activeMode];
    this.timeLeft = this.duration;
    this.isRunning = false;
    this.timerId = null;

    // Callbacks
    this.onTick = options.onTick || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onModeSwitch = options.onModeSwitch || (() => {});
  }

  /**
   * Start the timer countdown
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    this.timerId = setInterval(() => {
      this.tick();
    }, 1000);
  }

  /**
   * Pause the timer countdown
   */
  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    clearInterval(this.timerId);
    this.timerId = null;
  }

  /**
   * Reset the timer to the start duration of the active mode
   */
  reset() {
    this.pause();
    this.timeLeft = MODE_DURATIONS[this.activeMode];
    this.triggerTick();
  }

  /**
   * Skip current session and move forward
   */
  skip() {
    this.pause();
    this.timeLeft = 0;
    this.triggerCompletion();
  }

  /**
   * Switch the active mode (Focus, Short Break, Long Break)
   * @param {string} mode 
   */
  switchMode(mode) {
    if (!Object.values(TIMER_MODES).includes(mode)) return;
    
    this.pause();
    this.activeMode = mode;
    this.duration = MODE_DURATIONS[mode];
    this.timeLeft = this.duration;
    
    this.onModeSwitch(this.activeMode);
    this.triggerTick();
  }

  /**
   * Internal clock ticking down every second
   */
  tick() {
    if (this.timeLeft > 0) {
      this.timeLeft--;
      this.triggerTick();
    } else {
      this.triggerCompletion();
    }
  }

  /**
   * Notify callbacks with the updated time and circular percentage
   */
  triggerTick() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Percentage remaining (for circular progress)
    const percentage = this.timeLeft / this.duration;
    
    // Update document title for background tracking
    const modeName = this.activeMode === TIMER_MODES.FOCUS ? '专注' : '休息';
    document.title = `(${formattedTime}) 琉璃番茄钟 | ${modeName}`;

    this.onTick(formattedTime, percentage);
  }

  /**
   * Handle when the timer reaches 0
   */
  triggerCompletion() {
    this.pause();
    const completedMode = this.activeMode;
    this.onComplete(completedMode);
    
    // Auto-advance to the logical next mode
    if (completedMode === TIMER_MODES.FOCUS) {
      // Propose Short Break after a Focus session
      this.switchMode(TIMER_MODES.SHORT_BREAK);
    } else {
      // Propose Focus after a break session
      this.switchMode(TIMER_MODES.FOCUS);
    }
  }
}
