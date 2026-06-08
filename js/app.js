// ── APP.JS — UI, EVENTS, RENDERING ──────────────────────────────────────────

// ── TOAST ─────────────────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  const m = document.getElementById('toast-msg');
  if (!t || !m) return;
  m.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

// ── COUNTER ANIMATION ─────────────────────────────────────────────────────────
function animateCounter(el, target, duration = 800) {
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const startTime = performance.now();
  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (target - start) * ease);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── KPI + HERO UPDATE ─────────────────────────────────────────────────────────
function updateKPIs() {
  const s = getStats();

  animateCounter(document.getElementById('kpi-students'), s.total);
  animateCounter(document.getElementById('kpi-occupied'), s.occupied);
  animateCounter(document.getElementById('kpi-available'), s.available);

  const pendEl = document.getElementById('kpi-pending');
  if (pendEl) pendEl.textContent = s.totalFeesDue.toLocaleString();

  const pctEl = document.getElementById('kpi-occupied-pct');
  if (pctEl) { pctEl.textContent = s.occupancyPct + '% occupancy'; pctEl.className = 'kpi-trend'; }

  const cntEl = document.getElementById('kpi-pending-count');
  if (cntEl) {
    cntEl.textContent = s.studentsWithDues + ' student' + (s.studentsWithDues !== 1 ? 's' : '');
    cntEl.className = 'kpi-trend ' + (s.studentsWithDues > 0 ? 'down' : 'up');
  }

  // Hero stats
  animateCounter(document.getElementById('hs-students'), s.total);
  animateCounter(document.getElementById('hs-occupied'), s.occupied);
  animateCounter(document.getElementById('hs-available'), s.available);
  const revEl = document.getElementById('hs-revenue');
  if (revEl) revEl.textContent = s.revenue;

  updateOccupancyChart();
}

