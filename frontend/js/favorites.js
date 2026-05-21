// ============================================================
//  FAVORITES — favorites.html
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  if (!Api.isLoggedIn()) { window.location.href = 'login.html'; return; }
  await loadFavorites();
});

async function loadFavorites() {
  const user = Api.getUser();
  const grid = document.querySelector('.favorites-grid');
  if (!grid) return;

  grid.innerHTML = `<p style="text-align:center;padding:32px;color:var(--color-text-muted)">Cargando...</p>`;

  try {
    // 1. Obtener IDs de favoritos
    const favs = await Api.get(`/api/obtenerFavoritos/${user.id}`);

    if (!favs || !favs.length) {
      renderEmpty(grid);
      return;
    }

    // 2. Traer datos de cada producto en paralelo
    const products = (await Promise.allSettled(
      favs.map(f => Api.get(`/api/obtenerDatosProducto?id=${f.id_producto}`, false))
    )).filter(r => r.status === 'fulfilled').map(r => r.value);

    renderFavorites(products);
  } catch {
    grid.innerHTML = `<div class="alert alert-error">Error al cargar favoritos.</div>`;
  }
}

function renderEmpty(grid) {
  const subtitle = document.querySelector('.page-header p');
  if (subtitle) subtitle.textContent = '0 productos guardados';

  grid.innerHTML = `
    <div class="empty-state" style="grid-column:1/-1;">
      <span class="empty-state-icon">♡</span>
      <p>Todavía no tenés productos favoritos</p>
      <a href="index.html" class="btn btn-primary">Ver productos</a>
    </div>`;
}

function renderFavorites(products) {
  const grid     = document.querySelector('.favorites-grid');
  const subtitle = document.querySelector('.page-header p');

  if (subtitle) subtitle.textContent =
    `${products.length} ${products.length === 1 ? 'producto guardado' : 'productos guardados'}`;

  grid.innerHTML = products.map(p => {
    const imagen = p.imagen || 'assets/images/placeholder.jpg';
    const precio = `$${Number(p.precio || 0).toLocaleString('es-AR')}`;
    return `
      <article class="fav-card" data-id="${p.id}">
        <a href="product.html?id=${p.id}" class="fav-card-image">
          <img src="${imagen}" alt="${p.nombre}" loading="lazy">
        </a>
        <div class="fav-card-body">
          <h3 class="fav-card-name">${p.nombre}</h3>
          <p class="fav-card-price">${precio}</p>
        </div>
        <div class="fav-card-footer">
          <a href="product.html?id=${p.id}" class="btn btn-outline btn-sm btn-full">Ver producto</a>
          <button class="btn btn-danger btn-sm btn-remove-fav" type="button"
                  data-id="${p.id}" title="Eliminar de favoritos">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"></path>
            </svg>
          </button>
        </div>
      </article>`;
  }).join('');

  grid.querySelectorAll('.btn-remove-fav').forEach(btn => {
    btn.addEventListener('click', () => removeFavorite(parseInt(btn.dataset.id)));
  });
}

async function removeFavorite(productId) {
  const user = Api.getUser();
  try {
    await Api.delete('/api/eliminarFavorito', {
      id_usuario:  user.id,
      id_producto: productId,
    });
    document.querySelector(`.fav-card[data-id="${productId}"]`)?.remove();
    showToast('Eliminado de favoritos', 'success');

    const remaining = document.querySelectorAll('.fav-card').length;
    const subtitle  = document.querySelector('.page-header p');
    if (subtitle) subtitle.textContent =
      `${remaining} ${remaining === 1 ? 'producto guardado' : 'productos guardados'}`;

    if (remaining === 0) renderEmpty(document.querySelector('.favorites-grid'));
  } catch (err) {
    showToast(err.message || 'Error al eliminar favorito', 'error');
  }
}