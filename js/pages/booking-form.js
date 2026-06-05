/* ============================================================
   booking-form.js — Booking Form Page (FR-06, FR-07, FR-08)
   ============================================================ */

function renderBookingForm(roomId) {
  const room = getRoomById(roomId);
  if (!room || room.status !== 'Available') {
    return `<div class="container section">${emptyState('🚫', 'ไม่สามารถจองได้', 'ห้องนี้ไม่พบ หรือไม่เปิดให้จองในขณะนี้', 'กลับไปดูห้องทั้งหมด', "navigate('rooms')")}</div>`;
  }

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  return `
    ${pageHeader('📝 ส่งคำขอจองห้อง', `กรอกข้อมูลเพื่อขอจองห้อง ${room.room_name}`)}
    <div class="container section max-w-3xl mx-auto">
      <div class="card">
        <div class="flex items-start justify-between mb-6 pb-6 border-b border-gray-100">
          <div>
            <h2 class="text-xl font-bold text-gray-800">${room.room_name}</h2>
            <p class="text-crimson font-medium text-sm">${room.room_code}</p>
          </div>
          <div class="text-right">
            <span class="text-sm text-gray-500 block">ความจุ</span>
            <span class="font-bold">👥 ${room.capacity} คน</span>
          </div>
        </div>

        <form id="bookingForm" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="form-group">
              <label class="form-label">ชื่อ - นามสกุล <span class="text-crimson">*</span></label>
              <input type="text" id="bf_name" class="form-input" required placeholder="นายสมชาย ใจดี" value="นายสมชาย ใจดี">
            </div>
            <div class="form-group">
              <label class="form-label">อีเมล <span class="text-crimson">*</span></label>
              <input type="email" id="bf_email" class="form-input" required placeholder="somchai@ksu.ac.th" value="somchai@ksu.ac.th">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="form-group">
              <label class="form-label">ประเภทผู้จอง <span class="text-crimson">*</span></label>
              <select id="bf_type" class="form-input" required>
                <option value="Student">🎓 นักศึกษา</option>
                <option value="Teacher">👨‍🏫 อาจารย์</option>
                <option value="Staff">💼 เจ้าหน้าที่</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">จำนวนผู้ใช้งาน <span class="text-crimson">*</span> (สูงสุด ${room.capacity} คน)</label>
              <input type="number" id="bf_users" class="form-input" required min="1" max="${room.capacity}" value="1">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">วันที่จอง <span class="text-crimson">*</span></label>
            <input type="date" id="bf_date" class="form-input" required min="${today}">
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="form-group">
              <label class="form-label">เวลาเริ่มต้น <span class="text-crimson">*</span></label>
              <select id="bf_start" class="form-input" required>
                ${generateTimeOptions()}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">เวลาสิ้นสุด <span class="text-crimson">*</span></label>
              <select id="bf_end" class="form-input" required>
                ${generateTimeOptions()}
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">วัตถุประสงค์การใช้งาน <span class="text-crimson">*</span></label>
            <textarea id="bf_purpose" class="form-input h-24" required placeholder="เช่น สอบปฏิบัติการวิชา..., ทำโปรเจกต์..."></textarea>
          </div>

          <div id="bookingAlert" class="hidden rounded p-4 text-sm font-medium"></div>

          <div class="flex gap-4 pt-4 border-t border-gray-100">
            <button type="button" onclick="navigate('room','${roomId}')" class="btn-outline flex-1">
              ยกเลิก
            </button>
            <button type="submit" class="btn-primary flex-1">
              🚀 ยืนยันการจอง
            </button>
          </div>
        </form>
      </div>
    </div>`;
}

function generateTimeOptions() {
  let options = '<option value="" disabled selected>เลือกเวลา</option>';
  for (let i = 8; i <= 18; i++) {
    const h = i.toString().padStart(2, '0');
    options += `<option value="${h}:00">${h}:00</option>`;
    if (i !== 18) {
      options += `<option value="${h}:30">${h}:30</option>`;
    }
  }
  return options;
}

function initBookingForm(roomId) {
  const form = document.getElementById('bookingForm');
  if (!form) return;
  
  // Set default name and email values from HTML attributes
  const nameInput = document.getElementById('bf_name');
  const emailInput = document.getElementById('bf_email');
  if (nameInput) nameInput.value = 'นายสมชาย ใจดี';
  if (emailInput) emailInput.value = 'somchai@ksu.ac.th';
  
  // remove any existing listener to avoid duplicates
  form.removeEventListener('submit', form._bookingSubmitHandler);
  const room = getRoomById(roomId);
  const maxCapacity = room ? room.capacity : null;
  const handler = function(e) { handleBookingSubmit(e, roomId, maxCapacity); };
  form.addEventListener('submit', handler);
  // store reference so we can remove later if needed
  form._bookingSubmitHandler = handler;
}

async function handleBookingSubmit(e, roomId, maxCapacity) {
  e.preventDefault();

  const name    = document.getElementById('bf_name').value.trim();
  const email   = document.getElementById('bf_email').value.trim();
  const type    = document.getElementById('bf_type').value;
  const users   = parseInt(document.getElementById('bf_users').value);
  const date    = document.getElementById('bf_date').value;
  const start   = document.getElementById('bf_start').value;
  const end     = document.getElementById('bf_end').value;
  const purpose = document.getElementById('bf_purpose').value.trim();

  const alertBox = document.getElementById('bookingAlert');
  alertBox.className = 'hidden p-4 rounded text-sm font-medium mb-4';

  function showError(msg) {
    alertBox.innerHTML = `❌ ${msg}`;
    alertBox.classList.remove('hidden');
    alertBox.classList.add('bg-red-50', 'text-red-600', 'border', 'border-red-200');
    window.scrollTo({ top: alertBox.offsetTop - 100, behavior: 'smooth' });
  }

  // 1. Validate basic rules
  if (users > maxCapacity) {
    return showError(`จำนวนผู้ใช้งานเกินความจุของห้อง (สูงสุด ${maxCapacity} คน)`);
  }
  if (start >= end) {
    return showError('เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด');
  }

  // เปลี่ยน submit เป็น loading state
  const submitBtn = e.target.querySelector('[type="submit"]');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ กำลังบันทึก...'; }

  try {
    // 2. บันทึกลง SQLite (พร้อมตรวจ overlap ฝั่ง server)
    const result = await addBooking({
      room_id:         roomId,
      requester_name:  name,
      requester_email: email,
      requester_type:  type,
      booking_date:    date,
      start_time:      start,
      end_time:        end,
      purpose:         purpose,
      number_of_users: users,
    });

    if (!result.ok) {
      // overlap conflict
      return showError(`เวลาที่เลือกซ้ำซ้อนกับการจองอื่น: <br>มีผู้จองแล้วเวลา <b>${result.conflict.start_time} - ${result.conflict.end_time}</b>`);
    }

    showToast('ส่งคำขอจองสำเร็จ! กรุณารอการอนุมัติ', 'success');
    navigate('my-bookings');
  } catch (err) {
    showError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    console.error(err);
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '🚀 ยืนยันการจอง'; }
  }
}