// ── STUDENT CARDS ─────────────────────────────────────────────────────────────
function renderStudents(list) {
  const grid  = document.getElementById('student-grid');
  const empty = document.getElementById('student-empty');
  const cnt   = document.getElementById('student-count');
  if (!grid) return;

  const students = list !== undefined ? list : state.students;

  if (cnt) cnt.textContent = students.length + ' student' + (students.length !== 1 ? 's' : '');

  if (students.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  grid.innerHTML = students.map((s, idx) => {
    const feeClear = !s.feesDue || s.feesDue <= 0;
    const room = s.room || 'Unassigned';
    const roomType = state.rooms[room] ? state.rooms[room].type : roomTypeLabel(room);
    const dotClass = roomTypeDotClass(roomType);
    const grad = avatarGrad(s.id);
    const delay = (idx % 12) * 0.04;

    return `
    <div class="student-card reveal" style="animation-delay:${delay}s" data-id="${s.id}">
      <div class="student-card-top">
        <div class="student-avatar" style="background:${grad}">${initials(s.name)}</div>
        <div class="student-meta">
          <div class="student-name">${s.name}</div>
          <div class="student-id"># ${s.id}</div>
        </div>
        <span class="fee-badge ${feeClear ? 'clear' : 'pending'}">${feeClear ? 'Clear' : '$'+s.feesDue+' Due'}</span>
      </div>
      <div class="student-details">
        <div class="detail-row">
          <span class="detail-label">Room</span>
          <span class="detail-val">${room}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Type</span>
          <span class="detail-val">
            <span class="room-type-dot ${dotClass}" style="display:inline-block"></span>
            ${roomType}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Check-in</span>
          <span class="detail-val">${formatDate(s.checkIn)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Phone</span>
          <span class="detail-val" style="font-size:0.75rem">${s.phone || '—'}</span>
        </div>
      </div>
      <div class="student-actions">
        <button onclick="openModal('viewStudent',${s.id})">View Profile</button>
        <button onclick="openModal('allocateRoom',${s.id})">Allocate Room</button>
        <button class="pay-btn" onclick="openModal('payFees',${s.id})">${feeClear ? 'Paid ✓' : 'Pay Fees'}</button>
        <button onclick="confirmDelete(${s.id})" style="color:rgba(255,71,87,0.7)">Remove</button>
      </div>
    </div>`;
  }).join('');

  observeReveal();
}

function filterStudents() {
  const query   = (document.getElementById('student-search')?.value || '').toLowerCase().trim();
  const feeFilt = document.getElementById('filter-fee')?.value  || 'all';
  const typeFilt= document.getElementById('filter-type')?.value || 'all';

  let list = state.students;

  if (query) {
    list = list.filter(s =>
      s.name.toLowerCase().includes(query) ||
      String(s.id).includes(query) ||
      (s.room && s.room.toLowerCase().includes(query))
    );
  }
  if (feeFilt === 'pending') list = list.filter(s => s.feesDue > 0);
  if (feeFilt === 'clear')   list = list.filter(s => !s.feesDue || s.feesDue <= 0);
  if (typeFilt !== 'all') {
    list = list.filter(s => {
      const room = s.room;
      if (!room || room === 'Unassigned') return false;
      const rt = state.rooms[room] ? state.rooms[room].type : roomTypeLabel(room);
      return rt === typeFilt;
    });
  }

  renderStudents(list);
}

// ── ROOM GRID ─────────────────────────────────────────────────────────────────
function renderRooms() {
  const grid = document.getElementById('room-grid');
  if (!grid) return;

  let html = '';
  for (let i = 1; i <= 100; i++) {
    const key  = 'R' + i;
    const room = state.rooms[key];
    const occ  = room ? room.occupied : false;
    const type = room ? room.type : roomTypeLabel(key);
    let dotColor;
    if      (type === '1-seater') dotColor = '#00d4ff';
    else if (type === '2-seater') dotColor = '#7c3aed';
    else                          dotColor = '#fbbf24';

    const tip = occ
      ? `${key} · ${type} · Occupied (ID ${room?.occupantId})`
      : `${key} · ${type} · Available`;

    html += `<div class="room-cell ${occ ? 'occ' : 'avail'}" title="${tip}"
               data-status="${occ ? 'occ' : 'avail'}"
               onclick="onRoomClick('${key}')">
               <span class="room-num">${key}</span>
               <span class="room-type-badge" style="background:${dotColor};width:5px;height:5px;border-radius:50%;"></span>
             </div>`;
  }
  grid.innerHTML = html;
}

function filterRooms(btn, filter) {
  document.querySelectorAll('.room-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  document.querySelectorAll('.room-cell').forEach(cell => {
    const status = cell.dataset.status;
    if (filter === 'all')    cell.classList.remove('hidden-cell');
    else if (filter === 'avail') cell.classList.toggle('hidden-cell', status !== 'avail');
    else if (filter === 'occ')   cell.classList.toggle('hidden-cell', status !== 'occ');
  });
}

