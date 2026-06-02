/* ============================================================
   data.js — LocalStorage Data Layer
   CE Lab Booking System | มหาวิทยาลัยกาฬสินธุ์
   ============================================================ */

const STORAGE_KEYS = {
  ROOMS: 'ceksu_rooms',
  BOOKINGS: 'ceksu_bookings',
};

/* ─── Sample Rooms (from SRS Section 11) ─── */
const SAMPLE_ROOMS = [
  {
    id: 'room-1',
    room_name: 'Computer Engineering Lab 1',
    room_code: 'CE-LAB-01',
    location: 'อาคาร CE ชั้น 2 ห้อง 201',
    capacity: 30,
    equipment: 'Computer, Projector, Internet',
    description: 'ห้องปฏิบัติการคอมพิวเตอร์หลัก มีเครื่องคอมพิวเตอร์ 30 เครื่อง โปรเจคเตอร์ความละเอียดสูง และอินเทอร์เน็ตความเร็วสูง เหมาะสำหรับสอนและสอบปฏิบัติการ',
    status: 'Available',
    created_at: '2024-01-01T08:00:00',
  },
  {
    id: 'room-2',
    room_name: 'Computer Engineering Lab 2',
    room_code: 'CE-LAB-02',
    location: 'อาคาร CE ชั้น 2 ห้อง 202',
    capacity: 25,
    equipment: 'Computer, Smart TV, Internet',
    description: 'ห้องปฏิบัติการคอมพิวเตอร์ขนาดกลาง มี Smart TV 65 นิ้ว สำหรับนำเสนองาน และอินเทอร์เน็ตความเร็วสูง',
    status: 'Available',
    created_at: '2024-01-01T08:00:00',
  },
  {
    id: 'room-3',
    room_name: 'Network Laboratory',
    room_code: 'NET-LAB',
    location: 'อาคาร CE ชั้น 3 ห้อง 301',
    capacity: 20,
    equipment: 'Router, Switch, Network Cable, Rack',
    description: 'ห้องปฏิบัติการระบบเครือข่าย พร้อมอุปกรณ์ Cisco Router, Managed Switch, Network Rack และสายเครือข่ายครบชุด',
    status: 'Available',
    created_at: '2024-01-01T08:00:00',
  },
  {
    id: 'room-4',
    room_name: 'IoT and Embedded Systems Lab',
    room_code: 'IOT-LAB',
    location: 'อาคาร CE ชั้น 3 ห้อง 302',
    capacity: 20,
    equipment: 'Arduino, ESP32, Sensor Kit, Oscilloscope',
    description: 'ห้องปฏิบัติการ IoT และระบบฝังตัว มีชุด Arduino, ESP32, Sensor Kit หลากหลายประเภท และ Digital Oscilloscope',
    status: 'Available',
    created_at: '2024-01-01T08:00:00',
  },
  {
    id: 'room-5',
    room_name: 'Student Project Room',
    room_code: 'PROJECT-ROOM',
    location: 'อาคาร CE ชั้น 1 ห้อง 101',
    capacity: 10,
    equipment: 'Whiteboard, Meeting Table, Power Outlet',
    description: 'ห้องสำหรับทำโปรเจกต์กลุ่ม มีกระดานไวท์บอร์ดขนาดใหญ่ โต๊ะประชุม และปลั๊กไฟครบทุกจุด',
    status: 'Available',
    created_at: '2024-01-01T08:00:00',
  },
];

/* ─── Helper: Get Date Relative to Today ─── */
function _dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/* ─── Sample Bookings ─── */
const SAMPLE_BOOKINGS = [];

/* ══════════════════════════════════════════════
   ROOM OPERATIONS
══════════════════════════════════════════════ */
function getRooms() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.ROOMS) || '[]');
}

function saveRooms(rooms) {
  localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
}

function getRoomById(id) {
  return getRooms().find(r => r.id === id) || null;
}

function addRoom(data) {
  const rooms = getRooms();
  const room = {
    ...data,
    id: 'room-' + Date.now(),
    created_at: new Date().toISOString(),
  };
  rooms.push(room);
  saveRooms(rooms);
  return room;
}

