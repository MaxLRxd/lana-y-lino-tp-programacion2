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
});

// ── Categorías en el select ───────────────────────────────────
async function loadCategoriesSelect() {
  const select = document.getElementById('ad-categoria');
  if (!select) return;

  try {
    const res    = await Api.get('/api/obtenerCategorias');
    const cats   = res.payload || [];
    const select = document.getElementById('ad-categoria');
    if (!select) return;
    select.innerHTML = `<option value="">Seleccioná...</option>` +
      cats.map(c => `<option value="${c.id_categoria || c.id}">${c.nombre}</option>`).join('');
  } catch { /* silencioso */ }
}

// ── Tabla de productos ────────────────────────────────────────
async function loadProductsTable(query = '') {
  const tbody = document.querySelector('.admin-table tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--color-text-muted);padding:24px">Cargando...</td></tr>`;

  try {
    const res = await Api.get('/api/obtenerProductos', false);
    let products = res.payload || [];
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
            <img src="${p.ulrImagen || p.imagen || 'assets/images/placeholder.jpg'}" alt="${p.producto || p.nombre}">
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
    btn.addEventListener('click', () => {
      const product = JSON.parse(btn.dataset.product);
      enterEditMode(product);
    });
  });
}

// ── Modo edición ──────────────────────────────────────────────
function enterEditMode(product) {
  const form  = document.querySelector('.admin-form');
  const title = document.querySelector('.admin-card-title');
  const btn   = form?.querySelector('button[type="submit"]');

  if (!form) return;

  // Rellenar campos
  setValue('ad-nombre',      product.producto || product.nombre || '');
  setValue('ad-descripcion', product.descripcion || '');
  setValue('ad-precio',      product.precio      || '');
  setValue('ad-genero',      (product.genero || '').toLowerCase());
  setValue('ad-color',       (product.color  || '').toLowerCase());
  setValue('ad-stock',       product.stock   || 0);

  // Categoría
  const catSelect = document.getElementById('ad-categoria');
  if (catSelect && (product.idCategoria || product.id_categoria)) {
    catSelect.value = product.idCategoria || product.id_categoria;
  }

  // Marcar talles
  document.querySelectorAll('input[name="talles"]').forEach(cb => cb.checked = false);
  (product.talles || []).forEach(t => {
    const cb = document.querySelector(`input[name="talles"][value="${t}"]`);
    if (cb) cb.checked = true;
  });

  form.dataset.editId           = product.idProducto || product.id;
  form.dataset.editInventarioId = product.id_inventario || '';

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
    const precio      = parseFloat(document.getElementById('ad-precio')?.value);
    const genero      = document.getElementById('ad-genero')?.value;
    const idCategoria = parseInt(document.getElementById('ad-categoria')?.value);
    const color       = document.getElementById('ad-color')?.value;
    const stock       = parseInt(document.getElementById('ad-stock')?.value) || 0;
    const talles      = [...document.querySelectorAll('input[name="talles"]:checked')].map(i => i.value);

    if (!nombre || isNaN(precio) || precio <= 0 || !genero || !idCategoria || !color) {
      showToast('Completá todos los campos obligatorios', 'error');
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    try {
      btn.disabled = true; btn.textContent = 'Guardando...';

      if (form.dataset.editId) {
        // ── EDITAR: solo modificar stock por ahora (API limitada) ──
        if (form.dataset.editInventarioId) {
          await Api.put('/api/modificarStock', {
            stock,
            id_inventario: parseInt(form.dataset.editInventarioId),
          });
        }
        showToast('Producto actualizado ✓', 'success');
        exitEditMode(form);
      } else {
        // ── CREAR ──
        const res = await Api.post('/api/cargarProducto', {
          nombre, descripcion, precio, genero,
          id_categoria: idCategoria,
          imagen: '',
        });

        const productId = res.payload?.[0]?.idProducto || res.insertId;
        console.log('Producto creado ID:', productId, 'Talles:', talles);

        // Crear entradas de inventario (una por talle)
        if (productId && talles.length) {
          try {
            await Promise.all(
              talles.map(talle =>
                Api.post('/api/crearInventario', { talle, color, stock, id_producto: productId })
              )
            );
          } catch (invErr) {
            showToast('Producto creado pero hubo un error al guardar talles/stock', 'error');
          }
        }

        showToast('Producto creado correctamente ✓', 'success');
        form.reset();
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