function onRoomClick(roomKey) {
  const room = state.rooms[roomKey];
  if (!room) return;
  if (room.occupied) {
    const student = state.students.find(s => s.id === room.occupantId);
    if (student) openModal('viewStudent', student.id);
  } else {
    // Find first student without a room
    const unassigned = state.students.find(s => !s.room || s.room === 'Unassigned');
    if (unassigned) {
      openModal('allocateRoom', unassigned.id, roomKey);
    } else {
      showToast('Room ' + roomKey + ' is available — register a student first.');
    }
  }
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
function renderNotifications() {
  const list  = document.getElementById('notif-list');
  if (!list) return;
  const notifs = generateNotifications();

  if (notifs.length === 0) {
    list.innerHTML = '<p style="color:var(--text2);text-align:center;padding:40px">No alerts at this time.</p>';
    return;
  }

  list.innerHTML = notifs.map((n, i) => `
    <div class="notif-card ${n.type}" style="animation-delay:${i*0.07}s">
      <div class="notif-icon ${n.type}">${n.icon}</div>
      <div class="notif-body">
        <div class="notif-title">${n.title}</div>
        <div class="notif-desc">${n.desc}</div>
      </div>
      ${n.action ? `<button class="notif-action" onclick="notifAction(${i})">${n.action}</button>` : ''}
    </div>
  `).join('');

  // Store callbacks for action buttons
  window._notifCallbacks = notifs.map(n => n.onAction);
}

function notifAction(idx) {
  const cb = window._notifCallbacks && window._notifCallbacks[idx];
  if (typeof cb === 'function') cb();
}

// ── MODALS ────────────────────────────────────────────────────────────────────
let _currentModal = null;

function openModal(type, studentId, preselectedRoom) {
  closeModal(false);

  const backdrop = document.getElementById('modal-backdrop');
  const modal    = document.getElementById('modal-' + type);
  if (!modal) return;

  backdrop.classList.add('show');
  modal.classList.add('show');
  _currentModal = type;
  document.body.style.overflow = 'hidden';

  if (type === 'addStudent') {
    setupAddStudentModal();
  } else if (type === 'allocateRoom') {
    setupAllocateModal(studentId, preselectedRoom);
  } else if (type === 'payFees') {
    setupPayFeesModal(studentId);
  } else if (type === 'viewStudent') {
    setupViewStudentModal(studentId);
  }
}

function closeModal(all = true) {
  if (!all && !_currentModal) return;
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
  document.getElementById('modal-backdrop')?.classList.remove('show');
  _currentModal = null;
  document.body.style.overflow = '';
}

// Escape key
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── Add Student modal setup
function setupAddStudentModal() {
  document.getElementById('f-id').value      = '';
  document.getElementById('f-name').value    = '';
  document.getElementById('f-checkin').value = new Date().toISOString().split('T')[0];
  document.getElementById('f-room').value    = '';
  document.getElementById('f-fees').value    = '0';
  document.getElementById('f-phone').value   = '';
  document.getElementById('form-add-error').classList.remove('show');
  document.getElementById('f-room').oninput  = () => validateRoomInput('f-room', 'f-room-hint');
}

function validateRoomInput(inputId, hintId) {
  const val  = document.getElementById(inputId).value.trim();
  const hint = document.getElementById(hintId);
  if (!val || val === 'Unassigned') { if (hint) hint.textContent = ''; return; }
  const key = val.startsWith('R') || val.startsWith('r') ? val.toUpperCase() : 'R' + val;
  const room = state.rooms[key];
  if (!room) {
    if (hint) { hint.textContent = 'Room not found. Use R1–R100.'; hint.style.color = 'var(--red)'; }
  } else if (room.occupied) {
    if (hint) { hint.textContent = `${key} is occupied.`; hint.style.color = 'var(--red)'; }
  } else {
    if (hint) { hint.textContent = `✓ ${key} available (${room.type}${room.attachedWashroom ? ' · attached washroom' : ''}).`; hint.style.color = 'var(--green)'; }
  }
}

// ── Allocate Room modal setup
function setupAllocateModal(studentId, preselectedRoom) {
  const student = getStudentById(studentId);
  if (!student) return;

  document.getElementById('alloc-student-id').value = studentId;
  document.getElementById('alloc-room-selected').value = preselectedRoom || '';
  document.getElementById('form-alloc-error').classList.remove('show');

  const info = document.getElementById('alloc-student-info');
  if (info) {
    info.innerHTML = `Allocating room for <strong>${student.name}</strong> (ID: ${studentId}).
      Current room: <strong>${student.room || 'None'}</strong>.`;
  }

  // Build room picker
  const picker = document.getElementById('room-picker');
  if (!picker) return;
  let html = '';
  for (let i = 1; i <= 100; i++) {
    const key  = 'R' + i;
    const room = state.rooms[key];
    const taken = room && room.occupied && room.occupantId !== studentId;
    const selected = key === preselectedRoom;
    html += `<div class="room-pick-cell ${taken ? 'taken' : ''} ${selected ? 'selected' : ''}"
                  data-room="${key}" onclick="${taken ? '' : `selectPickerRoom('${key}')`}"
                  title="${key} · ${room?.type || ''} · ${taken ? 'Occupied' : 'Available'}">
               ${i}
             </div>`;
  }
  picker.innerHTML = html;
  const hint = document.getElementById('alloc-hint');
  if (hint && preselectedRoom) hint.textContent = `Selected: ${preselectedRoom}`;
}

function selectPickerRoom(roomKey) {
  document.querySelectorAll('.room-pick-cell').forEach(c => c.classList.remove('selected'));
  const cell = document.querySelector(`.room-pick-cell[data-room="${roomKey}"]`);
  if (cell) cell.classList.add('selected');
  document.getElementById('alloc-room-selected').value = roomKey;
  const hint = document.getElementById('alloc-hint');
  const room = state.rooms[roomKey];
  if (hint && room) {
    hint.textContent = `Selected: ${roomKey} · ${room.type}${room.attachedWashroom ? ' · Attached Washroom' : ''}`;
    hint.style.color = 'var(--green)';
  }
}

// ── Pay Fees modal setup
function setupPayFeesModal(studentId) {
  const student = getStudentById(studentId);
  if (!student) return;

  document.getElementById('pay-student-id').value = studentId;
  document.getElementById('pay-amount').value = student.feesDue || '';
  document.getElementById('form-pay-error').classList.remove('show');

  const card = document.getElementById('fee-info-card');
  if (card) {
    card.innerHTML = `
      <div class="fee-row"><span>Student</span><strong>${student.name}</strong></div>
      <div class="fee-row"><span>ID</span><strong>#${student.id}</strong></div>
      <div class="fee-row"><span>Room</span><strong>${student.room || 'Unassigned'}</strong></div>
      <div class="fee-row"><span>Amount Due</span><span class="fee-due">$${(student.feesDue || 0).toFixed(2)}</span></div>`;
  }
}

// ── View Student modal setup
function setupViewStudentModal(studentId) {
  const student = getStudentById(studentId);
  if (!student) return;

  const room = state.rooms[student.room] || {};
  const roomType = room.type || roomTypeLabel(student.room || '');
  const grad = avatarGrad(student.id);
  const feeClear = !student.feesDue || student.feesDue <= 0;

  const content = document.getElementById('view-student-content');
  if (!content) return;
  content.innerHTML = `
    <div class="vs-header">
      <div class="vs-avatar" style="background:${grad}">${initials(student.name)}</div>
      <div>
        <div class="vs-name">${student.name}</div>
        <div class="vs-id">Student ID: #${student.id}</div>
        <span class="fee-badge ${feeClear ? 'clear' : 'pending'}" style="margin-top:6px;display:inline-block">
          ${feeClear ? '✓ Fees Cleared' : '$'+student.feesDue+' Outstanding'}
        </span>
      </div>
    </div>
    <div class="vs-grid">
      <div class="vs-item"><div class="vs-item-label">Room</div><div class="vs-item-val">${student.room || 'Unassigned'}</div></div>
      <div class="vs-item"><div class="vs-item-label">Room Type</div><div class="vs-item-val">${roomType}</div></div>
      <div class="vs-item"><div class="vs-item-label">Check-in Date</div><div class="vs-item-val">${formatDate(student.checkIn)}</div></div>
      <div class="vs-item"><div class="vs-item-label">Phone</div><div class="vs-item-val">${student.phone || '—'}</div></div>
      <div class="vs-item"><div class="vs-item-label">Washroom</div><div class="vs-item-val">${room.attachedWashroom ? 'Attached' : 'Shared'}</div></div>
      <div class="vs-item"><div class="vs-item-label">Fees Due</div><div class="vs-item-val" style="color:${feeClear ? 'var(--green)' : 'var(--red)'}">$${(student.feesDue || 0).toFixed(2)}</div></div>
    </div>
    <div class="vs-actions">
      <button class="btn-outline" onclick="closeModal();openModal('allocateRoom',${student.id})">Change Room</button>
      ${!feeClear ? `<button class="btn-primary" onclick="closeModal();openModal('payFees',${student.id})">Pay Fees</button>` : ''}
      <button class="btn-outline" style="color:var(--red);border-color:rgba(255,71,87,0.3)" onclick="closeModal();confirmDelete(${student.id})">Remove</button>
    </div>`;
}

// ── FORM HANDLERS ─────────────────────────────────────────────────────────────
function handleAddStudent(e) {
  e.preventDefault();
  const errEl = document.getElementById('form-add-error');

  const idRaw  = document.getElementById('f-id').value.trim();
  const name   = document.getElementById('f-name').value.trim();
  const checkIn= document.getElementById('f-checkin').value;
  const roomRaw= document.getElementById('f-room').value.trim();
  const fees   = parseFloat(document.getElementById('f-fees').value) || 0;
  const phone  = document.getElementById('f-phone').value.trim();

  const id = parseInt(idRaw);
  if (!id || id < 1000 || id > 9999) {
    showError(errEl, 'Student ID must be a 4-digit number (1000–9999).'); return;
  }
  if (!/^[A-Za-z ]{2,}$/.test(name)) {
    showError(errEl, 'Name must be letters only, at least 2 characters.'); return;
  }

  let room = '';
  if (roomRaw) {
    room = roomRaw.startsWith('R') || roomRaw.startsWith('r') ? roomRaw.toUpperCase() : 'R' + roomRaw;
  }

  const result = addStudent({ id, name, checkIn, room, feesDue: fees, phone });
  if (!result.ok) { showError(errEl, result.msg); return; }

  closeModal();
  renderAll();
  showToast(`${name} registered successfully!`);
}

function handleAllocateRoom(e) {
  e.preventDefault();
  const errEl     = document.getElementById('form-alloc-error');
  const studentId = parseInt(document.getElementById('alloc-student-id').value);
  const roomKey   = document.getElementById('alloc-room-selected').value;

  if (!roomKey) { showError(errEl, 'Please select a room from the grid.'); return; }

  const result = allocateRoom(studentId, roomKey);
  if (!result.ok) { showError(errEl, result.msg); return; }

  const student = getStudentById(studentId);
  closeModal();
  renderAll();
  showToast(`Room ${roomKey} allocated to ${student?.name || 'student'}.`);
}

function handlePayFees(e) {
  e.preventDefault();
  const errEl     = document.getElementById('form-pay-error');
  const studentId = parseInt(document.getElementById('pay-student-id').value);
  const amount    = parseFloat(document.getElementById('pay-amount').value);

  if (isNaN(amount) || amount <= 0) { showError(errEl, 'Enter a valid payment amount.'); return; }

  const result = payFees(studentId, amount);
  if (!result.ok) { showError(errEl, result.msg); return; }

  closeModal();
  renderAll();
  showToast(result.msg);
}

function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}

