// ============================================================
//  PRODUCTS — index.html (catálogo dinámico)
// ============================================================

let allProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  setupSearch();
  setupFilters();
  setupSort();
  setupClearFilters();
});

// ── Carga de productos ───────────────────────────────────────
async function loadProducts() {
  try {
    const res = await Api.get('/api/obtenerProductos', false);
    allProducts = res.payload || [];
    applyFilters();
  } catch {
    document.querySelector('.product-grid').innerHTML =
      `<div class="alert alert-error" style="grid-column:1/-1;">Error al cargar productos</div>`;
  }
}

// ── Filtrado y render ────────────────────────────────────────
function applyFilters() {
  let filtered = [...allProducts];

  // Filtro por categoría desde URL (?categoria=X)
  const urlCat = new URLSearchParams(window.location.search).get('categoria');
  if (urlCat) {
    filtered = filtered.filter(p =>
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
  updateSortVisibility(filtered.length !== allProducts.length);
}

function getChecked(selector) {
  return Array.from(document.querySelectorAll(selector)).map(el => el.value.toLowerCase());
}

function renderProducts(products) {
  const grid = document.querySelector('.product-grid');
  if (!grid) return;

  if (!products.length) {
    grid.innerHTML = `<div class="alert alert-info" style="grid-column:1/-1;">No se encontraron productos</div>`;
    return;
  }

  grid.innerHTML = products.map(p => {
    const hasStock = p.stock !== 0;
    return `
      <article class="product-card">
        <a href="product.html?id=${p.idProducto}">
          <div class="product-card-image">
            <img src="${p.ulrImagen || 'assets/images/placeholder.jpg'}" alt="${p.producto}">
            ${!hasStock ? '<span class="product-card-badge out-of-stock">Sin stock</span>' : ''}
            <button class="product-card-wishlist" type="button" title="Guardar en favoritos" data-id="${p.idProducto}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>
        </a>
        <div class="product-card-body">
          <p class="product-card-category">${[p.categoria, p.genero].filter(Boolean).join(' · ')}</p>
          <a href="product.html?id=${p.idProducto}"><h3 class="product-card-name">${p.producto}</h3></a>
          <p class="product-card-price">$${Number(p.precio).toLocaleString('es-AR')}</p>
        </div>
        <div class="product-card-footer">
          ${hasStock
            ? `<a href="product.html?id=${p.idProducto}" class="btn btn-outline btn-sm btn-full">Ver producto</a>`
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
      const user = Api.getUser();
      try {
        await Api.post('/api/agregarFavorito', {
          id_producto: parseInt(btn.dataset.id),
          id_usuario: user.id,
        });
        btn.querySelector('svg').setAttribute('fill', 'var(--color-accent)');
        btn.querySelector('svg').setAttribute('stroke', 'var(--color-accent)');
        showToast('Agregado a favoritos ♥', 'success');
      } catch (err) {
        showToast(err.message || 'Error', 'error');
      }
    });
  });
}

function updateCount(count) {
  document.querySelector('.products-count').innerHTML =
    `Mostrando <strong>${count}</strong> producto${count !== 1 ? 's' : ''}`;
}

function updateSortVisibility(show) {
  // Mostrar/ocultar mensaje si filtros activos
}

// ── Búsqueda ─────────────────────────────────────────────────
function setupSearch() {
  const input = document.querySelector('.header-search input');
  const btn   = document.querySelector('.header-search button');
  if (!input) return;

  const doSearch = () => applyFilters();

  input.addEventListener('input', doSearch);
  if (btn) btn.addEventListener('click', doSearch);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });
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
    const grid = document.querySelector('.product-grid');
    const cards = Array.from(grid?.querySelectorAll('.product-card') || []);
    const order = sel.value;

    const sorted = cards.sort((a, b) => {
      const getVal = (card, selector) => {
        const el = card.querySelector(selector);
        return el ? el.textContent.trim() : '';
      };
      if (order === 'precio-asc' || order === 'precio-desc') {
        const aPrice = parseFloat(getVal(a, '.product-card-price').replace(/[^0-9]/g, '')) || 0;
        const bPrice = parseFloat(getVal(b, '.product-card-price').replace(/[^0-9]/g, '')) || 0;
        return order === 'precio-asc' ? aPrice - bPrice : bPrice - aPrice;
      }
      return 0;
    });

    sorted.forEach(card => grid?.appendChild(card));
  });
}

// ── Limpiar filtros ──────────────────────────────────────────
function setupClearFilters() {
  const btn = document.querySelector('.filters-sidebar .btn-ghost');
  if (!btn) return;
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filters-sidebar input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelector('.header-search input').value = '';
    applyFilters();
  });
}
