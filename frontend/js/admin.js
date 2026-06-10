// ============================================================
//  ADMIN — admin.html
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  // Protección de ruta — solo admin
  if (!Api.isLoggedIn() || !Api.isAdmin()) {
    window.location.href = 'index.html';
    return;
  }

  await loadCategoriesSelect();
  await loadProductsTable();
  setupAdminForm();
  setupSearch();
  setupNav();
  setupTalleToggle();
  setupPriceFormatter();
  setupImageUrls();
});

// ── Formato de precio (es-AR: punto de miles, coma decimal) ──
function setupPriceFormatter() {
  const input = document.getElementById('ad-precio');
  if (!input) return;

  input.addEventListener('input', () => {
    const value = input.value.replace(/[^\d,]/g, '');
    const [intRaw, decRaw] = value.split(',');

    const intPart = (intRaw || '').replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    input.value = decRaw !== undefined ? `${intPart || '0'},${decRaw.slice(0, 2)}` : intPart;
  });
}

function formatPriceInput(value) {
  const num = Number(value);
  return isNaN(num) ? '' : num.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

function parsePriceInput(value) {
  return parseFloat((value || '').replace(/\./g, '').replace(',', '.'));
}

// ── Imágenes del producto: URLs múltiples ────────────────────
function setupImageUrls() {
  const list  = document.getElementById('image-url-list');
  const addBtn = document.getElementById('btn-add-image');
  if (!list) return;

  function updateRemoveButtons() {
    const rows = list.querySelectorAll('.image-url-row');
    rows.forEach((row, i) => {
      const btn = row.querySelector('.btn-remove-url');
      if (btn) btn.style.display = rows.length > 1 ? '' : 'none';
    });
  }

  function updatePreview(input) {
    const row = input.closest('.image-url-row');
    let preview = row.querySelector('.image-url-preview');
    const url = input.value.trim();
    if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:'))) {
      if (!preview) {
        preview = document.createElement('img');
        preview.className = 'image-url-preview';
        preview.onerror = () => { preview.style.display = 'none'; };
        row.insertBefore(preview, row.querySelector('.btn-remove-url'));
      }
      preview.style.display = '';
      preview.src = url;
    } else if (preview) {
      preview.style.display = 'none';
    }
  }

  function createRow(url = '') {
    const row = document.createElement('div');
    row.className = 'image-url-row';
    row.innerHTML = `
      <input class="form-input" type="url" placeholder="https://ejemplo.com/imagen.jpg" value="${url}">
      <button type="button" class="btn btn-danger btn-sm btn-remove-url" title="Quitar imagen">✕</button>
    `;
    const input = row.querySelector('input');
    input.addEventListener('input', () => updatePreview(input));
    row.querySelector('.btn-remove-url').addEventListener('click', () => {
      row.remove();
      updateRemoveButtons();
    });
    if (url) setTimeout(() => updatePreview(input), 0);
    return row;
  }

  addBtn?.addEventListener('click', () => {
    list.appendChild(createRow());
    updateRemoveButtons();
  });

  list.querySelectorAll('.image-url-row').forEach(row => {
    const input = row.querySelector('input');
    input.addEventListener('input', () => updatePreview(input));
    const btn = row.querySelector('.btn-remove-url');
    btn.addEventListener('click', () => {
      btn.closest('.image-url-row').remove();
      updateRemoveButtons();
    });
    if (input.value.trim()) setTimeout(() => updatePreview(input), 0);
  });

  updateRemoveButtons();
}

function getImageUrls() {
  const inputs = document.querySelectorAll('#image-url-list .image-url-row input');
  return Array.from(inputs).map(inp => inp.value.trim()).filter(Boolean);
}

