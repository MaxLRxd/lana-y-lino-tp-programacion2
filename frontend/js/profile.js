// ============================================================
//  PROFILE — profile.html
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  if (!Api.isLoggedIn()) { window.location.href = 'login.html'; return; }
  await loadProfile();
  setupProfileForm();
  setupPasswordForm();
});

// ── Carga de datos desde la BD ───────────────────────────────
async function loadProfile() {
  const user = Api.getUser();
  try {
    const res  = await Api.get(`/api/obtenerDatosUsuario/${user.id}`);
    const data = res.payload?.[0] ?? res;
    fillForm(data);
    Api.setUser({ ...user, ...data });
  } catch {
    fillForm(user);
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

  const avatar = document.querySelector('.profile-avatar');
  if (avatar) {
    avatar.textContent = ((data.nombre || '?')[0] + ((data.apellido || '')[0] || '')).toUpperCase();
  }

  const nameEl  = document.querySelector('.profile-info-name');
  const emailEl = document.querySelector('.profile-info-email');
  if (nameEl)  nameEl.textContent  = `${data.nombre || ''} ${data.apellido || ''}`.trim();
  if (emailEl) emailEl.textContent = data.email || '';
}

// ── Formulario de datos personales ───────────────────────────
function setupProfileForm() {
  const form = document.querySelector('.profile-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = Api.getUser();

    const body = {
      nombre:    document.getElementById('pf-nombre')?.value.trim(),
      apellido:  document.getElementById('pf-apellido')?.value.trim(),
      email:     document.getElementById('pf-email')?.value.trim(),
      telefono:  document.getElementById('pf-telefono')?.value.trim(),
      direccion: document.getElementById('pf-direccion')?.value.trim(),
      rol:       user.rol      || 'usuario',
      password:  user.password || '',
    };

    const btn = form.querySelector('button[type="submit"]');
    try {
      btn.disabled = true; btn.textContent = 'Guardando...';
      await Api.post(`/api/modificarUsuario/${user.id}`, body);
      Api.setUser({ ...user, ...body });
      fillForm(body);
      showToast('Datos actualizados correctamente ✓', 'success');
    } catch (err) {
      showToast(err.message || 'Error al guardar los datos', 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Guardar cambios';
    }
  });

  document.getElementById('btn-cancelar-perfil')?.addEventListener('click', () => loadProfile());
}

// ── Formulario de cambio de contraseña ───────────────────────
function setupPasswordForm() {
  const toggleBtn = document.getElementById('btn-toggle-password');
  const cancelBtn = document.getElementById('btn-cancelar-pass');
  const passForm  = document.getElementById('password-form');
  if (!toggleBtn || !passForm) return;

  // Mostrar / ocultar el formulario
  toggleBtn.addEventListener('click', () => {
    const visible = passForm.style.display !== 'none';
    passForm.style.display = visible ? 'none' : 'flex';
    toggleBtn.textContent  = visible ? 'Cambiar contraseña' : 'Cancelar';
    if (!visible) document.getElementById('pf-pass-actual')?.focus();
  });

  // Botón cancelar dentro del form
  cancelBtn?.addEventListener('click', () => {
    passForm.style.display = 'none';
    toggleBtn.textContent  = 'Cambiar contraseña';
    passForm.reset();
    clearPassError();
  });

  // Submit contraseña
  passForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearPassError();

    const user     = Api.getUser();
    const actual   = document.getElementById('pf-pass-actual')?.value;
    const nueva    = document.getElementById('pf-pass-nueva')?.value;
    const confirma = document.getElementById('pf-pass-confirm')?.value;

    // Validaciones
    if (!actual || !nueva || !confirma) {
      showPassError('Completá todos los campos');
      return;
    }

    // Verificar contraseña actual contra la guardada en localStorage (texto plano, igual que la BD)
    if (actual !== user.password) {
      showPassError('La contraseña actual es incorrecta');
      document.getElementById('pf-pass-actual').value = '';
      document.getElementById('pf-pass-actual').focus();
      return;
    }

    if (nueva.length < 8) {
      showPassError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (nueva === actual) {
      showPassError('La nueva contraseña debe ser diferente a la actual');
      return;
    }
    if (nueva !== confirma) {
      showPassError('Las contraseñas no coinciden');
      return;
    }

    const btn = document.getElementById('btn-guardar-pass');
    try {
      btn.disabled = true; btn.textContent = 'Guardando...';

      await Api.post(`/api/modificarUsuario/${user.id}`, {
        nombre:    user.nombre    || '',
        apellido:  user.apellido  || '',
        email:     user.email     || '',
        telefono:  user.telefono  || '',
        direccion: user.direccion || '',
        rol:       user.rol       || 'usuario',
        password:  nueva,
      });

      // Actualizar contraseña en localStorage
      Api.setUser({ ...user, password: nueva });

      showToast('Contraseña actualizada correctamente ✓', 'success');
      passForm.reset();
      passForm.style.display = 'none';
      toggleBtn.textContent  = 'Cambiar contraseña';
    } catch (err) {
      showPassError(err.message || 'Error al cambiar la contraseña');
    } finally {
      btn.disabled = false; btn.textContent = 'Guardar contraseña';
    }
  });
}

function showPassError(msg) {
  let el = document.getElementById('pass-error');
  if (!el) {
    el = document.createElement('div');
    el.id        = 'pass-error';
    el.className = 'alert alert-error';
    document.getElementById('password-form')?.prepend(el);
  }
  el.textContent = msg;
}

function clearPassError() {
  document.getElementById('pass-error')?.remove();
}