function updateRoom(id, data) {
  const rooms = getRooms();
  const idx = rooms.findIndex(r => r.id === id);
  if (idx < 0) return null;
  rooms[idx] = { ...rooms[idx], ...data };
  saveRooms(rooms);
  return rooms[idx];
}

function deleteRoom(id) {
  saveRooms(getRooms().filter(r => r.id !== id));
}

/* ══════════════════════════════════════════════
   BOOKING OPERATIONS
══════════════════════════════════════════════ */
function getBookings() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS) || '[]');
}

function saveBookings(bookings) {
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
}

function getBookingById(id) {
  return getBookings().find(b => b.id === id) || null;
}

function getBookingsByEmail(email) {
  return getBookings().filter(b =>
    b.requester_email.toLowerCase() === email.toLowerCase()
  );
}

function getBookingsByRoom(roomId) {
  return getBookings().filter(b => b.room_id === roomId);
}

/**
 * FR-07 — Overlap Detection (SRS Section 14)
 * Overlap occurs when: new_start < existing_end AND new_end > existing_start
 * Only checks against Approved bookings in the same room/date.
 */
function checkOverlap(roomId, date, startTime, endTime, excludeId = null) {
  const bookings = getBookings().filter(b =>
    b.room_id === roomId &&
    b.booking_date === date &&
    b.status === 'Approved' &&
    b.id !== excludeId
  );
  return bookings.some(b => startTime < b.end_time && endTime > b.start_time);
}

/**
 * Get conflicting booking details for error messages
 */
function getConflictingBooking(roomId, date, startTime, endTime, excludeId = null) {
  const bookings = getBookings().filter(b =>
    b.room_id === roomId &&
    b.booking_date === date &&
    b.status === 'Approved' &&
    b.id !== excludeId
  );
  return bookings.find(b => startTime < b.end_time && endTime > b.start_time) || null;
}

function addBooking(data) {
  const bookings = getBookings();
  const booking = {
    ...data,
    id: 'bk-' + Date.now(),
    status: 'Pending',
    admin_comment: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  bookings.push(booking);
  saveBookings(bookings);
  return booking;
}

function updateBookingStatus(id, status, comment = '') {
  const bookings = getBookings();
  const idx = bookings.findIndex(b => b.id === id);
  if (idx < 0) return null;
  bookings[idx].status = status;
  bookings[idx].admin_comment = comment || bookings[idx].admin_comment;
  bookings[idx].updated_at = new Date().toISOString();
  saveBookings(bookings);
  return bookings[idx];
}

/* ══════════════════════════════════════════════
   DASHBOARD / STATS
══════════════════════════════════════════════ */
function getDashboardStats() {
  const bookings = getBookings();
  const rooms = getRooms();
  const now = new Date().toISOString().split('T')[0];

  const byRoom = rooms.map(r => ({
    room_code: r.room_code,
    room_name: r.room_name,
    total: bookings.filter(b => b.room_id === r.id).length,
    approved: bookings.filter(b => b.room_id === r.id && b.status === 'Approved').length,
  }));

  return {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'Pending').length,
    approved: bookings.filter(b => b.status === 'Approved').length,
    rejected: bookings.filter(b => b.status === 'Rejected').length,
    cancelled: bookings.filter(b => b.status === 'Cancelled').length,
    today: bookings.filter(b => b.booking_date === now).length,
    byRoom,
    rooms: rooms.length,
    availableRooms: rooms.filter(r => r.status === 'Available').length,
  };
}

/* ══════════════════════════════════════════════
   INIT — Seed sample data if empty
══════════════════════════════════════════════ */
function initData() {
  if (!localStorage.getItem(STORAGE_KEYS.ROOMS)) {
    saveRooms(SAMPLE_ROOMS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
    saveBookings(SAMPLE_BOOKINGS);
  }
}

function resetData() {
  localStorage.removeItem(STORAGE_KEYS.ROOMS);
  localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
  initData();
}
