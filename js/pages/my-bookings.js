/* ============================================================
   my-bookings.js — My Booking Page (FR-09, FR-13)
   ============================================================ */

function renderMyBookings() {
  const email = localStorage.getItem('ceksu_my_email') || '';
  
  let content = '';
  if (!email) {
    content = `
      <div class="card max-w-md mx-auto text-center mt-12">
        <div class="text-5xl mb-4">🔍</div>
        <h2 class="text-xl font-bold mb-2">ค้นหาประวัติการจองของคุณ</h2>
        <p class="text-gray-500 text-sm mb-6">กรอกอีเมลที่คุณใช้ในการจองเพื่อดูประวัติและสถานะ</p>
        <form onsubmit="handleEmailSearch(event)">
          <input type="email" id="searchEmail" class="form-input mb-4" placeholder="อีเมลของคุณ..." required>
          <button type="submit" class="btn-primary w-full">ค้นหาการจอง</button>
        </form>
      </div>
    `;
  } else {
    const bookings = getBookingsByEmail(email).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const rooms = getRooms();
    
    if (bookings.length === 0) {
      content = `
        <div class="flex items-center justify-between mb-4">
          <p class="text-gray-600">กำลังแสดงการจองของ: <strong class="text-crimson">${email}</strong></p>
          <button onclick="clearEmailSearch()" class="btn-outline text-sm">เปลี่ยนอีเมล</button>
        </div>
        ${emptyState('📋', 'ไม่พบประวัติการจอง', 'คุณยังไม่มีประวัติการจองด้วยอีเมลนี้', 'ไปจองห้องเลย', "navigate('rooms')")}
      `;
    } else {
      const rows = bookings.map(b => {
        const room = rooms.find(r => r.id === b.room_id);
        const roomName = room ? room.room_name : 'ห้องถูกลบ';
        
        return `
          <div class="card mb-4 animate-slide-up">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="font-bold text-lg">${roomName}</span>
                  ${statusBadge(b.status)}
                </div>
                <div class="text-sm text-gray-600 space-y-1">
                  <p>📅 <b>วันที่:</b> ${formatBookingDate(b.booking_date)}</p>
                  <p>⏰ <b>เวลา:</b> ${b.start_time} - ${b.end_time}</p>
                  <p>📝 <b>วัตถุประสงค์:</b> ${b.purpose}</p>
                  ${b.admin_comment ? `<p class="text-red-600 mt-2 bg-red-50 p-2 rounded"><b>หมายเหตุจาก Admin:</b> ${b.admin_comment}</p>` : ''}
                </div>
              </div>
              
              <div class="md:text-right">
                <p class="text-xs text-gray-400 mb-3">ส่งคำขอเมื่อ: ${formatDateTime(b.created_at)}</p>
                ${b.status === 'Pending' 
                  ? `<button onclick="confirmCancelBooking('${b.id}')" class="btn-outline border-red-300 text-red-600 hover:bg-red-50 text-sm">
                      🚫 ยกเลิกคำขอจอง
                     </button>` 
                  : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
      
      content = `
        <div class="flex items-center justify-between mb-6">
          <p class="text-gray-600">กำลังแสดงการจองของ: <strong class="text-crimson">${email}</strong></p>
          <button onclick="clearEmailSearch()" class="btn-outline text-sm">เปลี่ยนอีเมล</button>
        </div>
        ${rows}
      `;
    }
  }

  return `
    ${pageHeader('📋 การจองของฉัน', 'ตรวจสอบสถานะ และประวัติการขอใช้ห้องปฏิบัติการ')}
    <div class="container section max-w-4xl mx-auto">
      ${content}
    </div>
  `;
}

function initMyBookings() {}

function handleEmailSearch(e) {
  e.preventDefault();
  const email = document.getElementById('searchEmail').value.trim();
  if (email) {
    localStorage.setItem('ceksu_my_email', email);
    router();
  }
}

function clearEmailSearch() {
  localStorage.removeItem('ceksu_my_email');
  router();
}

function confirmCancelBooking(id) {
  openModal(
    'ยืนยันการยกเลิก',
    '<p>คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำขอจองนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>',
    `<button onclick="closeModal()" class="btn-outline">ไม่ใช่, ปิด</button>
     <button onclick="executeCancelBooking('${id}')" class="btn-primary bg-red-600 border-red-600 hover:bg-red-700 hover:border-red-700">ใช่, ยกเลิกการจอง</button>`
  );
}

function executeCancelBooking(id) {
  updateBookingStatus(id, 'Cancelled', 'ยกเลิกโดยผู้จอง');
  closeModal();
  showToast('ยกเลิกคำขอจองสำเร็จ', 'info');
  router(); // refresh
}
