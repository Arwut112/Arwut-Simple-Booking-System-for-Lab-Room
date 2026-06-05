/* ============================================================
   server.js — Express + JSON File Database
   CE Lab Booking System | มหาวิทยาลัยกาฬสินธุ์
   ข้อมูลเก็บในไฟล์ database.json | รูปภาพเก็บในโฟลเดอร์ uploads/
   ============================================================ */

const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = 3000;
const DB_FILE      = path.join(__dirname, 'database.json');
const UPLOADS_DIR  = path.join(__dirname, 'uploads');

// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

/* ══════════════════════════════════════════════
   JSON FILE DATABASE HELPERS
══════════════════════════════════════════════ */

const SAMPLE_ROOMS = [
  {
    id: 'room-1', room_name: 'Computer Engineering Lab 1', room_code: 'CE-LAB-01',
    location: 'อาคาร CE ชั้น 2 ห้อง 201', capacity: 30,
    equipment: 'Computer, Projector, Internet',
    description: 'ห้องปฏิบัติการคอมพิวเตอร์หลัก มีเครื่องคอมพิวเตอร์ 30 เครื่อง โปรเจคเตอร์ความละเอียดสูง และอินเทอร์เน็ตความเร็วสูง เหมาะสำหรับสอนและสอบปฏิบัติการ',
    status: 'Available', image_url: null, created_at: '2024-01-01T08:00:00'
  },
  {
    id: 'room-2', room_name: 'Computer Engineering Lab 2', room_code: 'CE-LAB-02',
    location: 'อาคาร CE ชั้น 2 ห้อง 202', capacity: 25,
    equipment: 'Computer, Smart TV, Internet',
    description: 'ห้องปฏิบัติการคอมพิวเตอร์ขนาดกลาง มี Smart TV 65 นิ้ว สำหรับนำเสนองาน และอินเทอร์เน็ตความเร็วสูง',
    status: 'Available', image_url: null, created_at: '2024-01-01T08:00:00'
  },
  {
    id: 'room-3', room_name: 'Network Laboratory', room_code: 'NET-LAB',
    location: 'อาคาร CE ชั้น 3 ห้อง 301', capacity: 20,
    equipment: 'Router, Switch, Network Cable, Rack',
    description: 'ห้องปฏิบัติการระบบเครือข่าย พร้อมอุปกรณ์ Cisco Router, Managed Switch, Network Rack และสายเครือข่ายครบชุด',
    status: 'Available', image_url: null, created_at: '2024-01-01T08:00:00'
  },
  {
    id: 'room-4', room_name: 'IoT and Embedded Systems Lab', room_code: 'IOT-LAB',
    location: 'อาคาร CE ชั้น 3 ห้อง 302', capacity: 20,
    equipment: 'Arduino, ESP32, Sensor Kit, Oscilloscope',
    description: 'ห้องปฏิบัติการ IoT และระบบฝังตัว มีชุด Arduino, ESP32, Sensor Kit หลากหลายประเภท และ Digital Oscilloscope',
    status: 'Available', image_url: null, created_at: '2024-01-01T08:00:00'
  },
  {
    id: 'room-5', room_name: 'Student Project Room', room_code: 'PROJECT-ROOM',
    location: 'อาคาร CE ชั้น 1 ห้อง 101', capacity: 10,
    equipment: 'Whiteboard, Meeting Table, Power Outlet',
    description: 'ห้องสำหรับทำโปรเจกต์กลุ่ม มีกระดานไวท์บอร์ดขนาดใหญ่ โต๊ะประชุม และปลั๊กไฟครบทุกจุด',
    status: 'Available', image_url: null, created_at: '2024-01-01T08:00:00'
  },
];

/** อ่านฐานข้อมูลจากไฟล์ JSON */
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = { rooms: SAMPLE_ROOMS, bookings: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    console.log('✅ สร้างไฟล์ database.json พร้อม sample data 5 ห้อง');
    return initial;
  }
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  // Migrate: เพิ่ม image_url ให้ห้องเก่าที่ยังไม่มี
  db.rooms = db.rooms.map(r => ({ image_url: null, ...r }));
  return db;
}

