// ============================================================
//  PRODUCT — product.html
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { window.location.href = 'index.html'; return; }

  await loadProduct(id);
  setupAddToCart();
  await setupWishlist(id);
});

// ── Carga del producto ───────────────────────────────────────
async function loadProduct(id) {
  try {
    const res = await Api.get(`/api/obtenerDatosProducto/${id}`, false);
    let product;

    if (res.payload?.length) {
      product = {
        nombre:      res.payload[0].producto,
        descripcion: res.payload[0].descripcion,
        precio:      res.payload[0].precio,
        genero:      res.payload[0].genero,
        imagen:      res.payload[0].ulrImagen,
        categoria:   res.payload[0].categoria,
        id_categoria: res.payload[0].idCategoria,
        color:       res.payload[0].color,
        inventario:  res.payload.map(row => ({
          id:    row.idInventario,
          talle: row.talle,
          color: row.color,
          stock: row.stock,
        })),
      };
    } else {
      const all = await Api.get('/api/obtenerProductos', false);
      const p = (all.payload || []).find(x => x.idProducto == id);
      if (!p) throw new Error();
      product = {
        nombre:      p.producto,
        descripcion: p.descripcion || '',
        precio:      p.precio || 0,
        genero:      p.genero || '',
        imagen:      p.ulrImagen || '',
        categoria:   p.categoria || '',
        id_categoria: p.idCategoria,
        color:       '',
        inventario:  [],
      };
    }

    renderProduct(product);
  } catch {
    document.querySelector('.product-detail-layout').innerHTML =
      `<div class="alert alert-error" style="grid-column:1/-1;">
         No se pudo cargar el producto. <a href="index.html">Volver al catálogo</a>
       </div>`;
  }
}

// ── Renderizado ──────────────────────────────────────────────
function renderProduct(p) {
  document.title = `${p.nombre} — Lana & Lino`;

  // Breadcrumb
  const bcLast = document.querySelector('.breadcrumb span:last-child');
  if (bcLast) bcLast.textContent = p.nombre;

  // Galería de imágenes
  renderGallery(parseImages(p.imagen), p.nombre);

  // Textos
  setText('.product-info-category', [p.categoria, p.genero, p.color].filter(Boolean).join(' · '));
  setText('.product-info-name',        p.nombre);
  setText('.product-info-description', p.descripcion);
  setText('.product-info-price',       `$${Number(p.precio).toLocaleString('es-AR')}`);

  // Inventario (talles + stock)
  const inventario = p.inventario || [];
  renderSizes(inventario);
  renderStockIndicator(inventario);

  // Cuotas
  renderCuotas(p.precio);

  // Guardar referencia global para add-to-cart
  window._product = p;
}

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

// ── Talles ───────────────────────────────────────────────────
function renderSizes(inventario) {
  const container = document.querySelector('.size-options');
  if (!container) return;

  if (!inventario.length) {
    container.innerHTML = `<p style="color:var(--color-text-muted);font-size:.875rem;">Sin talles cargados</p>`;
    return;
  }

  container.innerHTML = inventario.map((inv, i) => `
    <div class="size-option ${inv.stock === 0 ? 'unavailable' : ''}">
      <input type="radio" name="talle" id="t-${inv.id}" value="${inv.id}"
             ${inv.stock === 0 ? 'disabled' : ''} ${i === 0 && inv.stock > 0 ? 'checked' : ''}>
      <label for="t-${inv.id}">${inv.talle}</label>
    </div>`
  ).join('');
}

// ── Stock ────────────────────────────────────────────────────
function renderStockIndicator(inventario) {
  const dot  = document.querySelector('.stock-dot');
  const text = document.querySelector('.stock-indicator span:last-child');
  if (!dot || !text) return;

  const total = inventario.reduce((s, i) => s + (i.stock || 0), 0);
  dot.className = 'stock-dot';

  if (total === 0) {
    dot.classList.add('no-stock');
    text.textContent = 'Sin stock disponible';
    disableAddToCart();
  } else if (total < 5) {
    dot.classList.add('low-stock');
    text.textContent = `¡Últimas ${total} unidades!`;
  } else {
    dot.classList.add('in-stock');
    text.textContent = `En stock — ${total} unidades disponibles`;
  }
}

function disableAddToCart() {
  const btn = document.getElementById('btn-add-cart');
  if (btn) {
    btn.disabled     = true;
    btn.textContent  = 'Sin stock';
  }
}

