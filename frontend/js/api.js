const API_BASE = 'http://localhost:4000';

const Api = {

  // ── Token / Sesión ──────────────────────────────────────
  getToken()        { return localStorage.getItem('token'); },
  setToken(t)       { localStorage.setItem('token', t); },
  removeToken()     { localStorage.removeItem('token'); },

  getUser()         { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; },
  setUser(u)        { localStorage.setItem('user', JSON.stringify(u)); },
  removeUser()      { localStorage.removeItem('user'); },

  isLoggedIn()      { return !!this.getToken(); },
  isAdmin()         { const u = this.getUser(); return u && u.rol === 'admin'; },

  // ── Fetch genérico ──────────────────────────────────────
  async request(method, endpoint, body = null, requiresAuth = true) {
    const headers = { 'Content-Type': 'application/json' };

    if (requiresAuth) {
      const token = this.getToken();
      if (token) headers['Authorization'] = token;
    }

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const res  = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || data.error || `Error ${res.status}`);
    }
    if (data.codigo !== undefined && data.codigo !== 200) {
      throw new Error(data.mensaje || data.error || `Error código ${data.codigo}`);
    }
    return data;
  },

  get(endpoint, requiresAuth = true)       { return this.request('GET',    endpoint, null, requiresAuth); },
  post(endpoint, body, requiresAuth = true) { return this.request('POST',   endpoint, body, requiresAuth); },
  put(endpoint, body)                       { return this.request('PUT',    endpoint, body, true); },
  delete(endpoint, body)                    { return this.request('DELETE', endpoint, body, true); },

  CUOTA_RATES: { 1: 1, 3: 1, 6: 1.15, 9: 1.18, 12: 1.22 },

  calcularTotalConCuotas(precioBase, n) {
    return Math.ceil(precioBase * (this.CUOTA_RATES[n] || 1));
  },

  calcularValorCuota(precioBase, n) {
    return Math.ceil(this.calcularTotalConCuotas(precioBase, n) / n);
  },
};