/* ============================================================
   app.js — Core App: Router, Navbar, Modal, Toast, Helpers
   CE Lab Booking System
   ============================================================ */

let currentRole = 'user';

/* ─── Init ─── */
async function init() {
  await initData();
  currentRole = localStorage.getItem('ceksu_role') || 'user';
  updateRoleButtons();
  updateAdminNavLinks();
  window.addEventListener('hashchange', () => router());
  await router();
}

/* ─── Router (Hash-based SPA) ─── */
async function router() {
  // โหลดข้อมูลล่าสุดจาก SQLite ก่อน render
  await loadAllData();

  const hash = window.location.hash.replace('#', '') || 'home';
  const parts = hash.split('/');
  const page = parts[0];
  const param = parts[1] || null;

  // Guard admin pages
  if (['admin-dashboard', 'admin-bookings', 'admin-rooms'].includes(page) && currentRole !== 'admin') {
    window.location.hash = 'home';
    showToast('⚠️ กรุณาเปลี่ยนเป็น Admin mode ก่อน', 'warning');
    return;
  }

  // Highlight active nav link
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('nav-link-active'));
  const activeEl = document.getElementById('nl-' + page);
  if (activeEl) activeEl.classList.add('nav-link-active');

  // Render page
  const container = document.getElementById('mainContent');
  container.innerHTML = '';

  switch (page) {
    case 'home':            container.innerHTML = renderHome();             initHome();            break;
    case 'rooms':           container.innerHTML = renderRooms();            initRooms();           break;
    case 'room':            container.innerHTML = renderRoomDetail(param);  initRoomDetail(param); break;
    case 'book':            container.innerHTML = renderBookingForm(param);  initBookingForm(param);break;
    case 'my-bookings':     container.innerHTML = renderMyBookings();        initMyBookings();      break;
    case 'schedule':        container.innerHTML = renderSchedule();          initSchedule();        break;
    case 'admin-dashboard': container.innerHTML = renderAdminDashboard();    initAdminDashboard();  break;
    case 'admin-bookings':  container.innerHTML = renderAdminBookings();     initAdminBookings();   break;
    case 'admin-rooms':     container.innerHTML = renderAdminRooms();        initAdminRooms();      break;
    default:                container.innerHTML = renderHome();              initHome();
  }

  // Scroll to top on navigate
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ─── Navigation Helper ─── */
function navigate(page, param) {
  window.location.hash = param ? `${page}/${param}` : page;
  closeMobileMenu();
}

/* ─── Role Switcher ─── */
function setRole(role) {
  currentRole = role;
  localStorage.setItem('ceksu_role', role);
  updateRoleButtons();
  updateAdminNavLinks();
  if (role === 'admin') {
    navigate('admin-dashboard');
    showToast('🛡️ เปลี่ยนเป็น Admin mode แล้ว', 'success');
  } else {
    navigate('home');
    showToast('👤 เปลี่ยนเป็น User mode แล้ว', 'info');
  }
}

function updateRoleButtons() {
  const userBtn = document.getElementById('roleUser');
  const adminBtn = document.getElementById('roleAdmin');
  if (!userBtn || !adminBtn) return;
  userBtn.className = 'role-btn ' + (currentRole === 'user' ? 'role-btn-active' : 'role-btn-inactive');
  adminBtn.className = 'role-btn ' + (currentRole === 'admin' ? 'role-btn-active' : 'role-btn-inactive');
}

function updateAdminNavLinks() {
  const adminLinks = document.getElementById('adminNavLinks');
  const mobileAdminLinks = document.getElementById('mobileAdminLinks');
  if (currentRole === 'admin') {
    adminLinks?.classList.remove('hidden');
    mobileAdminLinks?.classList.remove('hidden');
  } else {
    adminLinks?.classList.add('hidden');
    mobileAdminLinks?.classList.add('hidden');
  }
}

/* ─── Mobile Menu ─── */
function toggleMobileMenu() {
  document.getElementById('mobileMenu')?.classList.toggle('hidden');
}
function closeMobileMenu() {
  document.getElementById('mobileMenu')?.classList.add('hidden');
}

/* ─── Modal ─── */
function openModal(title, bodyHtml, footerHtml = '') {
  document.getElementById('modalTitle').innerHTML = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  document.getElementById('modalFooter').innerHTML = footerHtml;
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('modalOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.getElementById('modalOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

/* ─── Toast Notification ─── */
function showToast(message, type = 'info') {
  const config = {
    success: { cls: 'toast-success', icon: '✅' },
    error:   { cls: 'toast-error',   icon: '❌' },
    warning: { cls: 'toast-warning', icon: '⚠️' },
    info:    { cls: 'toast-info',    icon: 'ℹ️' },
  };
  const c = config[type] || config.info;
  const toast = document.createElement('div');
  toast.className = `toast ${c.cls}`;
  toast.innerHTML = `<span class="toast-icon">${c.icon}</span><span class="toast-msg">${message}</span>`;
  const container = document.getElementById('toastContainer');
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('toast-visible'), 10);
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

/* ══════════════════════════════════════════════
   SHARED HELPERS / RENDERERS
══════════════════════════════════════════════ */

/** Status badge HTML */
function statusBadge(status) {
  const map = {
    Pending:   { cls: 'badge-pending',   icon: '⏳', label: 'Pending' },
    Approved:  { cls: 'badge-approved',  icon: '✅', label: 'Approved' },
    Rejected:  { cls: 'badge-rejected',  icon: '❌', label: 'Rejected' },
    Cancelled: { cls: 'badge-cancelled', icon: '🚫', label: 'Cancelled' },
  };
  const c = map[status] || { cls: '', icon: '', label: status };
  return `<span class="badge ${c.cls}">${c.icon} ${c.label}</span>`;
}

/** Room status badge HTML */
function roomStatusBadge(status) {
  const map = {
    Available:   'badge-approved',
    Maintenance: 'badge-pending',
    Closed:      'badge-rejected',
  };
  return `<span class="badge ${map[status] || ''}">${status}</span>`;
}

/** Requester type icon */
function typeIcon(type) {
  return { Student: '🎓', Teacher: '👨‍🏫', Staff: '💼' }[type] || '👤';
}

/** Format date to Thai locale */
function formatDate(str) {
  if (!str) return '—';
  try {
    return new Date(str).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return str; }
}

/** Format booking_date (YYYY-MM-DD) to Thai */
function formatBookingDate(str) {
  if (!str) return '—';
  try {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('th-TH', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return str; }
}

/** Format datetime to Thai */
function formatDateTime(str) {
  if (!str) return '—';
  try {
    return new Date(str).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return str; }
}

/** Equipment chips HTML */
function equipmentChips(equipStr) {
  return equipStr.split(',').map(e =>
    `<span class="equip-chip">${e.trim()}</span>`
  ).join('');
}

/** Page header section HTML */
function pageHeader(title, subtitle = '', extra = '') {
  return `
    <div class="page-header">
      <div class="page-header-inner">
        <div>
          <h1 class="page-title">${title}</h1>
          ${subtitle ? `<p class="page-subtitle">${subtitle}</p>` : ''}
        </div>
        ${extra}
      </div>
    </div>`;
}

/** Empty state HTML */
function emptyState(icon, title, subtitle, btnLabel = '', btnAction = '') {
  return `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <h3 class="empty-title">${title}</h3>
      <p class="empty-subtitle">${subtitle}</p>
      ${btnLabel ? `<button onclick="${btnAction}" class="btn-primary mt-4">${btnLabel}</button>` : ''}
    </div>`;
}

document.addEventListener('DOMContentLoaded', init);
