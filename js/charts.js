// ── CHART.JS ANALYTICS ───────────────────────────────────────────────────────

const CHART_DEFAULTS = {
  color:  '#e2e8f8',
  grid:   'rgba(0,212,255,0.07)',
  cyan:   '#00d4ff',
  purple: '#7c3aed',
  green:  '#00ff88',
  gold:   '#fbbf24',
  red:    '#ff4757',
};

// shared Chart.js defaults
Chart.defaults.color = CHART_DEFAULTS.color;
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size   = 12;

let occupancyChart = null;
let roomTypeChart  = null;
let revenueChart   = null;

// ── Occupancy Donut
function initOccupancyChart() {
  const ctx = document.getElementById('occupancyChart');
  if (!ctx) return;
  const stats = getStats();
  occupancyChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Occupied', 'Available'],
      datasets: [{
        data: [stats.occupied, stats.available],
        backgroundColor: [CHART_DEFAULTS.red, 'rgba(0,255,136,0.25)'],
        borderColor:     [CHART_DEFAULTS.red, CHART_DEFAULTS.green],
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '72%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10 },
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed} rooms (${Math.round(ctx.parsed)}%)`,
          },
        },
      },
    },
  });
}

// ── Room Type Pie
function initRoomTypeChart() {
  const ctx = document.getElementById('roomTypeChart');
  if (!ctx) return;
  roomTypeChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['1-Seater (R1–25)', '2-Seater (R26–60)', '4-Seater (R61–100)'],
      datasets: [{
        data: [25, 35, 40],
        backgroundColor: [
          'rgba(0,212,255,0.3)',
          'rgba(124,58,237,0.3)',
          'rgba(251,191,36,0.3)',
        ],
        borderColor: [CHART_DEFAULTS.cyan, CHART_DEFAULTS.purple, CHART_DEFAULTS.gold],
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 14, usePointStyle: true, pointStyleWidth: 10 },
        },
      },
    },
  });
}

// ── Revenue + Check-ins Bar/Line Combo
function initRevenueChart() {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;

  const months = ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'];
  const revenue   = [28.2,31.5,34.8,38.1,41.4,43.2,44.1,42.8,45.6,47.2,48.9,50.4];
  const checkins  = [4, 6, 8, 5, 7, 3, 2, 4, 6, 5, 4, 7];

  revenueChart = new Chart(ctx, {
    data: {
      labels: months,
      datasets: [
        {
          type: 'bar',
          label: 'Monthly Revenue ($K)',
          data: revenue,
          backgroundColor: 'rgba(0,212,255,0.18)',
          borderColor: CHART_DEFAULTS.cyan,
          borderWidth: 1.5,
          borderRadius: 5,
          yAxisID: 'y',
        },
        {
          type: 'line',
          label: 'New Check-ins',
          data: checkins,
          borderColor: CHART_DEFAULTS.green,
          backgroundColor: 'rgba(0,255,136,0.08)',
          borderWidth: 2.5,
          tension: 0.4,
          pointBackgroundColor: CHART_DEFAULTS.green,
          pointRadius: 4,
          pointHoverRadius: 7,
          fill: true,
          yAxisID: 'y2',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          grid: { color: CHART_DEFAULTS.grid },
          ticks: { color: 'rgba(226,232,248,0.5)' },
        },
        y: {
          position: 'left',
          grid: { color: CHART_DEFAULTS.grid },
          ticks: {
            color: 'rgba(226,232,248,0.5)',
            callback: v => '$' + v + 'K',
          },
        },
        y2: {
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: {
            color: CHART_DEFAULTS.green,
            callback: v => v + ' in',
          },
        },
      },
      plugins: {
        legend: {
          labels: { padding: 20, usePointStyle: true, pointStyleWidth: 10 },
        },
        tooltip: {
          backgroundColor: 'rgba(6,8,37,0.95)',
          borderColor: 'rgba(0,212,255,0.2)',
          borderWidth: 1,
          padding: 12,
        },
      },
    },
  });
}

// ── Update occupancy chart with live data
function updateOccupancyChart() {
  if (!occupancyChart) return;
  const stats = getStats();
  occupancyChart.data.datasets[0].data = [stats.occupied, stats.available];
  occupancyChart.update('active');

  const label = document.getElementById('occ-label');
  if (label) label.textContent = stats.occupancyPct + '%';
}

// ── Init all
function initCharts() {
  initOccupancyChart();
  initRoomTypeChart();
  initRevenueChart();
}
