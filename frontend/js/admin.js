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
  setupImageInput();
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

// ── Imagen del producto: guardar el archivo en /assets ───────
function setupImageInput() {
  const input = document.getElementById('ad-imagen');
  const hint  = document.getElementById('ad-imagen-hint');
  const form  = document.querySelector('.admin-form');
  if (!input) return;

  input.addEventListener('change', async () => {
    delete form.dataset.savedImageName;
    const file = input.files?.[0];
    if (!file) return;

    if (!window.showSaveFilePicker) {
      if (hint) hint.textContent = `Copiá manualmente "${file.name}" a la carpeta assets/ del proyecto.`;
      return;
    }

    try {
      const handle   = await window.showSaveFilePicker({ suggestedName: file.name });
      const writable = await handle.createWritable();
      await writable.write(file);
      await writable.close();

      form.dataset.savedImageName = handle.name;
      if (hint) hint.textContent = `Imagen guardada como assets/${handle.name}`;
      showToast('Imagen guardada en assets ✓', 'success');
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (hint) hint.textContent = `Copiá manualmente "${file.name}" a la carpeta assets/ del proyecto.`;
      showToast('No se pudo guardar la imagen automáticamente', 'error');
    }
  });
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
  setValue('ad-precio',      formatPriceInput(product.precio));
  setValue('ad-genero',      (product.genero || '').toLowerCase());
  setValue('ad-color',       (product.color  || '').toLowerCase());
  setValue('ad-stock',       product.stock   || 0);

  // La imagen actual se conserva salvo que se elija un archivo nuevo
  form.dataset.editImagen = product.ulrImagen || product.imagen || '';
  const imagenHint = document.getElementById('ad-imagen-hint');
  if (imagenHint) {
    imagenHint.textContent = form.dataset.editImagen
      ? `Imagen actual: ${firstImage(form.dataset.editImagen)}`
      : '';
  }

  // Categoría
  const catSelect = document.getElementById('ad-categoria');
  if (catSelect && (product.idCategoria || product.id_categoria)) {
    catSelect.value = product.idCategoria || product.id_categoria;
  }
  updateTalleGroups(false);

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
    const precio      = parsePriceInput(document.getElementById('ad-precio')?.value);
    const genero      = document.getElementById('ad-genero')?.value;
    const idCategoria = parseInt(document.getElementById('ad-categoria')?.value);
    const color       = document.getElementById('ad-color')?.value;
    const stock       = parseInt(document.getElementById('ad-stock')?.value) || 0;
    const talles      = [...document.querySelectorAll('input[name="talles"]:checked')].map(i => i.value);
    const imagenFile  = document.getElementById('ad-imagen')?.files?.[0];
    const imagen      = imagenFile
      ? `assets/${form.dataset.savedImageName || imagenFile.name}`
      : (form.dataset.editImagen || '');

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
  delete form.dataset.editImagen;
  const title = document.querySelector('.admin-card-title');
  const btn   = form.querySelector('button[type="submit"]');
  const hint  = document.getElementById('ad-imagen-hint');
  if (title) title.textContent = 'Nuevo producto';
  if (btn)   btn.textContent   = 'Guardar producto';
  if (hint)  hint.textContent  = '';
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