function setImageUrls(urlString) {
  const list = document.getElementById('image-url-list');
  if (!list) return;
  const urls = (urlString || '').split(';').map(s => s.trim()).filter(Boolean);
  list.innerHTML = '';
  (urls.length ? urls : ['']).forEach(url => {
    const row = document.createElement('div');
    row.className = 'image-url-row';
    row.innerHTML = `
      <input class="form-input" type="url" placeholder="https://ejemplo.com/imagen.jpg" value="${url.replace(/"/g, '&quot;')}">
      <button type="button" class="btn btn-danger btn-sm btn-remove-url" title="Quitar imagen">✕</button>
    `;
    const input = row.querySelector('input');
    input.addEventListener('input', () => {
      const r = input.closest('.image-url-row');
      let p = r.querySelector('.image-url-preview');
      const v = input.value.trim();
      if (v && (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('data:'))) {
        if (!p) { p = document.createElement('img'); p.className = 'image-url-preview'; p.onerror = () => { p.style.display = 'none'; }; r.insertBefore(p, r.querySelector('.btn-remove-url')); }
        p.style.display = ''; p.src = v;
      } else if (p) { p.style.display = 'none'; }
    });
    row.querySelector('.btn-remove-url').addEventListener('click', () => {
      row.remove();
      list.querySelectorAll('.btn-remove-url').forEach(b => {
        b.style.display = list.querySelectorAll('.image-url-row').length > 1 ? '' : 'none';
      });
    });
    list.appendChild(row);
    if (url) setTimeout(() => input.dispatchEvent(new Event('input')), 0);
  });
  list.querySelectorAll('.btn-remove-url').forEach(b => {
    b.style.display = list.querySelectorAll('.image-url-row').length > 1 ? '' : 'none';
  });
}

function resetImageUrls() {
  setImageUrls('');
}

// ── Categorías en el select ───────────────────────────────────
async function loadCategoriesSelect() {
  const select = document.getElementById('ad-categoria');
  if (!select) return;

  try {
    const res  = await Api.get('/api/obtenerCategorias');
    const cats = res.payload || [];
    select.innerHTML = `<option value="">Seleccioná...</option>` +
      cats.map(c => `<option value="${c.id_categoria || c.id}">${c.nombre}</option>`).join('');
  } catch { /* silencioso */ }
}

// ── Mostrar talles de ropa o de calzado según la categoría ────
function updateTalleGroups(uncheckHidden) {
  const select       = document.getElementById('ad-categoria');
  const groupRopa    = document.querySelector('.size-check-group[data-tipo-talle="ropa"]');
  const groupCalzado = document.querySelector('.size-check-group[data-tipo-talle="calzado"]');
  if (!select || !groupRopa || !groupCalzado) return;

  const nombreCategoria = select.options[select.selectedIndex]?.textContent.toLowerCase() || '';
  const esCalzado = nombreCategoria.includes('calzado');

  groupRopa.style.display    = esCalzado ? 'none' : '';
  groupCalzado.style.display = esCalzado ? '' : 'none';

  if (uncheckHidden) {
    const hidden = esCalzado ? groupRopa : groupCalzado;
    hidden.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  }
}

function setupTalleToggle() {
  const select = document.getElementById('ad-categoria');
  if (!select) return;

  select.addEventListener('change', () => updateTalleGroups(true));
  document.querySelector('.admin-form')?.addEventListener('reset', () => {
    setTimeout(() => updateTalleGroups(false), 0);
  });

  updateTalleGroups(false);
}

// ── Tabla de productos ────────────────────────────────────────
async function enrichProductsWithInventory(products) {
  await Promise.all(products.map(async (p) => {
    const id = p.idProducto || p.id_producto || p.id;
    if (!id) return;
    try {
      const invRes = await Api.get(`/api/obtenerDatosProducto/${id}`, false);
      const rows = invRes.payload || [];
      if (!rows.length) return;
      p.color = rows[0].color || '';
      p.stock = rows.reduce((s, r) => s + (r.stock || 0), 0);
    } catch { /* producto sin inventario */ }
  }));
}

