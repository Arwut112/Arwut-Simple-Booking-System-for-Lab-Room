/* ============================================================
   admin.js — Admin Booking Management Page (FR-10, FR-11, FR-12, FR-15)
   ============================================================ */

function renderAdminBookings() {
  const bookings = getBookings().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const rooms = getRooms();
  
  let content = '';
  
  if (bookings.length === 0) {
    content = emptyState('📋', 'ไม่มีรายการจอง', 'ยังไม่มีผู้ส่งคำขอจองห้องเข้ามาในระบบ');
  } else {
    const rows = bookings.map(b => {
      const room = rooms.find(r => r.id === b.room_id);
      const roomName = room ? room.room_name : 'ห้องถูกลบ';
      const roomCode = room ? room.room_code : '-';
      
      let actions = '';
      if (b.status === 'Pending') {
        actions = `
          <button onclick="adminApprove('${b.id}')" class="btn-primary py-1 px-2 text-xs bg-green-600 border-green-600 hover:bg-green-700 hover:border-green-700">✅ อนุมัติ</button>
          <button onclick="adminReject('${b.id}')" class="btn-primary py-1 px-2 text-xs bg-red-600 border-red-600 hover:bg-red-700 hover:border-red-700">❌ ปฏิเสธ</button>
        `;
      } else if (b.status === 'Approved') {
         actions = `
          <button onclick="adminCancel('${b.id}')" class="btn-outline py-1 px-2 text-xs border-red-300 text-red-600 hover:bg-red-50">🚫 ยกเลิก</button>
        `;
      }
      
      return `
        <tr class="table-row hover:bg-gray-50 transition" data-status="${b.status}" data-room="${b.room_id}">
          <td class="table-cell">
            <div class="font-bold text-gray-800">${roomName}</div>
            <div class="text-xs text-crimson">${roomCode}</div>
          </td>
          <td class="table-cell">
            <div class="font-medium">${formatBookingDate(b.booking_date)}</div>
            <div class="text-xs text-gray-500">${b.start_time} - ${b.end_time}</div>
          </td>
          <td class="table-cell">
            <div>${typeIcon(b.requester_type)} ${b.requester_name}</div>
            <div class="text-xs text-gray-500">${b.requester_email}</div>
          </td>
          <td class="table-cell text-center">
            ${statusBadge(b.status)}
            ${b.admin_comment ? `<div class="text-[10px] text-gray-400 mt-1 truncate max-w-[100px] mx-auto" title="${b.admin_comment}">💬 มีหมายเหตุ</div>` : ''}
          </td>
          <td class="table-cell text-center">
            <div class="flex flex-col gap-1 items-center justify-center">
              ${actions}
              <button onclick="showBookingDetail('${b.id}')" class="text-xs text-blue-600 hover:underline">รายละเอียด</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    content = `
      <div class="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 bg-white p-4 rounded shadow-sm border border-gray-100">
        <div class="flex flex-wrap items-center gap-4 w-full">
          <!-- Text Search -->
          <div class="flex-1 min-w-[200px]">
            <input type="text" id="searchBooking" class="form-input text-sm py-1.5" placeholder="🔍 ค้นหาผู้จอง, อีเมล..." onkeyup="filterAdminBookings()">
          </div>
          <!-- Filters -->
          <div class="flex items-center gap-2">
            <span class="text-gray-600 text-sm font-bold">\u0e2a\u0e16\u0e32\u0e19\u0e30:</span>
            <select id="filterStatus" class="form-input py-1.5 text-sm w-auto" onchange="filterAdminBookings()">
              <option value="all">\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14</option>
              <option value="Pending">\u23f3 Pending</option>
              <option value="Approved">\u2705 Approved</option>
              <option value="Rejected">\u274c Rejected</option>
              <option value="Cancelled">\ud83d\udeab Cancelled</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-600 text-sm font-bold">\u0e2b\u0e49\u0e2d\u0e07:</span>
            <select id="filterRoom" class="form-input py-1.5 text-sm w-auto max-w-[200px]" onchange="filterAdminBookings()">
              <option value="all">\u0e17\u0e38\u0e01\u0e2b\u0e49\u0e2d\u0e07</option>
              ${rooms.map(r => `<option value="${r.id}">${r.room_code}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
      
      <div class="table-wrapper">
        <table class="table w-full">
          <thead>
            <tr>
              <th class="table-th">ห้องปฏิบัติการ</th>
              <th class="table-th">วันและเวลา</th>
              <th class="table-th">ผู้จอง</th>
              <th class="table-th text-center">สถานะ</th>
              <th class="table-th text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody id="adminBookingTbody">
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  return `
    ${pageHeader('🛡️ จัดการรายการจอง (Admin)', 'ตรวจสอบ อนุมัติ และปฏิเสธคำขอจองห้อง')}
    <div class="container section">
      ${content}
    </div>
  `;
}

function initAdminBookings() {}

function filterAdminBookings() {
  const statusFilter = document.getElementById('filterStatus')?.value || 'all';
  const roomFilter = document.getElementById('filterRoom')?.value || 'all';
  const searchText = (document.getElementById('searchBooking')?.value || '').toLowerCase();
  
  const rows = document.querySelectorAll('#adminBookingTbody tr');
  rows.forEach(row => {
    const s = row.dataset.status;
    const r = row.dataset.room;
    // Get text content of the whole row for searching
    const textContent = row.textContent.toLowerCase();
    
    const statusMatch = statusFilter === 'all' || s === statusFilter;
    const roomMatch = roomFilter === 'all' || r === roomFilter;
    const searchMatch = !searchText || textContent.includes(searchText);
    
    if (statusMatch && roomMatch && searchMatch) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

function adminApprove(id) {
  const b = getBookingById(id);
  // Re-check overlap before approval
  const conflict = getConflictingBooking(b.room_id, b.booking_date, b.start_time, b.end_time, id);
  
  if (conflict) {
    showToast(`ไม่สามารถอนุมัติได้! เวลาซ้ำซ้อนกับการจองอื่น (${conflict.start_time} - ${conflict.end_time})`, 'error');
    return;
  }
  
  openModal(
    'ยืนยันการอนุมัติ',
    `<p>คุณต้องการ <b>อนุมัติ</b> คำขอจองนี้ใช่หรือไม่?</p>
     <textarea id="adminComment" class="form-input mt-3 h-20" placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)..."></textarea>`,
    `<button onclick="closeModal()" class="btn-outline">ยกเลิก</button>
     <button onclick="executeAction('${id}', 'Approved')" class="btn-primary bg-green-600 border-green-600 hover:bg-green-700 hover:border-green-700">✅ ยืนยันการอนุมัติ</button>`
  );
}

function adminReject(id) {
  openModal(
    'ยืนยันการปฏิเสธ',
    `<p>คุณต้องการ <b>ปฏิเสธ</b> คำขอจองนี้ใช่หรือไม่?</p>
     <textarea id="adminComment" class="form-input mt-3 h-20" placeholder="เหตุผลที่ปฏิเสธ (บังคับ)..." required></textarea>`,
    `<button onclick="closeModal()" class="btn-outline">ยกเลิก</button>
     <button onclick="executeAction('${id}', 'Rejected', true)" class="btn-primary bg-red-600 border-red-600 hover:bg-red-700 hover:border-red-700">❌ ยืนยันการปฏิเสธ</button>`
  );
}

function adminCancel(id) {
  openModal(
    'ยืนยันการยกเลิกรายการอนุมัติ',
    `<p>รายการนี้ <b>อนุมัติไปแล้ว</b> คุณต้องการยกเลิกใช่หรือไม่?</p>
     <textarea id="adminComment" class="form-input mt-3 h-20" placeholder="เหตุผลที่ยกเลิก (บังคับ)..." required></textarea>`,
    `<button onclick="closeModal()" class="btn-outline">ยกเลิก</button>
     <button onclick="executeAction('${id}', 'Cancelled', true)" class="btn-primary bg-red-600 border-red-600 hover:bg-red-700 hover:border-red-700">🚫 ยืนยันการยกเลิก</button>`
  );
}

async function executeAction(id, status, requireComment = false) {
  const commentInput = document.getElementById('adminComment');
  const comment = commentInput ? commentInput.value.trim() : '';
  
  if (requireComment && !comment) {
    alert('กรุณาระบุเหตุผล/หมายเหตุ');
    return;
  }

  try {
    const result = await updateBookingStatus(id, status, comment);
    if (!result.ok) {
      closeModal();
      showToast(`ไม่สามารถอนุมัติได้! เวลาซ้ำซ้อนกับการจองอื่น (${result.conflict.start_time} - ${result.conflict.end_time})`, 'error');
      return;
    }
    closeModal();
    showToast(`เปลี่ยนสถานะเป็น ${status} สำเร็จ`, 'success');
    router(); // refresh view
  } catch (err) {
    closeModal();
    showToast('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
    console.error(err);
  }
}
