/* ============================================================
   home.js — Home Page
   ============================================================ */

function renderHome() {
  const stats = getDashboardStats();
  const rooms = getRooms().filter(r => r.status === 'Available').slice(0, 3);
  const pendingBadge = stats.pending > 0 && currentRole === 'admin'
    ? `<span class="ml-2 inline-flex items-center justify-center w-6 h-6 bg-white text-crimson text-xs font-bold rounded-full">${stats.pending}</span>` : '';

  const featuredRooms = rooms.map(r => `
    <div class="card card-hover group cursor-pointer animate-slide-up" onclick="navigate('room','${r.id}')">
      <div class="flex items-start justify-between mb-3">
        <div class="room-icon-box">${roomIcon(r.room_code)}</div>
        ${roomStatusBadge(r.status)}
      </div>
      <h3 class="font-bold text-gray-800 text-lg mb-1 group-hover:text-crimson transition-colors">${r.room_name}</h3>
      <p class="text-sm text-gray-500 mb-3">${r.room_code} · ${r.location}</p>
      <div class="flex items-center gap-4 text-sm text-gray-600 mb-3">
        <span>👥 ${r.capacity} คน</span>
      </div>
      <div class="flex flex-wrap gap-1 mb-4">${equipmentChips(r.equipment)}</div>
      <button onclick="event.stopPropagation(); navigate('book','${r.id}')" class="btn-primary w-full text-sm">
        📅 จองห้องนี้
      </button>
    </div>`).join('');

  return `
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <div class="hero-badge">🔬 CE Lab Booking System</div>
        <h1 class="hero-title">ระบบจองห้องปฏิบัติการ<br><span class="hero-title-accent">วิศวกรรมคอมพิวเตอร์</span></h1>
        <p class="hero-sub">สาขาวิชาวิศวกรรมคอมพิวเตอร์ มหาวิทยาลัยกาฬสินธุ์<br>ตรวจสอบห้องว่าง จองห้อง และติดตามสถานะได้ทุกที่ทุกเวลา</p>
        <div class="hero-actions">
          <button onclick="navigate('rooms')" class="btn-hero-primary">
            🏢 ดูห้องปฏิบัติการ
          </button>
          <button onclick="navigate('schedule')" class="btn-hero-secondary">
            📅 ตารางการจอง
          </button>
          ${currentRole === 'admin' ? `<button onclick="navigate('admin-dashboard')" class="btn-hero-secondary">📊 Dashboard${pendingBadge}</button>` : ''}
        </div>
      </div>
    </section>

    <!-- Quick Stats -->
    <section class="section">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-card stat-card-blue" onclick="navigate('rooms')">
            <div class="stat-icon">🏢</div>
            <div class="stat-number">${stats.rooms}</div>
            <div class="stat-label">ห้องปฏิบัติการ</div>
            <div class="stat-sub">${stats.availableRooms} พร้อมใช้งาน</div>
          </div>
          <div class="stat-card stat-card-amber" onclick="currentRole==='admin'?navigate('admin-bookings'):navigate('my-bookings')">
            <div class="stat-icon">📋</div>
            <div class="stat-number">${stats.total}</div>
            <div class="stat-label">การจองทั้งหมด</div>
            <div class="stat-sub">วันนี้ ${stats.today} รายการ</div>
          </div>
          <div class="stat-card stat-card-green" onclick="navigate('schedule')">
            <div class="stat-icon">✅</div>
            <div class="stat-number">${stats.approved}</div>
            <div class="stat-label">อนุมัติแล้ว</div>
            <div class="stat-sub">ดูตารางการจอง</div>
          </div>
          <div class="stat-card stat-card-crimson" onclick="currentRole==='admin'?navigate('admin-bookings'):navigate('my-bookings')">
            <div class="stat-icon">⏳</div>
            <div class="stat-number">${stats.pending}</div>
            <div class="stat-label">รอการอนุมัติ</div>
            <div class="stat-sub">${currentRole === 'admin' ? 'คลิกเพื่อจัดการ' : 'ดูสถานะการจอง'}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Workflow Section -->
    <section class="section bg-white">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">วิธีการจองห้องปฏิบัติการ</h2>
          <p class="section-sub">ขั้นตอนง่ายๆ เพียง 3 ขั้นตอน</p>
        </div>
        <div class="steps-grid">
          <div class="step-card">
            <div class="step-number">1</div>
            <div class="step-icon">🔍</div>
            <h3 class="step-title">เลือกห้อง</h3>
            <p class="step-desc">ตรวจสอบรายการห้องปฏิบัติการที่ว่าง ดูรายละเอียดอุปกรณ์และความจุ</p>
          </div>
          <div class="step-connector">→</div>
          <div class="step-card">
            <div class="step-number">2</div>
            <div class="step-icon">📝</div>
            <h3 class="step-title">กรอกข้อมูล</h3>
            <p class="step-desc">ระบุวันที่ เวลาเริ่ม-สิ้นสุด วัตถุประสงค์ และจำนวนผู้ใช้งาน</p>
          </div>
          <div class="step-connector">→</div>
          <div class="step-card">
            <div class="step-number">3</div>
            <div class="step-icon">✅</div>
            <h3 class="step-title">รอการอนุมัติ</h3>
            <p class="step-desc">Admin จะตรวจสอบและอนุมัติคำขอ ติดตามสถานะได้ที่หน้า "การจองของฉัน"</p>
          </div>
        </div>
        <div class="text-center mt-8">
          <button onclick="navigate('rooms')" class="btn-primary text-base px-8 py-3">
            🚀 เริ่มจองห้องเลย
          </button>
        </div>
      </div>
    </section>

    <!-- Featured Rooms -->
    <section class="section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">ห้องปฏิบัติการที่เปิดให้จอง</h2>
          <button onclick="navigate('rooms')" class="btn-outline">ดูทั้งหมด →</button>
        </div>
        ${rooms.length > 0
          ? `<div class="rooms-grid">${featuredRooms}</div>`
          : emptyState('🏢', 'ไม่มีห้องที่พร้อมใช้งาน', 'กรุณาติดต่อ Admin')
        }
      </div>
    </section>

    <!-- Booking Rules -->
    <section class="section bg-white">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">กฎการจองห้อง</h2>
          <p class="section-sub">โปรดอ่านและปฏิบัติตามกฎก่อนทำการจอง</p>
        </div>
        <div class="rules-grid">
          ${[
            { icon: '📋', title: 'ข้อมูลครบถ้วน', desc: 'ต้องระบุห้อง วันที่ เวลาเริ่มต้น และเวลาสิ้นสุด' },
            { icon: '⏰', title: 'เวลาถูกต้อง', desc: 'เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุดเสมอ' },
            { icon: '🚫', title: 'ห้ามจองซ้อน', desc: 'ไม่สามารถจองซ้อนกับรายการที่อนุมัติแล้วได้' },
            { icon: '🔧', title: 'สถานะห้อง', desc: 'ไม่สามารถจองห้องที่อยู่ในสถานะซ่อมบำรุง หรือปิดให้บริการ' },
            { icon: '❌', title: 'ยกเลิกได้', desc: 'ผู้ใช้สามารถยกเลิกคำขอที่ยังอยู่ในสถานะ Pending ได้' },
            { icon: '🛡️', title: 'Admin อนุมัติ', desc: 'Admin สามารถอนุมัติ ปฏิเสธ หรือยกเลิกคำขอจองได้' },
          ].map(r => `
            <div class="rule-card">
              <span class="rule-icon">${r.icon}</span>
              <div>
                <div class="rule-title">${r.title}</div>
                <div class="rule-desc">${r.desc}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </section>
  `;
}

function roomIcon(code) {
  const icons = {
    'CE-LAB-01': '💻',
    'CE-LAB-02': '🖥️',
    'NET-LAB': '🌐',
    'IOT-LAB': '📡',
    'PROJECT-ROOM': '📋',
  };
  return icons[code] || '🔬';
}

function initHome() { /* No special init needed */ }