// ── DELETE ────────────────────────────────────────────────────────────────────
function confirmDelete(studentId) {
  const student = getStudentById(studentId);
  if (!student) return;
  if (!confirm(`Remove ${student.name} (ID: ${studentId}) from the system?`)) return;
  deleteStudent(studentId);
  renderAll();
  showToast(`${student.name} removed.`);
}

// ── RENDER ALL ────────────────────────────────────────────────────────────────
function renderAll() {
  updateKPIs();
  renderStudents();
  renderRooms();
  renderNotifications();
}

// ── NAVIGATION ────────────────────────────────────────────────────────────────
function smoothScroll(selector) {
  const el = document.querySelector(selector);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toggleMobileNav() {
  document.querySelector('.nav-links')?.classList.toggle('open');
}

// ── SCROLL REVEAL ─────────────────────────────────────────────────────────────
function observeReveal() {
  const items = document.querySelectorAll('.reveal:not(.visible)');
  if (!items.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  items.forEach(el => io.observe(el));
}

// ── NAVBAR SCROLL ─────────────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 30);

  // Active nav link
  const sections = ['hero','dashboard','students','rooms','notifications'];
  let current = 'hero';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 120) current = id;
  });
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.section === current);
  });
}, { passive: true });

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Load data
  loadState();

  // Set today as default date in form
  const dateInput = document.getElementById('f-checkin');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  // Three.js scene
  initScene();

  // Charts
  initCharts();

  // Render UI
  renderAll();

  // Scroll reveal for static elements
  observeReveal();

  // Observe sections for initial reveal
  document.querySelectorAll('.section, .kpi-card, .chart-card').forEach(el => {
    el.classList.add('reveal');
  });
  observeReveal();
});
