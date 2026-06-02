/* ============================================================
   schedule.js — Booking Schedule Page (FR-14)
   ============================================================ */

let currentScheduleDate = new Date().toISOString().split('T')[0];

function renderSchedule() {
  const rooms = getRooms();
  const bookings = getBookings().filter(b => b.status === 'Approved');
  
  // Filter bookings for the selected date
  const dayBookings = bookings.filter(b => b.booking_date === currentScheduleDate);
  
  let scheduleContent = '';
  
  if (rooms.length === 0) {
    scheduleContent = emptyState('🏢', 'ไม่มีข้อมูลห้องปฏิบัติการ', '');
  } else {
    // Generate simple time slots (08:00 - 18:00)
    const hours = [];
    for(let i=8; i<=17; i++) {
      hours.push(`${i.toString().padStart(2,'0')}:00`);
    }

    let headerRow = `<th class="table-th w-24 text-center border-r">เวลา \\ ห้อง</th>`;
    rooms.forEach(r => {
      headerRow += `<th class="table-th text-center border-r min-w-[150px]">
        <div class="font-bold text-crimson">${r.room_code}</div>
        <div class="text-xs text-gray-500 font-normal">${r.room_name}</div>
      </th>`;
    });

    let bodyRows = '';
    hours.forEach((h, idx) => {
      let row = `<tr><td class="table-cell text-center font-mono text-gray-500 border-r border-b bg-gray-50">${h}</td>`;
      
      rooms.forEach(r => {
        // Find if there's an approved booking in this room that covers this hour
        const b = dayBookings.find(bk => {
          const startHour = parseInt(bk.start_time.split(':')[0]);
          const endHour = parseInt(bk.end_time.split(':')[0]);
          const currentHour = parseInt(h.split(':')[0]);
          return currentHour >= startHour && currentHour < endHour;
        });

        if (b) {
          // To prevent repeating the block for multi-hour bookings, only render it on the first hour
          const startHour = parseInt(b.start_time.split(':')[0]);
          const currentHour = parseInt(h.split(':')[0]);
          
          if (currentHour === startHour) {
            const span = parseInt(b.end_time.split(':')[0]) - startHour;
            row += `<td class="border-r border-b p-2 bg-chalk align-top" rowspan="${span}">
              <div class="bg-white border-l-4 border-crimson shadow-sm rounded p-2 h-full cursor-pointer hover:shadow-md transition" onclick="showBookingDetail('${b.id}')">
                <div class="text-xs font-bold text-gray-800">${b.start_time} - ${b.end_time}</div>
                <div class="text-xs text-crimson font-medium truncate">${b.requester_name}</div>
                <div class="text-[10px] text-gray-500 line-clamp-2 mt-1">${b.purpose}</div>
              </div>
            </td>`;
          }
        } else {
          // Check if this hour is covered by a booking that started earlier
          const covered = dayBookings.some(bk => {
            const startHour = parseInt(bk.start_time.split(':')[0]);
            const endHour = parseInt(bk.end_time.split(':')[0]);
            const currentHour = parseInt(h.split(':')[0]);
            return currentHour > startHour && currentHour < endHour && bk.room_id === r.id;
          });
          
          if (!covered) {
             row += `<td class="border-r border-b p-2 hover:bg-gray-50 transition"></td>`;
          }
        }
      });
      row += `</tr>`;
      bodyRows += row;
    });

    scheduleContent = `
      <div class="overflow-x-auto bg-white rounded shadow border border-gray-200">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b-2 border-gray-200">${headerRow}</tr>
          </thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>
      <p class="text-sm text-gray-500 mt-4 text-center">แสดงเฉพาะรายการที่ <b>อนุมัติแล้ว (Approved)</b> เท่านั้น</p>
    `;
  }

  return `
    ${pageHeader('📅 ตารางการจอง', 'ตรวจสอบช่วงเวลาที่มีการจองห้องปฏิบัติการ')}
    <div class="container section">
      
      <!-- Date Picker -->
      <div class="flex flex-col md:flex-row items-center justify-between mb-6 bg-white p-4 rounded shadow-sm">
        <button class="btn-outline px-3" onclick="changeScheduleDate(-1)">◀ ก่อนหน้า</button>
        <div class="flex items-center gap-4 my-4 md:my-0">
          <input type="date" id="scheduleDatePicker" class="form-input w-auto text-center" value="${currentScheduleDate}" onchange="updateScheduleDate(this.value)">
          <span class="font-bold text-lg text-crimson">${formatBookingDate(currentScheduleDate)}</span>
        </div>
        <button class="btn-outline px-3" onclick="changeScheduleDate(1)">ถัดไป ▶</button>
      </div>

      ${scheduleContent}
    </div>
  `;
}

function initSchedule() {}

function changeScheduleDate(days) {
  const d = new Date(currentScheduleDate);
  d.setDate(d.getDate() + days);
  currentScheduleDate = d.toISOString().split('T')[0];
  router();
}

function updateScheduleDate(val) {
  if (val) {
    currentScheduleDate = val;
    router();
  }
}

function showBookingDetail(id) {
  const b = getBookingById(id);
  const r = getRoomById(b.room_id);
  if(!b || !r) return;
  
  openModal(
    'รายละเอียดการจอง',
    `
    <div class="space-y-3 text-sm">
      <div class="flex items-center justify-between">
        <span class="font-bold text-lg">${r.room_name} (${r.room_code})</span>
        ${statusBadge(b.status)}
      </div>
      <div class="grid grid-cols-3 border-b pb-2">
        <span class="text-gray-500">วันที่:</span>
        <span class="col-span-2 font-medium">${formatBookingDate(b.booking_date)}</span>
      </div>
      <div class="grid grid-cols-3 border-b pb-2">
        <span class="text-gray-500">เวลา:</span>
        <span class="col-span-2 font-medium text-crimson">${b.start_time} - ${b.end_time}</span>
      </div>
      <div class="grid grid-cols-3 border-b pb-2">
        <span class="text-gray-500">ผู้จอง:</span>
        <span class="col-span-2">${typeIcon(b.requester_type)} ${b.requester_name} (${b.requester_email})</span>
      </div>
      <div class="grid grid-cols-3 border-b pb-2">
        <span class="text-gray-500">จำนวน:</span>
        <span class="col-span-2">${b.number_of_users} คน</span>
      </div>
      <div class="grid grid-cols-1 pt-2">
        <span class="text-gray-500 mb-1">วัตถุประสงค์:</span>
        <div class="bg-gray-50 p-2 rounded text-gray-700">${b.purpose}</div>
      </div>
    </div>
    `,
    `<button onclick="closeModal()" class="btn-primary w-full">ปิด</button>`
  );
}
