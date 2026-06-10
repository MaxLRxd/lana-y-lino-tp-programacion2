// ============================================================
//  PRODUCTS — index.html (catálogo dinámico)
// ============================================================

let allProducts = [];
let favoriteIds = new Set();

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadCategoriasFilter(), loadFavoriteIds()]);
  await loadProducts();
  setupSearch();
  setupFilters();
  setupSort();
  setupClearFilters();
});

// ── Favoritos del usuario (para marcar el corazón relleno) ───
async function loadFavoriteIds() {
  if (!Api.isLoggedIn()) return;

  try {
    const user = Api.getUser();
    const res  = await Api.get(`/api/obtenerFavoritos/${user.id}`);
    const favs = res.payload || [];
    favoriteIds = new Set(favs.map(f => Number(f.idProducto || f.id_producto)));
  } catch { /* silencioso */ }
}

// ── Categorías del sidebar desde la BD ──────────────────────
async function loadCategoriasFilter() {
  const container = document.querySelector('.filter-options[data-filter="categoria"]');
  if (!container) return;

  try {
    const res  = await Api.get('/api/obtenerCategorias');
    const cats = res.payload ?? res;
    if (!Array.isArray(cats) || !cats.length) return;

    container.innerHTML = cats.map(c => {
      const val = c.nombre.toLowerCase();
      return `
        <label class="filter-option">
          <input type="checkbox" name="categoria" value="${val}" data-id="${c.id_categoria}">
          <span>${c.nombre}</span>
          <span class="filter-count">0</span>
        </label>`;
    }).join('');

    // Re-enganchamos los listeners ahora que el DOM está listo
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', applyFilters);
    });

    // Si viene ?categoria=ID en la URL, marcar el checkbox correspondiente
    const urlCat = new URLSearchParams(window.location.search).get('categoria');
    if (urlCat) {
      const match = container.querySelector(`input[data-id="${urlCat}"], input[value="${urlCat.toLowerCase()}"]`);
      if (match) match.checked = true;
    }
  } catch {
    // Si falla (sin auth o sin BD), deja los filtros estáticos del HTML
  }
}

// ── Carga de productos ───────────────────────────────────────
async function loadProducts() {
  try {
    const res = await Api.get('/api/obtenerProductos', false);
    allProducts = res.payload || res || [];
    await enrichProductsWithColors();
    updateFilterCounts(allProducts);
    applyFilters();
  } catch {
    document.querySelector('.product-grid').innerHTML =
      `<div class="alert alert-error" style="grid-column:1/-1;">Error al cargar productos</div>`;
  }
}

async function enrichProductsWithColors() {
  await Promise.all(allProducts.map(async (p) => {
    const id = p.idProducto || p.id_producto || p.id;
    if (!id) return;
    try {
      const invRes = await Api.get(`/api/obtenerDatosProducto/${id}`, false);
      const rows = invRes.payload || [];
      if (!rows.length) return;
      p.color = rows[0].color || '';
      const totalStock = rows.reduce((s, r) => s + (r.stock || 0), 0);
      p.stock = totalStock;
    } catch { /* producto sin inventario */ }
  }));
}

