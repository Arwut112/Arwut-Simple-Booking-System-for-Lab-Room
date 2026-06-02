/* ============================================================
   rooms.js — Lab Room List Page (FR-01, FR-02)
   ============================================================ */

function renderRooms() {
  const rooms = getRooms();
  const available = rooms.filter(r => r.status === 'Available').length;
  const maintenance = rooms.filter(r => r.status === 'Maintenance').length;
  const closed = rooms.filter(r => r.status === 'Closed').length;

  const roomCards = rooms.map(r => {
    const bookings = getBookingsByRoom(r.id);
    const activeCount = bookings.filter(b => b.status === 'Approved' || b.status === 'Pending').length;
    const isBookable = r.status === 'Available';
    return `
      <div class="card card-hover group animate-slide-up" data-room-id="${r.id}" data-status="${r.status}">
        <div class="flex items-start justify-between mb-4">
          <div class="room-icon-box text-2xl">${roomIcon(r.room_code)}</div>
          ${roomStatusBadge(r.status)}
        </div>
        <h3 class="font-bold text-gray-800 text-xl mb-1 group-hover:text-crimson transition-colors">${r.room_name}</h3>
        <p class="text-crimson font-semibold text-sm mb-1">${r.room_code}</p>
        <p class="text-gray-500 text-sm mb-4">📍 ${r.location}</p>

        <div class="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <span class="flex items-center gap-1">👥 <b>${r.capacity}</b> คน</span>
          <span class="flex items-center gap-1" title="รวมรายการจองที่รออนุมัติและอนุมัติแล้ว">📋 <b>${activeCount}</b> คิวจอง</span>
        </div>

        <div class="flex flex-wrap gap-1 mb-4">${equipmentChips(r.equipment)}</div>

        <p class="text-gray-500 text-sm mb-5 line-clamp-2">${r.description}</p>

        <div class="flex gap-2">
          <button onclick="navigate('room','${r.id}')" class="btn-outline flex-1 text-sm">
            🔍 รายละเอียด
          </button>
          ${isBookable
            ? `<button onclick="navigate('book','${r.id}')" class="btn-primary flex-1 text-sm">📅 จอง</button>`
            : `<button class="btn-disabled flex-1 text-sm" disabled>🚫 ไม่สามารถจองได้</button>`
          }
        </div>
      </div>`;
  }).join('');

  return `
    ${pageHeader(
      '🏢 ห้องปฏิบัติการทั้งหมด',
      `แสดงห้องปฏิบัติการของสาขาวิชาวิศวกรรมคอมพิวเตอร์ทั้งหมด ${rooms.length} ห้อง`
    )}
    <div class="container section">
      <!-- Filter Bar -->
      <div class="filter-bar mb-6">
        <button class="filter-chip filter-chip-active" data-filter="all" onclick="filterRooms('all', this)">
          ทั้งหมด (${rooms.length})
        </button>
        <button class="filter-chip" data-filter="Available" onclick="filterRooms('Available', this)">
          ✅ พร้อมใช้ (${available})
        </button>
        <button class="filter-chip" data-filter="Maintenance" onclick="filterRooms('Maintenance', this)">
          🔧 ซ่อมบำรุง (${maintenance})
        </button>
        <button class="filter-chip" data-filter="Closed" onclick="filterRooms('Closed', this)">
          🚫 ปิดให้บริการ (${closed})
        </button>
      </div>

      <!-- Room Cards Grid -->
      ${rooms.length > 0
        ? `<div class="rooms-grid" id="roomsGrid">${roomCards}</div>`
        : emptyState('🏢', 'ยังไม่มีห้องปฏิบัติการ', 'Admin สามารถเพิ่มห้องได้ที่เมนูจัดการห้อง',
            currentRole === 'admin' ? 'เพิ่มห้องใหม่' : '', "navigate('admin-rooms')")
      }
    </div>`;
}

function filterRooms(status, btn) {
  // Update button state
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('filter-chip-active'));
  btn.classList.add('filter-chip-active');

  // Filter cards
  const cards = document.querySelectorAll('#roomsGrid [data-room-id]');
  cards.forEach(card => {
    if (status === 'all' || card.dataset.status === status) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

function initRooms() { /* Filter chips already inline */ }
