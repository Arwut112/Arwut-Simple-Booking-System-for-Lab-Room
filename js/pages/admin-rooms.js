/* ============================================================
   admin-rooms.js — Admin Room Management (FR-03, FR-04, FR-05)
   ============================================================ */

function renderAdminRooms() {
  const rooms = getRooms();
  
  const rows = rooms.map(r => `
    <tr class="table-row hover:bg-gray-50 transition">
      <td class="table-cell">
        <div class="flex items-center gap-3">
          <div class="text-2xl">${roomIcon(r.room_code)}</div>
          <div>
            <div class="font-bold text-gray-800">${r.room_name}</div>
            <div class="text-xs text-crimson">${r.room_code}</div>
          </div>
        </div>
      </td>
      <td class="table-cell hidden md:table-cell">
        <div class="text-sm">👥 ${r.capacity} คน</div>
        <div class="text-xs text-gray-500 truncate max-w-[150px]" title="${r.location}">📍 ${r.location}</div>
      </td>
      <td class="table-cell text-center">
        ${roomStatusBadge(r.status)}
      </td>
      <td class="table-cell text-center">
        <div class="flex justify-center gap-2">
          <button onclick="editRoom('${r.id}')" class="text-blue-600 hover:text-blue-800 p-1" title="แก้ไข">✏️</button>
          <button onclick="confirmDeleteRoom('${r.id}')" class="text-red-600 hover:text-red-800 p-1" title="ลบ">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');

  return `
    ${pageHeader('🏢 จัดการห้องปฏิบัติการ', 'เพิ่ม แก้ไข และลบข้อมูลห้องปฏิบัติการ', 
      `<button onclick="createNewRoom()" class="btn-primary flex items-center gap-2"><span>➕</span> เพิ่มห้องใหม่</button>`
    )}
    
    <div class="container section">
      <div class="card shadow-sm p-0 overflow-hidden">
        <div class="table-wrapper">
          <table class="table w-full mb-0">
            <thead>
              <tr>
                <th class="table-th">ชื่อห้อง / รหัสห้อง</th>
                <th class="table-th hidden md:table-cell">ความจุ / สถานที่</th>
                <th class="table-th text-center">สถานะ</th>
                <th class="table-th text-center w-24">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              ${rows.length > 0 ? rows : `<tr><td colspan="4" class="text-center py-8 text-gray-500">ไม่มีข้อมูลห้องปฏิบัติการ</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function initAdminRooms() {}

function getRoomFormHtml(room = null) {
  const isEdit = !!room;
  return `
    <form id="adminRoomForm" onsubmit="handleRoomSubmit(event, '${isEdit ? room.id : ''}')" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-group mb-0">
          <label class="form-label text-xs">ชื่อห้อง <span class="text-crimson">*</span></label>
          <input type="text" id="r_name" class="form-input text-sm" required placeholder="Computer Engineering Lab 1" value="${isEdit ? room.room_name : ''}">
        </div>
        <div class="form-group mb-0">
          <label class="form-label text-xs">รหัสห้อง <span class="text-crimson">*</span></label>
          <input type="text" id="r_code" class="form-input text-sm font-mono" required placeholder="CE-LAB-01" value="${isEdit ? room.room_code : ''}">
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-group mb-0">
          <label class="form-label text-xs">ความจุ (คน) <span class="text-crimson">*</span></label>
          <input type="number" id="r_cap" class="form-input text-sm" required min="1" value="${isEdit ? room.capacity : '30'}">
        </div>
        <div class="form-group mb-0">
          <label class="form-label text-xs">สถานะ <span class="text-crimson">*</span></label>
          <select id="r_status" class="form-input text-sm">
            <option value="Available" ${isEdit && room.status === 'Available' ? 'selected' : ''}>✅ Available (พร้อมใช้งาน)</option>
            <option value="Maintenance" ${isEdit && room.status === 'Maintenance' ? 'selected' : ''}>🔧 Maintenance (ซ่อมบำรุง)</option>
            <option value="Closed" ${isEdit && room.status === 'Closed' ? 'selected' : ''}>🚫 Closed (ปิดให้บริการ)</option>
          </select>
        </div>
      </div>

      <div class="form-group mb-0">
        <label class="form-label text-xs">สถานที่ <span class="text-crimson">*</span></label>
        <input type="text" id="r_loc" class="form-input text-sm" required placeholder="อาคาร CE ชั้น 2 ห้อง 201" value="${isEdit ? room.location : ''}">
      </div>

      <div class="form-group mb-0">
        <label class="form-label text-xs">อุปกรณ์ (คั่นด้วยลูกน้ำ ,)</label>
        <input type="text" id="r_equip" class="form-input text-sm" placeholder="Computer, Projector, Internet" value="${isEdit ? room.equipment : ''}">
      </div>

      <div class="form-group mb-0">
        <label class="form-label text-xs">รายละเอียด</label>
        <textarea id="r_desc" class="form-input text-sm h-20">${isEdit ? room.description : ''}</textarea>
      </div>

      <div class="flex gap-3 pt-4 border-t border-gray-100 mt-6">
        <button type="button" onclick="closeModal()" class="btn-outline flex-1 text-sm py-2">ยกเลิก</button>
        <button type="submit" class="btn-primary flex-1 text-sm py-2">${isEdit ? '💾 บันทึกการแก้ไข' : '➕ เพิ่มห้อง'}</button>
      </div>
    </form>
  `;
}

function createNewRoom() {
  openModal('เพิ่มห้องปฏิบัติการใหม่', getRoomFormHtml());
}

function editRoom(id) {
  const room = getRoomById(id);
  if (!room) return;
  openModal('แก้ไขข้อมูลห้องปฏิบัติการ', getRoomFormHtml(room));
}

function handleRoomSubmit(e, roomId) {
  e.preventDefault();
  
  const data = {
    room_name: document.getElementById('r_name').value.trim(),
    room_code: document.getElementById('r_code').value.trim(),
    capacity: parseInt(document.getElementById('r_cap').value),
    status: document.getElementById('r_status').value,
    location: document.getElementById('r_loc').value.trim(),
    equipment: document.getElementById('r_equip').value.trim(),
    description: document.getElementById('r_desc').value.trim()
  };

  if (roomId) {
    updateRoom(roomId, data);
    showToast('บันทึกข้อมูลห้องสำเร็จ', 'success');
  } else {
    addRoom(data);
    showToast('เพิ่มห้องปฏิบัติการสำเร็จ', 'success');
  }
  
  closeModal();
  router(); // refresh
}

function confirmDeleteRoom(id) {
  const room = getRoomById(id);
  if (!room) return;
  
  // Check if there are active bookings
  const bookings = getBookingsByRoom(id).filter(b => b.status === 'Pending' || b.status === 'Approved');
  
  if (bookings.length > 0) {
    openModal(
      'ไม่สามารถลบห้องได้',
      `<div class="text-center">
        <div class="text-4xl mb-3">⚠️</div>
        <p class="text-red-600 font-bold mb-2">ห้อง ${room.room_code} มีการจองค้างอยู่</p>
        <p class="text-sm text-gray-600 mb-4">มีรายการจองที่รออนุมัติหรืออนุมัติแล้วจำนวน ${bookings.length} รายการ กรุณายกเลิกหรือปฏิเสธการจองทั้งหมดก่อนลบห้องนี้</p>
      </div>`,
      `<button onclick="closeModal()" class="btn-primary w-full">เข้าใจแล้ว</button>`
    );
    return;
  }

  openModal(
    'ยืนยันการลบห้อง',
    `<p>คุณแน่ใจหรือไม่ว่าต้องการลบห้อง <b>${room.room_name} (${room.room_code})</b>?</p>
     <p class="text-sm text-red-600 mt-2">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>`,
    `<button onclick="closeModal()" class="btn-outline">ยกเลิก</button>
     <button onclick="executeDeleteRoom('${id}')" class="btn-primary bg-red-600 border-red-600 hover:bg-red-700">🗑️ ยืนยันการลบ</button>`
  );
}

function executeDeleteRoom(id) {
  deleteRoom(id);
  closeModal();
  showToast('ลบห้องปฏิบัติการสำเร็จ', 'success');
  router(); // refresh
}
