// ── AVATAR COLOURS ─────────────────────────────────────────────────────────
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#00d4ff,#7c3aed)',
  'linear-gradient(135deg,#7c3aed,#ff4757)',
  'linear-gradient(135deg,#00ff88,#00d4ff)',
  'linear-gradient(135deg,#fbbf24,#f97316)',
  'linear-gradient(135deg,#ff4757,#7c3aed)',
  'linear-gradient(135deg,#06b6d4,#3b82f6)',
  'linear-gradient(135deg,#84cc16,#06b6d4)',
  'linear-gradient(135deg,#f97316,#ef4444)',
];
function avatarGrad(id) { return AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length]; }
function initials(name) { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2); }

// ── ROOM CATALOGUE ──────────────────────────────────────────────────────────
function buildRooms() {
  const rooms = {};
  for (let i = 1; i <= 100; i++) {
    const num = 'R' + i;
    let type;
    if      (i <= 25)  type = '1-seater';
    else if (i <= 60)  type = '2-seater';
    else               type = '4-seater';
    rooms[num] = {
      number: num,
      type,
      attachedWashroom: i % 3 === 0,
      occupied: false,
      occupantId: null,
    };
  }
  return rooms;
}

// ── DEMO STUDENTS ───────────────────────────────────────────────────────────
const DEMO_STUDENTS = [
  { id:1001, name:'Ahmed Hassan',   room:'R12',  checkIn:'2024-09-01', feesDue:0,   phone:'+92-312-1234567' },
  { id:1002, name:'Fatima Ali',     room:'R28',  checkIn:'2024-09-15', feesDue:150, phone:'+92-333-2345678' },
  { id:1003, name:'Muhammad Khan',  room:'R63',  checkIn:'2024-08-20', feesDue:0,   phone:'+92-300-3456789' },
  { id:1004, name:'Sarah Johnson',  room:'R7',   checkIn:'2024-10-01', feesDue:300, phone:'+1-212-456-7890'  },
  { id:1005, name:'Omar Sheikh',    room:'R45',  checkIn:'2024-07-15', feesDue:0,   phone:'+92-321-5678901' },
  { id:1006, name:'Ayesha Malik',   room:'R31',  checkIn:'2024-09-30', feesDue:75,  phone:'+92-345-6789012' },
  { id:1007, name:'Bilal Hussain',  room:'R78',  checkIn:'2024-08-01', feesDue:0,   phone:'+92-300-7890123' },
  { id:1008, name:'Zara Ahmed',     room:'R20',  checkIn:'2024-11-01', feesDue:500, phone:'+92-312-8901234' },
  { id:1009, name:'Tariq Mahmood',  room:'R55',  checkIn:'2024-06-15', feesDue:0,   phone:'+92-333-9012345' },
  { id:1010, name:'Hina Qureshi',   room:'R88',  checkIn:'2024-10-20', feesDue:200, phone:'+92-321-0123456' },
  { id:1011, name:'Usman Farooq',   room:'R15',  checkIn:'2024-09-05', feesDue:0,   phone:'+92-300-1234567' },
  { id:1012, name:'Nadia Iqbal',    room:'R42',  checkIn:'2024-11-15', feesDue:125, phone:'+92-345-2345678' },
  { id:1013, name:'Kamran Butt',    room:'R71',  checkIn:'2024-08-25', feesDue:0,   phone:'+92-312-3456789' },
  { id:1014, name:'Sana Riaz',      room:'R3',   checkIn:'2024-07-01', feesDue:350, phone:'+92-333-4567890' },
  { id:1015, name:'Imran Raza',     room:'R96',  checkIn:'2024-10-10', feesDue:0,   phone:'+92-321-5678902' },
];

// ── STATE ────────────────────────────────────────────────────────────────────
const state = {
  students: [],
  rooms:    {},
};

function loadState() {
  try {
    const saved = localStorage.getItem('hostelpro_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      state.students = parsed.students || [];
      state.rooms    = parsed.rooms    || buildRooms();
    } else {
      resetToDemo(false);
    }
  } catch {
    resetToDemo(false);
  }
}

function saveState() {
  localStorage.setItem('hostelpro_v2', JSON.stringify({
    students: state.students,
    rooms:    state.rooms,
  }));
}

function resetToDemo(notify = true) {
  state.rooms = buildRooms();
  state.students = DEMO_STUDENTS.map(s => ({ ...s }));
  state.students.forEach(s => {
    if (s.room && state.rooms[s.room]) {
      state.rooms[s.room].occupied   = true;
      state.rooms[s.room].occupantId = s.id;
    }
  });
  saveState();
  if (notify && typeof renderAll === 'function') {
    renderAll();
    showToast('Demo data restored');
  }
}

// ── HELPERS ──────────────────────────────────────────────────────────────────
function getStats() {
  const occupied  = Object.values(state.rooms).filter(r => r.occupied).length;
  const available = 100 - occupied;
  const totalFeesDue = state.students.reduce((s, x) => s + (x.feesDue || 0), 0);
  const studentsWithDues = state.students.filter(s => s.feesDue > 0).length;
  const occupancyPct = Math.round(occupied / 100 * 100);
  // Mock monthly revenue: $450 avg per occupied room
  const revenue = (occupied * 450 / 1000).toFixed(1);
  return { occupied, available, totalFeesDue, studentsWithDues, occupancyPct, revenue,
           total: state.students.length };
}