// ── Actualizar contadores de filtros desde la BD ─────────────
function updateFilterCounts(products) {
  const generoCount   = {};
  const categoriaCount = {};
  const colorCount    = {};

  products.forEach(p => {
    const gen = (p.genero    || '').toLowerCase().trim();
    const cat = (p.categoria || '').toLowerCase().trim();
    const col = (p.color     || '').toLowerCase().trim();

    if (gen) generoCount[gen]    = (generoCount[gen]    || 0) + 1;
    if (cat) categoriaCount[cat] = (categoriaCount[cat] || 0) + 1;
    if (col) colorCount[col]     = (colorCount[col]     || 0) + 1;
  });

  // Género
  document.querySelectorAll('input[name="genero"]').forEach(input => {
    const countEl = input.closest('.filter-option')?.querySelector('.filter-count');
    if (countEl) countEl.textContent = generoCount[input.value.toLowerCase()] || 0;
  });

  // Categoría
  document.querySelectorAll('input[name="categoria"]').forEach(input => {
    const countEl = input.closest('.filter-option')?.querySelector('.filter-count');
    if (countEl) countEl.textContent = categoriaCount[input.value.toLowerCase()] || 0;
  });

  // Color — los swatches no tienen filter-count en el HTML original,
  // pero si se agrega uno al wrapper lo actualiza igual
  document.querySelectorAll('input[name="color"]').forEach(input => {
    const countEl = input.closest('.color-swatch-wrapper')?.querySelector('.filter-count');
    if (countEl) countEl.textContent = colorCount[input.value.toLowerCase()] || 0;
  });
}

// ── Filtrado y render ────────────────────────────────────────
function applyFilters() {
  let filtered = [...allProducts];

  // Filtro por categoría desde URL (?categoria=X)
  const urlCat = new URLSearchParams(window.location.search).get('categoria');
  if (urlCat) {
    filtered = filtered.filter(p =>
      String(p.id_categoria) === urlCat ||
      p.categoria?.toLowerCase() === urlCat.toLowerCase()
    );
  }

  // Filtro por género (checkboxes)
  const genChecked = getChecked('input[name="genero"]:checked');
  if (genChecked.length) {
    filtered = filtered.filter(p => genChecked.includes(p.genero?.toLowerCase()));
  }

  // Filtro por categoría (checkboxes)
  const catChecked = getChecked('input[name="categoria"]:checked');
  if (catChecked.length) {
    filtered = filtered.filter(p => catChecked.includes(p.categoria?.toLowerCase()));
  }

  // Filtro por color (checkboxes)
  const colChecked = getChecked('input[name="color"]:checked');
  if (colChecked.length) {
    filtered = filtered.filter(p => colChecked.includes(p.color?.toLowerCase()));
  }

  // Búsqueda por nombre
  const query = document.querySelector('.header-search input')?.value?.toLowerCase().trim();
  if (query) {
    filtered = filtered.filter(p => p.producto?.toLowerCase().includes(query));
  }

  renderProducts(filtered);
  updateCount(filtered.length);
}

function getChecked(selector) {
  return Array.from(document.querySelectorAll(selector)).map(el => el.value.toLowerCase());
}