/** บันทึกฐานข้อมูลลงไฟล์ JSON */
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/* ══════════════════════════════════════════════
   MIDDLEWARE
══════════════════════════════════════════════ */
app.use(express.json({ limit: '20mb' }));
app.use(express.static(__dirname));
// Serve ไฟล์รูปภาพจากโฟลเดอร์ uploads/
app.use('/uploads', express.static(UPLOADS_DIR));

/* ══════════════════════════════════════════════
   IMAGE UPLOAD API (Base64 → file)
   POST /api/rooms/:id/image
   Body: { base64: "data:image/jpeg;base64,...", filename: "room.jpg" }
══════════════════════════════════════════════ */
app.post('/api/rooms/:id/image', (req, res) => {
  const db  = readDB();
  const idx = db.rooms.findIndex(r => r.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Room not found' });

  const { base64, filename } = req.body;
  if (!base64) return res.status(400).json({ error: 'No image data' });

  // ถอด base64 header แล้วบันทึกเป็นไฟล์
  const matches = base64.match(/^data:(.+);base64,(.+)$/);
  if (!matches) return res.status(400).json({ error: 'Invalid base64' });

  const ext      = matches[1].split('/')[1].replace('jpeg', 'jpg');
  const safeName = `${req.params.id}-${Date.now()}.${ext}`;
  const filePath = path.join(UPLOADS_DIR, safeName);

  // ลบรูปเก่าถ้ามี
  const oldImage = db.rooms[idx].image_url;
  if (oldImage) {
    const oldPath = path.join(__dirname, oldImage.replace(/^\//, ''));
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64'));

  const imageUrl = `/uploads/${safeName}`;
  db.rooms[idx].image_url = imageUrl;
  writeDB(db);

  res.json({ ok: true, image_url: imageUrl });
});

// DELETE /api/rooms/:id/image — ลบรูปห้อง
app.delete('/api/rooms/:id/image', (req, res) => {
  const db  = readDB();
  const idx = db.rooms.findIndex(r => r.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Room not found' });

  const oldImage = db.rooms[idx].image_url;
  if (oldImage) {
    const oldPath = path.join(__dirname, oldImage.replace(/^\//, ''));
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }
  db.rooms[idx].image_url = null;
  writeDB(db);
  res.json({ ok: true });
});

/* ══════════════════════════════════════════════
   ROOMS API
══════════════════════════════════════════════ */

app.get('/api/rooms', (req, res) => {
  const db = readDB();
  res.json(db.rooms);
});

app.get('/api/rooms/:id', (req, res) => {
  const db   = readDB();
  const room = db.rooms.find(r => r.id === req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

app.post('/api/rooms', (req, res) => {
  const db   = readDB();
  const data = req.body;
  if (db.rooms.find(r => r.room_code === data.room_code)) {
    return res.status(409).json({ error: 'room_code already exists' });
  }
  const room = {
    ...data,
    id:         'room-' + Date.now(),
    image_url:  null,
    status:     data.status || 'Available',
    created_at: new Date().toISOString(),
  };
  db.rooms.push(room);
  writeDB(db);
  res.status(201).json(room);
});

app.put('/api/rooms/:id', (req, res) => {
  const db  = readDB();
  const idx = db.rooms.findIndex(r => r.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Room not found' });
  const dup = db.rooms.find(r => r.room_code === req.body.room_code && r.id !== req.params.id);
  if (dup) return res.status(409).json({ error: 'room_code already exists' });
  db.rooms[idx] = { ...db.rooms[idx], ...req.body };
  writeDB(db);
  res.json(db.rooms[idx]);
});

app.delete('/api/rooms/:id', (req, res) => {
  const db  = readDB();
  const idx = db.rooms.findIndex(r => r.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Room not found' });
  // ลบรูปภาพถ้ามี
  const img = db.rooms[idx].image_url;
  if (img) {
    const p = path.join(__dirname, img.replace(/^\//, ''));
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  db.rooms.splice(idx, 1);
  writeDB(db);
  res.json({ success: true });
});

/* ══════════════════════════════════════════════
   BOOKINGS API
══════════════════════════════════════════════ */

app.get('/api/bookings', (req, res) => {
  const db = readDB();
  res.json(db.bookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
});

app.get('/api/bookings/:id', (req, res) => {
  const db      = readDB();
  const booking = db.bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  res.json(booking);
});

app.post('/api/bookings', (req, res) => {
  const db   = readDB();
  const { room_id, booking_date, start_time, end_time } = req.body;
  const conflict = db.bookings.find(b =>
    b.room_id === room_id && b.booking_date === booking_date &&
    b.status === 'Approved' && start_time < b.end_time && end_time > b.start_time
  );
  if (conflict) {
    return res.status(409).json({ error: 'overlap', conflict: { start_time: conflict.start_time, end_time: conflict.end_time } });
  }
  const now     = new Date().toISOString();
  const booking = { ...req.body, id: 'bk-' + Date.now(), status: 'Pending', admin_comment: '', created_at: now, updated_at: now };
  db.bookings.push(booking);
  writeDB(db);
  res.status(201).json(booking);
});

app.put('/api/bookings/:id/status', (req, res) => {
  const db  = readDB();
  const idx = db.bookings.findIndex(b => b.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Booking not found' });
  const booking = db.bookings[idx];
  const { status, admin_comment } = req.body;
  if (status === 'Approved') {
    const conflict = db.bookings.find(b =>
      b.room_id === booking.room_id && b.booking_date === booking.booking_date &&
      b.status === 'Approved' && b.id !== booking.id &&
      booking.start_time < b.end_time && booking.end_time > b.start_time
    );
    if (conflict) return res.status(409).json({ error: 'overlap', conflict: { start_time: conflict.start_time, end_time: conflict.end_time } });
  }
  db.bookings[idx] = { ...booking, status, admin_comment: admin_comment !== undefined ? admin_comment : booking.admin_comment, updated_at: new Date().toISOString() };
  writeDB(db);
  res.json(db.bookings[idx]);
});

/* ══════════════════════════════════════════════
   STATS API
══════════════════════════════════════════════ */
app.get('/api/stats', (req, res) => {
  const db = readDB();
  const today = new Date().toISOString().split('T')[0];
  const { rooms, bookings } = db;
  const byRoom = rooms.map(r => ({
    room_code: r.room_code, room_name: r.room_name,
    total:    bookings.filter(b => b.room_id === r.id).length,
    approved: bookings.filter(b => b.room_id === r.id && b.status === 'Approved').length,
  }));
  res.json({
    total: bookings.length,
    pending:        bookings.filter(b => b.status === 'Pending').length,
    approved:       bookings.filter(b => b.status === 'Approved').length,
    rejected:       bookings.filter(b => b.status === 'Rejected').length,
    cancelled:      bookings.filter(b => b.status === 'Cancelled').length,
    today:          bookings.filter(b => b.booking_date === today).length,
    rooms:          rooms.length,
    availableRooms: rooms.filter(r => r.status === 'Available').length,
    byRoom,
  });
});

/* ══════════════════════════════════════════════
   START SERVER
══════════════════════════════════════════════ */
app.listen(PORT, () => {
  readDB();
  console.log('');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   CE Lab Booking System — Local Server         ║');
  console.log('╠════════════════════════════════════════════════╣');
  console.log(`║   🌐  http://localhost:${PORT}                  ║`);
  console.log(`║   🗄️   ฐานข้อมูล: database.json (ในโฟลเดอร์)   ║`);
  console.log(`║   🖼️   รูปภาพ: uploads/ (ในโฟลเดอร์)            ║`);
  console.log('║   กด Ctrl+C เพื่อหยุด server                  ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');
});