// ── Cuotas (actualiza los precios calculados) ────────────────
function renderCuotas(precio) {
  const p       = Number(precio);
  const configs = [
    { n: 1,  rate: 1,    label: 'cuota única — sin interés' },
    { n: 3,  rate: 1,    label: '3 cuotas — sin interés' },
    { n: 6,  rate: 1.15, label: '6 cuotas — con interés (CFT 15%)' },
    { n: 9,  rate: 1.18, label: '9 cuotas — con interés (CFT 18%)' },
    { n: 12, rate: 1.22, label: '12 cuotas — con interés (CFT 22%)' },
  ];

  configs.forEach(({ n, rate, label }) => {
    const el = document.querySelector(`.cp-${n}`);
    if (!el) return;
    const cuota = Math.ceil((p * rate) / n);
    el.innerHTML = `<strong>$${cuota.toLocaleString('es-AR')}</strong> <span>/ ${label}</span>`;
  });
}

// ── Galería de miniaturas ────────────────────────────────────
function renderGallery(imagenes, nombre) {
  const mainImg     = document.querySelector('.product-gallery-main img');
  const thumbsBox   = document.querySelector('.product-gallery-thumbs');

  const principal = imagenes[0] || 'assests/default.png';
  if (mainImg) {
    mainImg.src = principal;
    mainImg.alt = nombre;
  }

  if (!thumbsBox) return;
  thumbsBox.innerHTML = '';
  if (imagenes.length < 2) return;

  imagenes.forEach((src, i) => {
    const thumb = document.createElement('div');
    thumb.className = `product-gallery-thumb ${i === 0 ? 'active' : ''}`;
    thumb.innerHTML = `<img src="${src}" alt="${nombre}" onerror="imgFallback(this)">`;
    thumb.addEventListener('click', () => {
      thumbsBox.querySelectorAll('.product-gallery-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      if (mainImg) mainImg.src = src;
    });
    thumbsBox.appendChild(thumb);
  });
}

// ── Agregar al carrito ───────────────────────────────────────
function setupAddToCart() {
  const btn = document.getElementById('btn-add-cart');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    if (!Api.isLoggedIn()) { window.location.href = 'login.html'; return; }

    const talleInput = document.querySelector('input[name="talle"]:checked');
    if (!talleInput) { showToast('Seleccioná un talle', 'error'); return; }

    const user = Api.getUser();
    const idInventario = parseInt(talleInput.value);

    // Verificar si ya está en el carrito
    const cartRes = await Api.get(`/api/obtenerProductosCarrito/${user.id}`);
    const cartItems = cartRes.payload || [];
    if (cartItems.some(i => i.idInventario === idInventario)) {
      showToast('Este producto ya está en tu carrito', 'error');
      return;
    }

    const originalHTML = btn.innerHTML;
    btn.disabled   = true;
    btn.textContent = 'Agregando...';

    try {
      await Api.post('/api/agregarACarrito', {
        id_inventario: idInventario,
        id_usuario:    user.id,
      });
      showToast('¡Producto agregado al carrito! 🛒', 'success');
      updateCartBadge();
    } catch (err) {
      showToast(err.message || 'Error al agregar al carrito', 'error');
    } finally {
      btn.disabled  = false;
      btn.innerHTML = originalHTML;
    }
  });
}

// ── Favoritos ─────────────────────────────────────────────────
async function setupWishlist(productId) {
  const btn = document.getElementById('btn-wishlist');
  if (!btn) return;

  const id = parseInt(productId);
  let isFavorite = false;

  if (Api.isLoggedIn()) {
    try {
      const user = Api.getUser();
      const res  = await Api.get(`/api/obtenerFavoritos/${user.id}`);
      const favs = res.payload || [];
      isFavorite = favs.some(f => Number(f.idProducto || f.id_producto) === id);
    } catch { /* silencioso */ }
  }

  setWishlistState(btn, isFavorite);

  btn.addEventListener('click', async () => {
    if (!Api.isLoggedIn()) { window.location.href = 'login.html'; return; }

    const user = Api.getUser();
    try {
      if (isFavorite) {
        await Api.delete('/api/eliminarFavorito', { id_usuario: user.id, id_producto: id });
        isFavorite = false;
        setWishlistState(btn, false);
        showToast('Eliminado de favoritos', 'success');
      } else {
        await Api.post('/api/agregarFavorito', { id_producto: id, id_usuario: user.id });
        isFavorite = true;
        setWishlistState(btn, true);
        showToast('Agregado a favoritos ♥', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Error al actualizar favoritos', 'error');
    }
  });
}

function setWishlistState(btn, active) {
  const svg = btn.querySelector('svg');
  if (svg) {
    svg.setAttribute('fill',   active ? 'var(--color-accent)' : 'none');
    svg.setAttribute('stroke', active ? 'var(--color-accent)' : 'currentColor');
  }
  btn.classList.toggle('is-active', active);
  btn.title = active ? 'Quitar de favoritos' : 'Agregar a favoritos';
}