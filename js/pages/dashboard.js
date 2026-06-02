/* ============================================================
   dashboard.js — Admin Dashboard Page (FR-16)
   ============================================================ */

function renderAdminDashboard() {
  const stats = getDashboardStats();
  
  return `
    ${pageHeader('📊 Dashboard', 'สรุปข้อมูลการใช้ห้องปฏิบัติการ')}
    <div class="container section">
      
      <!-- Stats Grid -->
      <div class="stats-grid mb-8">
        <div class="stat-card stat-card-blue shadow-sm">
          <div class="stat-icon text-3xl mb-2">📋</div>
          <div class="stat-number text-3xl">${stats.total}</div>
          <div class="stat-label">การจองทั้งหมด</div>
        </div>
        <div class="stat-card stat-card-green shadow-sm">
          <div class="stat-icon text-3xl mb-2">✅</div>
          <div class="stat-number text-3xl">${stats.approved}</div>
          <div class="stat-label">อนุมัติแล้ว</div>
        </div>
        <div class="stat-card stat-card-amber shadow-sm">
          <div class="stat-icon text-3xl mb-2">⏳</div>
          <div class="stat-number text-3xl">${stats.pending}</div>
          <div class="stat-label">รอการอนุมัติ</div>
        </div>
        <div class="stat-card stat-card-crimson shadow-sm">
          <div class="stat-icon text-3xl mb-2">❌</div>
          <div class="stat-number text-3xl">${stats.rejected}</div>
          <div class="stat-label">ปฏิเสธ</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Chart: Booking Status -->
        <div class="card shadow-sm">
          <h2 class="card-section-title text-center mb-4">สัดส่วนสถานะการจอง</h2>
          <div class="relative h-64 w-full flex items-center justify-center">
            <canvas id="statusChart"></canvas>
          </div>
        </div>

        <!-- Chart: Bookings per Room -->
        <div class="card shadow-sm">
          <h2 class="card-section-title text-center mb-4">จำนวนการจองแยกตามห้อง</h2>
          <div class="relative h-64 w-full flex items-center justify-center">
            <canvas id="roomChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Action Area -->
      <div class="mt-8 flex gap-4 justify-center">
        <button onclick="navigate('admin-bookings')" class="btn-primary">📝 จัดการรายการจอง</button>
        <button onclick="navigate('admin-rooms')" class="btn-outline">🏢 จัดการห้องปฏิบัติการ</button>
        <button onclick="resetData(); location.reload();" class="btn-outline text-red-600 border-red-200 hover:bg-red-50">⚠️ Reset Data (คืนค่าเริ่มต้น)</button>
      </div>

    </div>
  `;
}

function initAdminDashboard() {
  const stats = getDashboardStats();
  
  // Need to load Chart.js dynamically if not present
  if (typeof Chart === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => drawCharts(stats);
    document.head.appendChild(script);
  } else {
    drawCharts(stats);
  }
}

function drawCharts(stats) {
  // Common Options
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { family: "'Noto Sans Thai', sans-serif" } } }
    }
  };

  // Status Chart (Pie)
  const ctxStatus = document.getElementById('statusChart');
  if (ctxStatus && (stats.pending > 0 || stats.approved > 0 || stats.rejected > 0 || stats.cancelled > 0)) {
    new Chart(ctxStatus, {
      type: 'doughnut',
      data: {
        labels: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
        datasets: [{
          data: [stats.pending, stats.approved, stats.rejected, stats.cancelled],
          backgroundColor: ['#f59e0b', '#10b981', '#dc143c', '#9ca3af'],
          borderWidth: 0
        }]
      },
      options: commonOptions
    });
  } else if(ctxStatus) {
     ctxStatus.parentElement.innerHTML = '<div class="text-gray-400">ไม่มีข้อมูลเพียงพอสำหรับสร้างกราฟ</div>';
  }

  // Room Chart (Bar)
  const ctxRoom = document.getElementById('roomChart');
  if (ctxRoom && stats.byRoom.length > 0) {
    new Chart(ctxRoom, {
      type: 'bar',
      data: {
        labels: stats.byRoom.map(r => r.room_code),
        datasets: [
          {
            label: 'การจองทั้งหมด',
            data: stats.byRoom.map(r => r.total),
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1
          },
          {
            label: 'อนุมัติแล้ว',
            data: stats.byRoom.map(r => r.approved),
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1
          }
        ]
      },
      options: {
        ...commonOptions,
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  } else if(ctxRoom) {
      ctxRoom.parentElement.innerHTML = '<div class="text-gray-400">ไม่มีข้อมูลเพียงพอสำหรับสร้างกราฟ</div>';
  }
}
