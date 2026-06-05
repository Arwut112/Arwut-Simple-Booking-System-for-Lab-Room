/* ============================================================
   data.js — API Data Layer (SQLite via Express backend)
   CE Lab Booking System | มหาวิทยาลัยกาฬสินธุ์
   ============================================================ */

/* ─── In-Memory Cache (โหลดจาก API แล้วเก็บไว้ใช้แบบ sync) ─── */
const _cache = {
  rooms: [],
  bookings: [],
};

/* ══════════════════════════════════════════════
   LOAD ALL DATA FROM API (async)
   เรียกก่อน render ทุกหน้า
══════════════════════════════════════════════ */
async function loadAllData() {
  try {
    const [roomsRes, bookingsRes] = await Promise.all([
      fetch('/api/rooms'),
      fetch('/api/bookings'),
    ]);
    _cache.rooms    = await roomsRes.json();
    _cache.bookings = await bookingsRes.json();
  } catch (err) {
    console.error('❌ ไม่สามารถเชื่อมต่อ server ได้:', err);
  }
}

/* ══════════════════════════════════════════════
   ROOM OPERATIONS (sync — อ่านจาก cache)
══════════════════════════════════════════════ */
function getRooms() {
  return _cache.rooms;
}

function getRoomById(id) {
  return _cache.rooms.find(r => r.id === id) || null;
}

/* ══════════════════════════════════════════════
   BOOKING OPERATIONS (sync — อ่านจาก cache)
══════════════════════════════════════════════ */
function getBookings() {
  return _cache.bookings;
}

function getBookingById(id) {
  return _cache.bookings.find(b => b.id === id) || null;
}

function getBookingsByEmail(email) {
  return _cache.bookings.filter(b =>
    b.requester_email.toLowerCase() === email.toLowerCase()
  );
}

function getBookingsByRoom(roomId) {
  return _cache.bookings.filter(b => b.room_id === roomId);
}

/**
 * FR-07 — Overlap Detection (ตรวจจาก cache)
 */
function checkOverlap(roomId, date, startTime, endTime, excludeId = null) {
  return _cache.bookings.some(b =>
    b.room_id === roomId &&
    b.booking_date === date &&
    b.status === 'Approved' &&
    b.id !== excludeId &&
    startTime < b.end_time && endTime > b.start_time
  );
}

function getConflictingBooking(roomId, date, startTime, endTime, excludeId = null) {
  return _cache.bookings.find(b =>
    b.room_id === roomId &&
    b.booking_date === date &&
    b.status === 'Approved' &&
    b.id !== excludeId &&
    startTime < b.end_time && endTime > b.start_time
  ) || null;
}

/* ══════════════════════════════════════════════
   DASHBOARD / STATS (sync — คำนวณจาก cache)
══════════════════════════════════════════════ */
function getDashboardStats() {
  const bookings = _cache.bookings;
  const rooms    = _cache.rooms;
  const now = new Date().toISOString().split('T')[0];

  const byRoom = rooms.map(r => ({
    room_code: r.room_code,
    room_name: r.room_name,
    total:    bookings.filter(b => b.room_id === r.id).length,
    approved: bookings.filter(b => b.room_id === r.id && b.status === 'Approved').length,
  }));

  return {
    total:          bookings.length,
    pending:        bookings.filter(b => b.status === 'Pending').length,
    approved:       bookings.filter(b => b.status === 'Approved').length,
    rejected:       bookings.filter(b => b.status === 'Rejected').length,
    cancelled:      bookings.filter(b => b.status === 'Cancelled').length,
    today:          bookings.filter(b => b.booking_date === now).length,
    byRoom,
    rooms:          rooms.length,
    availableRooms: rooms.filter(r => r.status === 'Available').length,
  };
}

/* ══════════════════════════════════════════════
   API WRITE FUNCTIONS (async — บันทึกลง SQLite)
══════════════════════════════════════════════ */

/** เพิ่มการจองใหม่ — คืนค่า { ok, booking, conflict } */
async function addBooking(data) {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (res.status === 409) {
    const body = await res.json();
    return { ok: false, conflict: body.conflict };
  }
  if (!res.ok) throw new Error('addBooking failed');
  const booking = await res.json();
  _cache.bookings.unshift(booking);
  return { ok: true, booking };
}

/** อัปเดตสถานะการจอง (Admin) — คืนค่า { ok, booking, conflict } */
async function updateBookingStatus(id, status, comment = '') {
  const res = await fetch(`/api/bookings/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, admin_comment: comment }),
  });
  if (res.status === 409) {
    const body = await res.json();
    return { ok: false, conflict: body.conflict };
  }
  if (!res.ok) throw new Error('updateBookingStatus failed');
  const updated = await res.json();
  const idx = _cache.bookings.findIndex(b => b.id === id);
  if (idx >= 0) _cache.bookings[idx] = updated;
  return { ok: true, booking: updated };
}

/** เพิ่มห้องใหม่ */
async function addRoom(data) {
  const res = await fetch('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('addRoom failed');
  const room = await res.json();
  _cache.rooms.push(room);
  return room;
}

/** แก้ไขห้อง */
async function updateRoom(id, data) {
  const res = await fetch(`/api/rooms/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('updateRoom failed');
  const room = await res.json();
  const idx = _cache.rooms.findIndex(r => r.id === id);
  if (idx >= 0) _cache.rooms[idx] = room;
  return room;
}

/** ลบห้อง */
async function deleteRoom(id) {
  const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('deleteRoom failed');
  _cache.rooms = _cache.rooms.filter(r => r.id !== id);
}

/* ══════════════════════════════════════════════
   INIT — เรียกจาก app.js ตอน boot
══════════════════════════════════════════════ */
async function initData() {
  await loadAllData();
}

/** อัปโหลดรูปห้อง — รับ File object คืน image_url */
async function uploadRoomImage(roomId, file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const res = await fetch(`/api/rooms/${roomId}/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64: e.target.result, filename: file.name }),
        });
        if (!res.ok) throw new Error('upload failed');
        const data = await res.json();
        // อัปเดต cache
        const idx = _cache.rooms.findIndex(r => r.id === roomId);
        if (idx >= 0) _cache.rooms[idx].image_url = data.image_url;
        resolve(data.image_url);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** ลบรูปห้อง */
async function deleteRoomImage(roomId) {
  const res = await fetch(`/api/rooms/${roomId}/image`, { method: 'DELETE' });
  if (!res.ok) throw new Error('delete image failed');
  const idx = _cache.rooms.findIndex(r => r.id === roomId);
  if (idx >= 0) _cache.rooms[idx].image_url = null;
}

/* ── Legacy stubs (ไม่ใช้แล้ว แต่เก็บไว้กัน error) ── */
function saveRooms() {}
function saveBookings() {}
function resetData() { console.warn('resetData: ใช้ API แทน'); }