function roomTypeLabel(num) {
  const n = parseInt(num.replace('R',''));
  if (n <= 25)  return '1-seater';
  if (n <= 60)  return '2-seater';
  return '4-seater';
}

function roomTypeDotClass(type) {
  if (type === '1-seater') return 't1';
  if (type === '2-seater') return 't2';
  return 't4';
}

function roomTypeColor(type) {
  if (type === '1-seater') return '#00d4ff';
  if (type === '2-seater') return '#7c3aed';
  return '#fbbf24';
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
  } catch { return iso; }
}

function getStudentById(id) {
  return state.students.find(s => s.id === id);
}

function generateNotifications() {
  const notifs = [];

  // Overdue fees
  state.students.filter(s => s.feesDue > 0).forEach(s => {
    notifs.push({
      type: 'warn',
      icon: '💸',
      title: `Fee Overdue — ${s.name}`,
      desc:  `Student #${s.id} has $${s.feesDue} outstanding. Room ${s.room || 'unassigned'}.`,
      action: 'Pay Now',
      onAction: () => openModal('payFees', s.id),
    });
  });

  // Students without room
  state.students.filter(s => !s.room || s.room === 'Unassigned').forEach(s => {
    notifs.push({
      type: 'info',
      icon: '🏠',
      title: `Room Unassigned — ${s.name}`,
      desc:  `Student #${s.id} has not been allocated a room yet.`,
      action: 'Allocate',
      onAction: () => openModal('allocateRoom', s.id),
    });
  });

  // Occupancy alert
  const stats = getStats();
  if (stats.available < 10) {
    notifs.push({
      type: 'warn',
      icon: '⚠️',
      title: 'Low Room Availability',
      desc:  `Only ${stats.available} rooms remaining. Consider expanding capacity.`,
      action: null,
    });
  } else if (stats.available > 80) {
    notifs.push({
      type: 'info',
      icon: '📢',
      title: 'High Vacancy Rate',
      desc:  `${stats.available} rooms are currently vacant. Consider a promotional campaign.`,
      action: null,
    });
  }

  // All-clear
  if (notifs.filter(n => n.type === 'warn').length === 0) {
    notifs.push({
      type: 'ok',
      icon: '✅',
      title: 'All Fees Cleared',
      desc:  'No outstanding fee payments — all residents are up to date.',
      action: null,
    });
  }

  // Update badge
  const warnCount = notifs.filter(n => n.type === 'warn').length;
  const badge = document.getElementById('alert-badge');
  if (badge) {
    badge.textContent = warnCount;
    badge.style.display = warnCount ? 'inline-block' : 'none';
  }

  return notifs;
}

// ── MUTATIONS ────────────────────────────────────────────────────────────────
function addStudent(data) {
  const exists = state.students.find(s => s.id === data.id);
  if (exists) return { ok: false, msg: `Student ID ${data.id} already exists.` };

  if (data.room && data.room !== 'Unassigned') {
    if (!state.rooms[data.room]) return { ok: false, msg: `Room ${data.room} does not exist (use R1–R100).` };
    if (state.rooms[data.room].occupied) return { ok: false, msg: `Room ${data.room} is already occupied.` };
    state.rooms[data.room].occupied   = true;
    state.rooms[data.room].occupantId = data.id;
  }

  state.students.push({ ...data });
  saveState();
  return { ok: true };
}

function allocateRoom(studentId, roomNum) {
  const student = getStudentById(studentId);
  if (!student) return { ok: false, msg: 'Student not found.' };

  const room = state.rooms[roomNum];
  if (!room)          return { ok: false, msg: `Room ${roomNum} does not exist.` };
  if (room.occupied)  return { ok: false, msg: `Room ${roomNum} is already occupied.` };

  // Free previous room
  if (student.room && state.rooms[student.room]) {
    state.rooms[student.room].occupied   = false;
    state.rooms[student.room].occupantId = null;
  }

  room.occupied   = true;
  room.occupantId = studentId;
  student.room    = roomNum;
  saveState();
  return { ok: true };
}

function payFees(studentId, amount) {
  const student = getStudentById(studentId);
  if (!student) return { ok: false, msg: 'Student not found.' };
  if (amount <= 0) return { ok: false, msg: 'Enter a valid amount.' };

  const change  = amount - student.feesDue;
  const partial = amount < student.feesDue;
  student.feesDue = partial ? student.feesDue - amount : 0;
  saveState();
  return {
    ok: true,
    msg: partial
      ? `Partial payment accepted. Remaining: $${student.feesDue.toFixed(2)}`
      : `Payment complete! Change: $${Math.max(0, change).toFixed(2)}`,
  };
}

function deleteStudent(studentId) {
  const idx = state.students.findIndex(s => s.id === studentId);
  if (idx === -1) return;
  const s = state.students[idx];
  if (s.room && state.rooms[s.room]) {
    state.rooms[s.room].occupied   = false;
    state.rooms[s.room].occupantId = null;
  }
  state.students.splice(idx, 1);
  saveState();
}
