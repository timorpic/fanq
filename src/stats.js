/**
 * Glassmorphic Stats Module
 * Saves completed pomodoros to LocalStorage and dynamically renders a beautiful
 * SVG bar chart representing the weekly focus trend.
 */

const STORAGE_KEY = 'zen_pomodoro_stats';

// Load statistics from LocalStorage
function getStats() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
}

// Save statistics to LocalStorage
function saveStats(stats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

// Get standard date key YYYY-MM-DD in local time
function getTodayKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Increment today's completed pomodoro count
 */
export function recordPomodoro() {
  const stats = getStats();
  const today = getTodayKey();
  
  stats[today] = (stats[today] || 0) + 1;
  saveStats(stats);
  
  return stats[today];
}

/**
 * Get count of pomodoros completed today
 */
export function getTodayCount() {
  const stats = getStats();
  const today = getTodayKey();
  return stats[today] || 0;
}

/**
 * Reset all local storage stats
 */
export function resetStats() {
  saveStats({});
}

/**
 * Returns formatted labels and values for the last 7 days
 */
function getLast7DaysData() {
  const stats = getStats();
  const result = [];
  const dayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    
    // YYYY-MM-DD key
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    
    // Label for rendering (e.g. "周一" or "今日")
    const isToday = i === 0;
    const label = isToday ? '今日' : dayLabels[d.getDay()];
    
    result.push({
      dateKey,
      label,
      count: stats[dateKey] || 0,
      isToday
    });
  }
  
  return result;
}

/**
 * Dynamically draws the weekly focus trend chart in SVG
 * @param {SVGElement} svgElement 
 */
export function renderWeeklyChart(svgElement) {
  if (!svgElement) return;
  
  // Clear previous chart contents
  svgElement.innerHTML = '';
  
  const data = getLast7DaysData();
  const maxCount = Math.max(...data.map(d => d.count), 4); // default minimum ceiling is 4
  
  const width = 420;
  const height = 120;
  const chartHeight = 80; // height of bars maximum
  const baselineY = 96;  // Y coordinate of bottom of the bar
  const colWidth = width / 7;
  const barWidth = 28;
  
  // 1. Draw horizontal grid lines (dotted background lines)
  const gridLevels = [0.25, 0.6, 0.95]; // percentage from bottom
  gridLevels.forEach((level) => {
    const y = baselineY - (chartHeight * level);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', 'chart-grid-line');
    line.setAttribute('x1', '10');
    line.setAttribute('y1', String(y));
    line.setAttribute('x2', String(width - 10));
    line.setAttribute('y2', String(y));
    line.setAttribute('stroke-dasharray', '4 4');
    svgElement.appendChild(line);
  });
  
  // 2. Draw bars and labels
  data.forEach((day, index) => {
    const x = index * colWidth + (colWidth - barWidth) / 2;
    const barHeight = (day.count / maxCount) * chartHeight;
    const y = baselineY - barHeight;
    
    // Group container for hover trigger
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'chart-bar-group');
    
    // Background placeholder bar (full height, invisible but hoverable)
    const hoverBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    hoverBg.setAttribute('x', String(x - 4));
    hoverBg.setAttribute('y', '10');
    hoverBg.setAttribute('width', String(barWidth + 8));
    hoverBg.setAttribute('height', String(baselineY - 10));
    hoverBg.setAttribute('fill', 'transparent');
    hoverBg.setAttribute('cursor', 'pointer');
    g.appendChild(hoverBg);
    
    // Actual visual bar
    const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bar.setAttribute('class', `chart-bar ${day.isToday ? 'current-day' : ''}`);
    bar.setAttribute('x', String(x));
    bar.setAttribute('y', String(y));
    bar.setAttribute('width', String(barWidth));
    bar.setAttribute('height', String(barHeight));
    
    // Animation starting from height = 0
    bar.style.transformOrigin = `bottom`;
    g.appendChild(bar);
    
    // Value text label (visible on hover)
    const valueLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    valueLabel.setAttribute('class', 'chart-value-label');
    valueLabel.setAttribute('x', String(x + barWidth / 2));
    valueLabel.setAttribute('y', String(y - 6));
    valueLabel.textContent = String(day.count);
    g.appendChild(valueLabel);
    
    // Day label (X-axis labels)
    const dayLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    dayLabel.setAttribute('class', 'chart-label');
    dayLabel.setAttribute('x', String(index * colWidth + colWidth / 2));
    dayLabel.setAttribute('y', '114');
    dayLabel.textContent = day.label;
    if (day.isToday) {
      dayLabel.setAttribute('fill', 'var(--accent-color)');
      dayLabel.setAttribute('style', 'font-weight: 800');
    }
    g.appendChild(dayLabel);
    
    svgElement.appendChild(g);
  });
}
