// ============================================================
//  PAYMENT — payment.html
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  if (!Api.isLoggedIn()) { window.location.href = 'login.html'; return; }

  await loadPaymentItems();
  setupMethodSelector();
  setupCardInputs();
  setupPayButton();
});

// ── Cargar resumen del pedido ─────────────────────────────────
async function loadPaymentItems() {
  const user = Api.getUser();
  try {
    const items = await Api.get(`/api/obtenerProductosCarrito/${user.id}`);
    renderOrderSummary(items || []);
  } catch {
    showToast('Error al cargar el pedido', 'error');
  }
}

function renderOrderSummary(items) {
  const container = document.querySelector('.payment-order-items');
  if (!container) return;

  const total = items.reduce((s, i) => s + Number(i.precio || 0), 0);

  container.innerHTML = items.map(item => `
    <div class="payment-order-item">
      <div class="payment-order-item-img">
        <img src="${item.imagen || 'assets/images/placeholder.jpg'}" alt="${item.nombre}">
      </div>
      <div class="payment-order-item-name">
        ${item.nombre}
        <div class="payment-order-item-meta">
          Talle: ${item.talle || '-'} &nbsp;·&nbsp; ${item.color || '-'}
        </div>
      </div>
      <p class="payment-order-item-price">$${Number(item.precio).toLocaleString('es-AR')}</p>
    </div>`
  ).join('');

  // Totales
  const formatted = `$${total.toLocaleString('es-AR')}`;
  document.querySelector('.summary-row span:last-child')?.setAttribute('data-total', total);
  document.querySelectorAll('.summary-row span:last-child').forEach(el => el.textContent = formatted);
  const totalEl = document.querySelector('.summary-total span:last-child');
  if (totalEl) totalEl.textContent = formatted;

  // Botón pagar
  const btn = document.getElementById('btn-pay');
  if (btn) btn.dataset.total = total;

  window._payTotal = total;
}

// ── Método de pago ────────────────────────────────────────────
function setupMethodSelector() {
  const radios     = document.querySelectorAll('input[name="metodo"]');
  const cardFields = document.getElementById('card-fields');

  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      const needsCard = ['debito', 'credito'].includes(radio.value);
      cardFields?.classList.toggle('visible', needsCard);
      validateForm();
    });
  });
}

// ── Validación del formulario ─────────────────────────────────
function setupCardInputs() {
  // Formateo automático del número de tarjeta
  const cardNum = document.getElementById('card-number');
  if (cardNum) {
    cardNum.addEventListener('input', () => {
      cardNum.value = cardNum.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
      validateForm();
    });
  }

  // Formateo de vencimiento MM/AA
  const expiry = document.getElementById('card-expiry');
  if (expiry) {
    expiry.addEventListener('input', () => {
      let v = expiry.value.replace(/\D/g, '');
      if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
      expiry.value = v;
      validateForm();
    });
  }

  ['card-cvv', 'card-name'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', validateForm);
  });
}

function validateForm() {
  const btn    = document.getElementById('btn-pay');
  if (!btn) return;

  const method = document.querySelector('input[name="metodo"]:checked');
  if (!method) { btn.disabled = true; return; }

  const needsCard = ['debito', 'credito'].includes(method.value);
  if (!needsCard) { btn.disabled = false; return; }

  const numOk  = (document.getElementById('card-number')?.value.replace(/\s/g, '').length || 0) >= 15;
  const expOk  = document.getElementById('card-expiry')?.value.length === 5;
  const cvvOk  = (document.getElementById('card-cvv')?.value.length  || 0) >= 3;
  const nameOk = document.getElementById('card-name')?.value.trim().length > 0;

  btn.disabled = !(numOk && expOk && cvvOk && nameOk);
}

// ── Botón pagar ───────────────────────────────────────────────
function setupPayButton() {
  const btn = document.getElementById('btn-pay');
  if (!btn) return;

  // Habilitar si método es transferencia (no requiere tarjeta)
  document.querySelector('input[name="metodo"]')?.dispatchEvent(new Event('change'));

  btn.addEventListener('click', () => {
    const layout = document.querySelector('.payment-layout');
    if (layout) {
      layout.innerHTML = `
        <div class="payment-success" style="grid-column:1/-1;">
          <div class="payment-success-icon">✅</div>
          <h2>¡Pago aprobado con éxito!</h2>
          <p>Tu compra fue procesada correctamente.<br>
             Recibirás un email de confirmación.</p>
          <a href="index.html" class="btn btn-primary btn-lg" style="margin-top:var(--sp-lg);">
            Seguir comprando
          </a>
        </div>`;
    }
  });
}