async function loadProductsTable(query = '') {
  const tbody = document.querySelector('.admin-table tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--color-text-muted);padding:24px">Cargando...</td></tr>`;

  try {
    const res = await Api.get('/api/obtenerProductos', false);
    let products = res.payload || [];
    await enrichProductsWithInventory(products);
    if (query) {
      products = products.filter(p => (p.producto || p.nombre)?.toLowerCase().includes(query.toLowerCase()));
    }
    renderTable(products);
  } catch {
    tbody.innerHTML = `<tr><td colspan="6"><div class="alert alert-error">Error al cargar productos</div></td></tr>`;
  }
}

function renderTable(products) {
  const tbody = document.querySelector('.admin-table tbody');
  if (!tbody) return;

  if (!products.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--color-text-muted)">Sin resultados</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr>
      <td>
        <div class="admin-table-product-cell">
          <div class="admin-table-thumb">
            <img src="${firstImage(p.ulrImagen || p.imagen) || 'assests/default.png'}" alt="${p.producto || p.nombre}" onerror="imgFallback(this)">
          </div>
          <span class="admin-table-product-name">${p.producto || p.nombre}</span>
        </div>
      </td>
      <td>${p.categoria || '-'}</td>
      <td>$${Number(p.precio || 0).toLocaleString('es-AR')}</td>
      <td>${p.stock ?? '-'}</td>
      <td>${p.color || '-'}</td>
      <td>
        <div class="admin-table-actions">
          <button class="btn btn-ghost btn-sm btn-edit"
                  type="button" data-product='${JSON.stringify(p)}'>
            Editar
          </button>
        </div>
      </td>
    </tr>`
  ).join('');

  tbody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', async () => {
      const product = JSON.parse(btn.dataset.product);
      try {
        await enterEditMode(product);
      } catch (err) {
        showToast(err.message || 'Error al entrar en modo edición', 'error');
      }
    });
  });
}

// ── Modo edición ──────────────────────────────────────────────
async function enterEditMode(product) {
  const form  = document.querySelector('.admin-form');
  const title = document.querySelector('.admin-card-title');
  const btn   = form?.querySelector('button[type="submit"]');

  if (!form) return;

  // Rellenar campos
  setValue('ad-nombre',      product.producto || product.nombre || '');
  setValue('ad-descripcion', product.descripcion || '');
  setValue('ad-precio',      formatPriceInput(product.precio));
  setValue('ad-genero',      (product.genero || '').toLowerCase());
  setValue('ad-color',       (product.color  || '').toLowerCase());

  // Imágenes: rellenar los inputs con las URLs existentes
  setImageUrls(product.ulrImagen || product.imagen || '');

  // Categoría
  const catSelect = document.getElementById('ad-categoria');
  if (catSelect && (product.idCategoria || product.id_categoria)) {
    catSelect.value = product.idCategoria || product.id_categoria;
  }
  updateTalleGroups(false);

  form.dataset.editId           = product.idProducto || product.id;
  form.dataset.editInventarioId = '';

  // Traer datos de inventario (color, stock, talles, id_inventario)
  const invRes = await Api.get(`/api/obtenerDatosProducto/${form.dataset.editId}`, false).catch(() => null);
  const invRows = invRes?.payload || [];

  if (invRows.length) {
    setValue('ad-stock', invRows[0].stock ?? 0);
    setValue('ad-color', (invRows[0].color || '').toLowerCase());
    form.dataset.editInventarioId = invRows[0].idInventario || '';

    // Marcar talles disponibles
    document.querySelectorAll('input[name="talles"]').forEach(cb => cb.checked = false);
    invRows.forEach(r => {
      const cb = document.querySelector(`input[name="talles"][value="${r.talle}"]`);
      if (cb) cb.checked = true;
    });
  } else {
    setValue('ad-stock', product.stock || 0);
    document.querySelectorAll('input[name="talles"]').forEach(cb => cb.checked = false);
    (product.talles || []).forEach(t => {
      const cb = document.querySelector(`input[name="talles"][value="${t}"]`);
      if (cb) cb.checked = true;
    });
  }

  if (title) title.textContent = `Editando: ${product.producto || product.nombre}`;
  if (btn)   btn.textContent   = 'Guardar cambios';

  // Scroll al formulario
  document.getElementById('nuevo-producto')?.scrollIntoView({ behavior: 'smooth' });
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

// ── Formulario crear / editar producto ───────────────────────
function setupAdminForm() {
  const form = document.querySelector('.admin-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre      = document.getElementById('ad-nombre')?.value.trim();
    const descripcion = document.getElementById('ad-descripcion')?.value.trim();
    const precio      = parsePriceInput(document.getElementById('ad-precio')?.value);
    const genero      = document.getElementById('ad-genero')?.value;
    const idCategoria = parseInt(document.getElementById('ad-categoria')?.value);
    const color       = document.getElementById('ad-color')?.value;
    const stock       = parseInt(document.getElementById('ad-stock')?.value) || 0;
    const talles      = [...document.querySelectorAll('input[name="talles"]:checked')].map(i => i.value);
    const imagen      = getImageUrls().join(';');

    if (!nombre || isNaN(precio) || precio <= 0 || !genero || !idCategoria || !color) {
      showToast('Completá todos los campos obligatorios', 'error');
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    try {
      btn.disabled = true; btn.textContent = 'Guardando...';

      if (form.dataset.editId) {
        // ── EDITAR: solo modificar stock por ahora (API limitada) ──
        const invId = parseInt(form.dataset.editInventarioId);
        if (!isNaN(invId) && invId >= 0) {
          await Api.put('/api/modificarStock', {
            stock,
            id_inventario: invId,
          });
          showToast('Producto actualizado ✓', 'success');
        }
        exitEditMode(form);
      } else {
        // ── CREAR ──
        const res = await Api.post('/api/cargarProducto', {
          nombre, descripcion, precio, genero,
          id_categoria: idCategoria,
          imagen,
        });

        const productId = res.payload?.[0]?.idProducto || res.insertId;
        console.log('Producto creado ID:', productId, 'Talles:', talles);

        // Crear entradas de inventario (una por talle, de forma secuencial)
        if (productId && talles.length) {
          for (const talle of talles) {
            try {
              await Api.post('/api/crearInventario', { talle, color, stock, id_producto: productId });
            } catch (invErr) {
              showToast(`Hubo un error al guardar el talle ${talle}`, 'error');
            }
          }
        }

        showToast('Producto creado correctamente ✓', 'success');
        form.reset();
        resetImageUrls();
      }

      await loadProductsTable();
    } catch (err) {
      showToast(err.message || 'Error al guardar el producto', 'error');
    } finally {
      btn.disabled = false;
      if (!form.dataset.editId) btn.textContent = 'Guardar producto';
    }
  });

  // Cancelar
  form.querySelector('.btn-ghost')?.addEventListener('click', () => {
    form.reset();
    exitEditMode(form);
  });
}

function exitEditMode(form) {
  delete form.dataset.editId;
  delete form.dataset.editInventarioId;
  const title = document.querySelector('.admin-card-title');
  const btn   = form.querySelector('button[type="submit"]');
  if (title) title.textContent = 'Nuevo producto';
  if (btn)   btn.textContent   = 'Guardar producto';
  resetImageUrls();
}

// ── Búsqueda en tabla ─────────────────────────────────────────
function setupSearch() {
  const input = document.querySelector('.admin-search-bar input');
  const btn   = document.querySelector('.admin-search-bar .btn');

  btn?.addEventListener('click',   () => loadProductsTable(input?.value || ''));
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') loadProductsTable(input.value); });
}

// ── Navegación del sidebar ────────────────────────────────────
function setupNav() {
  const links = document.querySelectorAll('.admin-nav-link');
  links.forEach(link => {
    link.addEventListener('click', () => {
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
}