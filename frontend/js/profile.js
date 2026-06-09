// ============================================================
//  PROFILE — profile.html
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  if (!Api.isLoggedIn()) { window.location.href = 'login.html'; return; }
  await loadProfile();
  setupProfileForm();
});

async function loadProfile() {
  const user = Api.getUser();
  try {
    const res  = await Api.get(`/api/obtenerDatosUsuario/${user.id}`);
    const data = res.payload?.[0] || {};
    fillForm(data);
    Api.setUser({ ...user, ...data });
  } catch {
    fillForm(user); // fallback a datos locales
  }
}

function fillForm(data) {
  const map = {
    'pf-nombre':    data.nombre    || '',
    'pf-apellido':  data.apellido  || '',
    'pf-email':     data.email     || '',
    'pf-telefono':  data.telefono  || '',
    'pf-direccion': data.direccion || '',
  };
  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });

  // Avatar
  const avatar = document.querySelector('.profile-avatar');
  if (avatar) {
    avatar.textContent =
      `${(data.nombre || '?')[0]}${(data.apellido || '')[0] || ''}`.toUpperCase();
  }

  // Nombre y email visibles
  const nameDisplay  = document.querySelector('.profile-info-name');
  const emailDisplay = document.querySelector('.profile-info-email');
  if (nameDisplay)  nameDisplay.textContent  = `${data.nombre || ''} ${data.apellido || ''}`.trim();
  if (emailDisplay) emailDisplay.textContent = data.email || '';
}

function setupProfileForm() {
  const form = document.querySelector('.profile-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user     = Api.getUser();
    const newPass  = document.getElementById('pf-pass-nueva')?.value;
    const confPass = document.getElementById('pf-pass-confirm')?.value;

    if (newPass && newPass !== confPass) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }

    const body = {
      nombre:    document.getElementById('pf-nombre')?.value.trim(),
      apellido:  document.getElementById('pf-apellido')?.value.trim(),
      email:     document.getElementById('pf-email')?.value.trim(),
      telefono:  document.getElementById('pf-telefono')?.value.trim(),
      direccion: document.getElementById('pf-direccion')?.value.trim(),
      rol:       user.rol || 'usuario',
    };
    if (newPass) body.password = newPass;

    const btn = form.querySelector('button[type="submit"]');
    try {
      btn.disabled = true; btn.textContent = 'Guardando...';
      await Api.post(`/api/modificarUsuario/${user.id}`, body);
      Api.setUser({ ...user, ...body });
      fillForm(body);
      showToast('Datos actualizados correctamente ✓', 'success');

      // Limpiar campos de contraseña
      ['pf-pass-actual', 'pf-pass-nueva', 'pf-pass-confirm'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
    } catch (err) {
      showToast(err.message || 'Error al guardar los datos', 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Guardar cambios';
    }
  });

  // Cancelar
  form.querySelector('.btn-ghost')?.addEventListener('click', () => loadProfile());
}