function renderProducts(products) {
  const grid = document.querySelector('.product-grid');
  if (!grid) return;

  if (!products.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <span class="empty-state-icon">🔍</span>
      <p>No se encontraron productos</p>
    </div>`;
    return;
  }

  grid.innerHTML = products.map(p => {
    const hasStock = p.stock !== 0;
    const imagen   = firstImage(p.ulrImagen || p.imagen) || 'assests/default.png';
    const nombre   = p.producto  || p.nombre || '';
    const id       = p.idProducto || p.id_producto || p.id;
    const isFav    = favoriteIds.has(Number(id));
    return `
      <article class="product-card">
        <a href="product.html?id=${id}">
          <div class="product-card-image">
            <img src="${imagen}" alt="${nombre}" onerror="imgFallback(this)">
            ${!hasStock ? '<span class="product-card-badge out-of-stock">Sin stock</span>' : ''}
            <button class="product-card-wishlist${isFav ? ' is-active' : ''}" type="button" title="Guardar en favoritos" data-id="${id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="${isFav ? 'var(--color-accent)' : 'none'}" stroke="${isFav ? 'var(--color-accent)' : 'currentColor'}" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>
        </a>
        <div class="product-card-body">
          <p class="product-card-category">${[p.categoria, p.genero].filter(Boolean).join(' · ')}</p>
          <a href="product.html?id=${id}"><h3 class="product-card-name">${nombre}</h3></a>
          <p class="product-card-price">$${Number(p.precio).toLocaleString('es-AR')}</p>
        </div>
        <div class="product-card-footer">
          ${hasStock
            ? `<a href="product.html?id=${id}" class="btn btn-outline btn-sm btn-full">Ver producto</a>`
            : `<button class="btn btn-ghost btn-sm btn-full" disabled>Sin stock</button>`}
        </div>
      </article>
    `;
  }).join('');

  // Wishlist buttons
  document.querySelectorAll('.product-card-wishlist').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!Api.isLoggedIn()) { window.location.href = 'login.html'; return; }

      const user   = Api.getUser();
      const id     = parseInt(btn.dataset.id);
      const svg    = btn.querySelector('svg');
      const isFav  = btn.classList.contains('is-active');

      try {
        if (isFav) {
          await Api.delete('/api/eliminarFavorito', { id_usuario: user.id, id_producto: id });
          btn.classList.remove('is-active');
          svg.setAttribute('fill',   'none');
          svg.setAttribute('stroke', 'currentColor');
          favoriteIds.delete(id);
          showToast('Eliminado de favoritos', 'success');
        } else {
          await Api.post('/api/agregarFavorito', { id_producto: id, id_usuario: user.id });
          btn.classList.add('is-active');
          svg.setAttribute('fill',   'var(--color-accent)');
          svg.setAttribute('stroke', 'var(--color-accent)');
          favoriteIds.add(id);
          showToast('Agregado a favoritos ♥', 'success');
        }
      } catch (err) {
        showToast(err.message || 'Error', 'error');
      }
    });
  });
}

function updateCount(count) {
  const el = document.querySelector('.products-count');
  if (el) el.innerHTML = `Mostrando <strong>${count}</strong> producto${count !== 1 ? 's' : ''}`;
}

// ── Búsqueda ─────────────────────────────────────────────────
function setupSearch() {
  const input = document.querySelector('.header-search input');
  const btn   = document.querySelector('.header-search button');
  if (!input) return;

  const doSearch = () => applyFilters();
  input.addEventListener('input', doSearch);
  if (btn) btn.addEventListener('click', doSearch);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
}

// ── Filtros ──────────────────────────────────────────────────
function setupFilters() {
  document.querySelectorAll('.filters-sidebar input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', applyFilters);
  });
}

// ── Ordenamiento ─────────────────────────────────────────────
function setupSort() {
  const sel = document.querySelector('.sort-select');
  if (!sel) return;
  sel.addEventListener('change', () => {
    const order = sel.value;
    if (!order) return;

    let sorted = [...allProducts];
    if (order === 'precio-asc')  sorted.sort((a, b) => a.precio - b.precio);
    if (order === 'precio-desc') sorted.sort((a, b) => b.precio - a.precio);

    let filtered = sorted;
    const genChecked = getChecked('input[name="genero"]:checked');
    if (genChecked.length) filtered = filtered.filter(p => genChecked.includes(p.genero?.toLowerCase()));
    const catChecked = getChecked('input[name="categoria"]:checked');
    if (catChecked.length) filtered = filtered.filter(p => catChecked.includes(p.categoria?.toLowerCase()));
    const colChecked = getChecked('input[name="color"]:checked');
    if (colChecked.length) filtered = filtered.filter(p => colChecked.includes(p.color?.toLowerCase()));
    const query = document.querySelector('.header-search input')?.value?.toLowerCase().trim();
    if (query) filtered = filtered.filter(p => p.producto?.toLowerCase().includes(query));

    renderProducts(filtered);
    updateCount(filtered.length);
  });
}

// ── Limpiar filtros ──────────────────────────────────────────
function setupClearFilters() {
  const btn = document.querySelector('.filters-sidebar .btn-ghost');
  if (!btn) return;
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filters-sidebar input[type="checkbox"]').forEach(cb => cb.checked = false);
    const searchInput = document.querySelector('.header-search input');
    if (searchInput) searchInput.value = '';
    applyFilters();
  });
}