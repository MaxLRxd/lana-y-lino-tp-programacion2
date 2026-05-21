// ============================================================
//  HEADER — lógica compartida en todas las páginas
// ============================================================

// ── Dark mode ───────────────────────────────────────────────
(function initDarkMode() {
  const toggle = document.getElementById('dark-mode');
  if (!toggle) return;

  // Restaurar preferencia guardada
  if (localStorage.getItem('darkMode') === 'true') toggle.checked = true;

  toggle.addEventListener('change', () => {
    localStorage.setItem('darkMode', toggle.checked);
  });
})();

// ── Toast notification ──────────────────────────────────────
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed; bottom: 24px; right: 24px;
      display: flex; flex-direction: column; gap: 8px;
      z-index: 9999; pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${type === 'success' ? '#2d6a4f' : '#c0392b'};
    color: #fff; padding: 12px 20px; border-radius: 8px;
    font-size: .875rem; font-weight: 600; box-shadow: 0 4px 16px rgba(0,0,0,.2);
    animation: slideIn .2s ease; pointer-events: auto;
  `;
  toast.textContent = message;

  if (!document.getElementById('toast-style')) {
    const style = document.createElement('style');
    style.id = 'toast-style';
    style.textContent = `@keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`;
    document.head.appendChild(style);
  }

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ── Actualizar badge del carrito ────────────────────────────
async function updateCartBadge() {
  try {
    const user = Api.getUser();
    if (!user) return;
    const items = await Api.get(`/api/obtenerProductosCarrito/${user.id}`);
    const badge = document.querySelector('.icon-btn .badge');
    if (!badge) return;
    const count = Array.isArray(items) ? items.length : 0;
    badge.textContent = count;
    badge.style.display = count > 0 ? '' : 'none';
  } catch { /* silencioso */ }
}

// ── UI de sesión (login / logout / admin) ───────────────────
function updateHeaderSession() {
  const isLoggedIn = Api.isLoggedIn();
  const isAdmin    = Api.isAdmin();

  // Botón sesión
  const btnSession = document.querySelector('.btn-session');
  if (btnSession) {
    if (isLoggedIn) {
      btnSession.textContent = 'Cerrar sesión';
      btnSession.onclick = () => {
        Api.removeToken();
        Api.removeUser();
        window.location.href = 'index.html';
      };
    } else {
      btnSession.textContent = 'Iniciar sesión';
      btnSession.onclick = () => { window.location.href = 'login.html'; };
    }
  }

  // Botón admin (solo visible para administradores)
  const btnAdmin = document.querySelector('.btn-admin');
  if (btnAdmin) btnAdmin.style.display = isAdmin ? '' : 'none';

  // Badge del carrito
  if (isLoggedIn) updateCartBadge();
}

// ── Cargar categorías en el menú desplegable ────────────────
async function loadDropdownCategories() {
  try {
    const cats = await Api.get('/api/obtenerCategorias', false);
    if (!cats || !Array.isArray(cats)) return;

    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      // Conservar "Todos los productos" y el divisor
      const allLink = menu.querySelector('a:first-child')?.cloneNode(true);
      const divider  = menu.querySelector('.dropdown-divider')?.cloneNode(true);
      menu.innerHTML = '';
      if (allLink) menu.appendChild(allLink);
      if (divider)  menu.appendChild(divider);

      cats.forEach(cat => {
        const a = document.createElement('a');
        a.href        = `index.html?categoria=${cat.id}`;
        a.textContent = cat.nombre;
        menu.appendChild(a);
      });
    });
  } catch { /* silencioso */ }
}

// ── Init ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderSession();
  loadDropdownCategories();
});