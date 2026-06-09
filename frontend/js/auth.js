// ============================================================
//  AUTH — login.html y register.html
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

  // ── LOGIN ────────────────────────────────────────────────
  if (document.getElementById('login-email')) {
    const form = document.querySelector('.auth-form');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFormError(form);

      const usuario  = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      if (!usuario || !password) {
        setFormError(form, 'Completá todos los campos');
        return;
      }

      setLoading(form, true, 'Iniciando sesión...');
      try {
        const res = await Api.post('/api/login', { email: usuario, password }, false);
        console.log('Login response:', res);

        if (!res.jwt || res.codigo !== 200) {
          throw new Error(res.mensaje || 'Email o contraseña incorrectos');
        }

        const userData = res.payload?.[0] ?? { email: usuario, rol: 'usuario' };
        Api.setToken(res.jwt);
        Api.setUser({ ...userData, id: userData.id_usuario });

        window.location.href = 'index.html';
      } catch (err) {
        setFormError(form, err.message || 'Email o contraseña incorrectos');
      } finally {
        setLoading(form, false, 'Iniciar sesión');
      }
    });
  }

  // ── REGISTER ─────────────────────────────────────────────
  if (document.getElementById('reg-email')) {
    const form = document.querySelector('.auth-form');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFormError(form);

      const nombre    = document.getElementById('reg-nombre').value.trim();
      const apellido  = document.getElementById('reg-apellido').value.trim();
      const email     = document.getElementById('reg-email').value.trim();
      const telefono  = document.getElementById('reg-telefono').value.trim();
      const direccion = document.getElementById('reg-direccion').value.trim();
      const password  = document.getElementById('reg-password').value;
      const password2 = document.getElementById('reg-password2').value;

      if (!nombre || !apellido || !email || !telefono || !direccion || !password) {
        setFormError(form, 'Completá todos los campos');
        return;
      }
      if (password !== password2) {
        setFormError(form, 'Las contraseñas no coinciden');
        return;
      }
      if (password.length < 8) {
        setFormError(form, 'La contraseña debe tener al menos 8 caracteres');
        return;
      }

      setLoading(form, true, 'Creando cuenta...');
      try {
        await Api.post('/api/registrarUsuario', {
          nombre, apellido, email, telefono, direccion,
          password, rol: 'usuario',
        }, false);

        showToast('Cuenta creada. ¡Ya podés iniciar sesión!', 'success');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
      } catch (err) {
        setFormError(form, err.message || 'Error al crear la cuenta');
      } finally {
        setLoading(form, false, 'Crear cuenta');
      }
    });
  }
});

// ── Helpers de formulario ───────────────────────────────────
function setFormError(form, msg) {
  let el = form.querySelector('.form-alert-error');
  if (!el) {
    el = document.createElement('div');
    el.className = 'alert alert-error form-alert-error';
    form.prepend(el);
  }
  el.textContent = msg;
}

function clearFormError(form) {
  form.querySelector('.form-alert-error')?.remove();
}

function setLoading(form, loading, label) {
  const btn = form.querySelector('button[type="submit"]');
  if (!btn) return;
  btn.disabled    = loading;
  btn.textContent = label;
}