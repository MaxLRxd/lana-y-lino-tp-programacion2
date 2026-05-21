// ============================================================
//  CART — cart.html
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  if (!Api.isLoggedIn()) { window.location.href = 'login.html'; return; }
  await loadCart();
});

async function loadCart() {
  const user      = Api.getUser();
  const container = document.querySelector('.cart-items');
  if (!container) return;

  container.innerHTML = `<p style="text-align:center;padding:32px;color:var(--color-text-muted)">Cargando...</p>`;

  try {
    const items = await Api.get(`/api/obtenerProductosCarrito/${user.id}`);
    renderCart(items || []);
  } catch {
    container.innerHTML = `<div class="alert alert-error">Error al cargar el carrito.</div>`;
  }
}

function renderCart(items) {
  const container  = document.querySelector('.cart-items');
  const subtitle   = document.querySelector('.page-header p');

  if (subtitle) subtitle.textContent = `${items.length} ${items.length === 1 ? 'producto' : 'productos'}`;

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">🛒</span>
        <p>Tu carrito está vacío</p>
        <a href="index.html" class="btn btn-primary">Ver productos</a>
      </div>`;
    updateSummary(0);
    hideProceedButton();
    return;
  }

  container.innerHTML = items.map(buildCartItem).join('');

  container.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', () =>
      removeItem(parseInt(btn.dataset.inventario))
    );
  });

  const total = items.reduce((s, i) => s + Number(i.precio || 0), 0);
  updateSummary(total);
}

function buildCartItem(item) {
  const precio = Number(item.precio || 0).toLocaleString('es-AR');
  const imagen = item.imagen || 'assets/images/placeholder.jpg';
  return `
    <div class="cart-item" data-inventario="${item.id_inventario}">
      <div class="cart-item-image">
        <img src="${imagen}" alt="${item.nombre}">
      </div>
      <div>
        <p class="cart-item-name">${item.nombre}</p>
        <p class="cart-item-meta">
          Talle: ${item.talle || '-'} &nbsp;·&nbsp; Color: ${item.color || '-'}
        </p>
        <p class="cart-item-price">$${precio}</p>
      </div>
      <div class="cart-item-actions">
        <button class="btn btn-danger btn-sm btn-remove" type="button"
                data-inventario="${item.id_inventario}">
          Eliminar
        </button>
      </div>
    </div>`;
}

async function removeItem(idInventario) {
  const user = Api.getUser();
  try {
    await Api.delete('/api/eliminarProductoCarrito', {
      id_usuario:    user.id,
      id_inventario: idInventario,
    });
    showToast('Producto eliminado del carrito', 'success');
    await loadCart();
    updateCartBadge();
  } catch (err) {
    showToast(err.message || 'Error al eliminar', 'error');
  }
}

function updateSummary(total) {
  const subtotalEl = document.querySelector('.summary-row span:last-child');
  const totalEl    = document.querySelector('.summary-total span:last-child');
  const formatted  = `$${total.toLocaleString('es-AR')}`;

  if (subtotalEl) subtotalEl.textContent = formatted;
  if (totalEl)    totalEl.textContent    = formatted;

  // Actualizar texto del botón pagar
  const proceedBtn = document.querySelector('a[href="payment.html"]');
  if (proceedBtn) proceedBtn.textContent = `Continuar con el pago — ${formatted}`;
}

function hideProceedButton() {
  const proceedBtn = document.querySelector('a[href="payment.html"]');
  if (proceedBtn) proceedBtn.style.display = 'none';
}