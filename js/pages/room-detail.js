/* ============================================================
   room-detail.js — Room Detail Page (FR-02)
   ============================================================ */

function renderRoomDetail(id) {
  const room = getRoomById(id);
  if (!room) {
    return `<div class="container section">${emptyState('❓', 'ไม่พบห้องนี้', 'ห้องที่คุณค้นหาอาจถูกลบออกแล้ว', 'กลับไปดูห้องทั้งหมด', "navigate('rooms')")}</div>`;
  }

  const bookings = getBookingsByRoom(id)
    .filter(b => b.status === 'Approved')
    .sort((a, b) => b.booking_date.localeCompare(a.booking_date))
    .slice(0, 5);

  const isBookable = room.status === 'Available';

  const recentRows = bookings.length > 0
    ? bookings.map(b => `
        <tr class="table-row">
          <td class="table-cell">${formatBookingDate(b.booking_date)}</td>
          <td class="table-cell font-mono">${b.start_time} – ${b.end_time}</td>
          <td class="table-cell">${typeIcon(b.requester_type)} ${b.requester_name}</td>
          <td class="table-cell">${statusBadge(b.status)}</td>
        </tr>`).join('')
    : `<tr><td colspan="4" class="table-cell text-center text-gray-400 py-8">ยังไม่มีการจองที่อนุมัติแล้ว</td></tr>`;

  return `
    <!-- Breadcrumb -->
    <div class="container pt-8">
      <nav class="breadcrumb">
        <a href="#rooms" onclick="navigate('rooms')" class="breadcrumb-link">🏢 ห้องปฏิบัติการ</a>
        <span class="breadcrumb-sep">›</span>
        <span class="text-gray-700">${room.room_code}</span>
      </nav>
    </div>

    <div class="container section">
      <div class="detail-grid">
        <!-- Left: Room Info -->
        <div class="space-y-6">
          <!-- Main Info Card -->
          <div class="card">
            <div class="flex items-start justify-between mb-4">
              <div class="room-icon-box-lg">${roomIcon(room.room_code)}</div>
              ${roomStatusBadge(room.status)}
            </div>
            <h1 class="text-2xl font-bold text-gray-900 mb-1">${room.room_name}</h1>
            <p class="text-crimson font-bold text-lg mb-4">${room.room_code}</p>

            <div class="info-rows">
              <div class="info-row">
                <span class="info-label">📍 สถานที่</span>
                <span class="info-value">${room.location}</span>
              </div>
              <div class="info-row">
                <span class="info-label">👥 ความจุ</span>
                <span class="info-value font-semibold">${room.capacity} คน</span>
              </div>
              <div class="info-row">
                <span class="info-label">📅 เพิ่มเมื่อ</span>
                <span class="info-value">${formatDateTime(room.created_at)}</span>
              </div>
            </div>
          </div>

          <!-- Description Card -->
          <div class="card">
            <h2 class="card-section-title">📄 รายละเอียด</h2>
            <p class="text-gray-600 leading-relaxed">${room.description}</p>
          </div>

          <!-- Equipment Card -->
          <div class="card">
            <h2 class="card-section-title">🛠️ อุปกรณ์ประจำห้อง</h2>
            <div class="flex flex-wrap gap-2 mt-3">
              ${room.equipment.split(',').map(e => `
                <div class="equip-card">
                  <span>⚙️</span>
                  <span>${e.trim()}</span>
                </div>`).join('')}
            </div>
          </div>
        </div>

        <!-- Right: Actions + Recent Bookings -->
        <div class="space-y-6">
          <!-- Booking Action Card -->
          <div class="card bg-gradient-to-br from-crimson to-crimson-dark text-white">
            <div class="text-4xl mb-3">${isBookable ? '📅' : '🚫'}</div>
            <h2 class="text-xl font-bold mb-2">
              ${isBookable ? 'จองห้องนี้' : `ห้องปิดให้บริการ (${room.status})`}
            </h2>
            <p class="text-white/80 text-sm mb-4">
              ${isBookable
                ? 'ส่งคำขอจองห้องนี้ ระบบจะตรวจสอบเวลาว่างและแจ้งผลให้ทราบ'
                : 'ขณะนี้ไม่สามารถจองห้องนี้ได้ กรุณาเลือกห้องอื่น'}
            </p>
            ${isBookable
              ? `<button onclick="navigate('book','${room.id}')" class="btn-white w-full font-bold">
                  📝 ส่งคำขอจองห้อง
                </button>`
              : `<button class="btn-white-disabled w-full font-bold" disabled>ไม่สามารถจองได้</button>`
            }
          </div>

          <!-- Room Stats -->
          <div class="card">
            <h2 class="card-section-title">📊 สถิติการจอง</h2>
            ${(() => {
              const all = getBookingsByRoom(id);
              return `
              <div class="grid grid-cols-2 gap-3 mt-3">
                ${[
                  { label: 'ทั้งหมด', val: all.length, cls: 'text-gray-700' },
                  { label: 'รออนุมัติ', val: all.filter(b=>b.status==='Pending').length, cls: 'text-amber-600' },
                  { label: 'อนุมัติแล้ว', val: all.filter(b=>b.status==='Approved').length, cls: 'text-green-600' },
                  { label: 'ปฏิเสธ', val: all.filter(b=>b.status==='Rejected').length, cls: 'text-red-600' },
                ].map(s => `
                  <div class="mini-stat-card">
                    <div class="mini-stat-num ${s.cls}">${s.val}</div>
                    <div class="mini-stat-label">${s.label}</div>
                  </div>`).join('')}
              </div>`;
            })()}
          </div>

          <!-- Recent Approved Bookings -->
          <div class="card">
            <h2 class="card-section-title">🗓️ การจองล่าสุด (Approved)</h2>
            <div class="table-wrapper mt-3">
              <table class="table">
                <thead>
                  <tr>
                    <th class="table-th">วันที่</th>
                    <th class="table-th">เวลา</th>
                    <th class="table-th">ผู้จอง</th>
                    <th class="table-th">สถานะ</th>
                  </tr>
                </thead>
                <tbody>${recentRows}</tbody>
              </table>
            </div>
          </div>

          <button onclick="navigate('rooms')" class="btn-outline w-full">← กลับไปดูห้องทั้งหมด</button>
        </div>
      </div>
    </div>`;
}

function initRoomDetail(id) { /* static page */ }
