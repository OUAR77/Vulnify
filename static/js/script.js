// AUTH STATE
function applyAuth() {
  try {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const parsed = user ? JSON.parse(user) : null;
    const userName = parsed ? parsed.name : null;
    const role = parsed ? parsed.role : null;
    const loggedIn = !!(token && userName);

    // Desktop auth
    const auth = document.getElementById('headerAuth');
    const userDiv = document.getElementById('headerUser');
    const userNameEl = document.getElementById('headerUserName');
    if (auth) auth.style.display = loggedIn ? 'none' : '';
    if (userDiv) userDiv.style.display = loggedIn ? 'inline-flex' : 'none';
    if (userNameEl && userName) userNameEl.textContent = userName;

    // Mobile auth
    const mobileAuth = document.getElementById('mobileAuth');
    const mobileUser = document.getElementById('mobileUser');
    const mobileUserNameEl = document.getElementById('mobileUserName');
    if (mobileAuth) mobileAuth.style.display = loggedIn ? 'none' : '';
    if (mobileUser) mobileUser.style.display = loggedIn ? 'flex' : 'none';
    if (mobileUserNameEl && userName) mobileUserNameEl.textContent = userName;

    // Admin link in desktop nav
    if (loggedIn && role === 'admin') {
      const nav = document.querySelector('.nav');
      if (nav && !nav.querySelector('.admin-link')) {
        const link = document.createElement('a');
        link.className = 'nav-link admin-link';
        link.href = '/admin';
        link.textContent = 'Admin';
        nav.appendChild(link);
      }
      const mobileNav = document.getElementById('mobileNavLinks');
      if (mobileNav && !mobileNav.querySelector('.admin-link')) {
        const mlink = document.createElement('a');
        mlink.className = 'nav-link admin-link';
        mlink.href = '/admin';
        mlink.textContent = 'Admin';
        mobileNav.appendChild(mlink);
      }
    }

    // Dashboard page: show/hide dashUserName
    const dashUser = document.getElementById('dashUserName');
    if (dashUser && userName) {
      dashUser.style.display = '';
      dashUser.textContent = userName;
    }
  } catch(e) {
    // Ignore auth errors on page load
  }
}
applyAuth();
document.addEventListener('DOMContentLoaded', applyAuth);

// DARK MODE
var THEME_VARS = {
  dark:  ['#08080a','#111114','#0d0d10','#e8e5e0','#8a8780','#5c5a55','#1e1d1b','#2d2b28','#d4a853','rgba(212,168,83,0.06)','rgba(212,168,83,0.12)','rgba(212,168,83,0.08)','0 4px 24px rgba(0,0,0,0.5)','0 12px 48px rgba(0,0,0,0.6)'],
  light: ['#f8f7f5','#ffffff','#ffffff','#1a1816','#6e6b67','#9e9b97','#d6d3d0','#b8b5b0','#b8943f','rgba(184,148,63,0.06)','rgba(184,148,63,0.12)','rgba(184,148,63,0.08)','0 2px 12px rgba(0,0,0,0.04)','0 8px 32px rgba(0,0,0,0.06)']
};
var THEME_NAMES = ['--bg','--bg-card','--bg-surface','--text','--text-secondary','--text-tertiary','--border','--border-hover','--accent','--accent-light','--accent-mid','--accent-glow','--shadow','--shadow-lg'];

function setThemeVars(isDark) {
  var v = isDark ? THEME_VARS.dark : THEME_VARS.light;
  var h = document.documentElement;
  for (var i = 0; i < THEME_NAMES.length; i++) {
    h.style.setProperty(THEME_NAMES[i], v[i]);
  }
}
function updateThemeButtons(isDark) {
  document.querySelectorAll('.theme-btn, .theme-btn-mobile').forEach(function(b) {
    b.innerHTML = isDark
      ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
      : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    b.style.fontSize = '';
  });
}
function toggleTheme() {
  var html = document.documentElement;
  var isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  setThemeVars(!isDark);
  updateThemeButtons(!isDark);
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
}
function applyTheme() {
  try {
    var saved = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var useDark = saved ? saved === 'dark' : prefersDark;
    document.documentElement.setAttribute('data-theme', useDark ? 'dark' : 'light');
    setThemeVars(useDark);
    updateThemeButtons(useDark);
  } catch(e) { console.warn('applyTheme error:', e); }
}
applyTheme();
document.addEventListener('DOMContentLoaded', applyTheme);

// MOBILE MENU
function closeMobileMenu() {
  const btn = document.querySelector('.hamburger');
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.remove('open');
  if (btn) btn.classList.remove('open');
  document.body.classList.remove('menu-open');
}
function toggleMobileMenu() {
  const btn = document.querySelector('.hamburger');
  const menu = document.getElementById('mobileMenu');
  const header = document.querySelector('.header');
  if (!btn || !menu) return;
  const opening = !menu.classList.contains('open');
  btn.classList.toggle('open');
  menu.classList.toggle('open');
  document.body.classList.toggle('menu-open');
  if (opening && header) header.classList.add('scrolled');
  if (!opening) document.body.classList.remove('menu-open');
}
// Init: mobile menu + theme toggle in menu
document.addEventListener('DOMContentLoaded', function() {
  // Close mobile menu on nav link click, or tap background
  document.querySelectorAll('.mobile-menu .nav-link').forEach(function(link) {
    link.addEventListener('click', closeMobileMenu);
  });
  const mm = document.getElementById('mobileMenu');
  if (mm) {
    mm.addEventListener('click', function(e) {
      if (e.target === this) closeMobileMenu();
    });
    // Add theme toggle to mobile menu if not present
    if (!mm.querySelector('.theme-btn-mobile')) {
      var tb = document.createElement('button');
      tb.className = 'theme-btn-mobile';
      tb.onclick = toggleTheme;
      tb.title = 'Cambiar tema';
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      var tbIsDark = isDark;
      tb.innerHTML = tbIsDark
        ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
        : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
      tb.style.cssText = 'background:transparent;border:1px solid var(--border);border-radius:6px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;margin:8px 0;flex-shrink:0';
      var actions = mm.querySelector('.header-actions-mobile');
      if (actions) {
        actions.parentNode.insertBefore(tb, actions);
      } else {
        mm.appendChild(tb);
      }
    }
  }
});

// FAQ
function toggleFaq(btn) {
  btn.closest('.faq-item').classList.toggle('open');
}

// SMOOTH SCROLL
function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// API
const API = '/api';

async function apiCall(method, path, body, auth) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
  const res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json();
  if (!res.ok) {
    const msg = Array.isArray(data.detail) ? data.detail.map(e => e.msg).join('; ') : (data.detail || 'Error');
    throw new Error(msg);
  }
  return data;
}

async function loginUser(email, password) {
  const data = await apiCall('POST', '/auth/login', { email, password });
  localStorage.setItem('token', data.token);
  if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data;
}

async function registerUser(name, email, password, role) {
  const data = await apiCall('POST', '/auth/register', { name, email, password, role: role || 'hunter' });
  localStorage.setItem('token', data.token);
  if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data;
}

function isTokenExpired(token) {
  try {
    var payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch(e) { return true; }
}

async function getValidToken() {
  var token = localStorage.getItem('token');
  if (!token) return null;
  if (!isTokenExpired(token)) return token;
  var rt = localStorage.getItem('refresh_token');
  if (!rt) return null;
  try {
    var res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt })
    });
    if (!res.ok) return null;
    var data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      return data.token;
    }
    return null;
  } catch(e) {
    return null;
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  closeMobileMenu();
  window.location.href = '/';
}

// MODAL
function openModal(type) {
  const overlay = document.getElementById('modalOverlay');
  if (!overlay) return;
  overlay.classList.add('open');
  const params = new URLSearchParams(window.location.search);
  const resetToken = params.get('token');
  if (type === 'reset' || resetToken) type = 'reset';
  document.getElementById('modalBody').innerHTML =
    type === 'login'
      ? `<div class="modal-handle"></div>
         <h2 class="modal-title">Bienvenido de nuevo</h2>
         <p class="modal-desc">Accede a tu cuenta de Vulnify.</p>
         <form class="modal-form" id="loginForm">
           <input type="email" placeholder="Email" class="modal-input" id="loginEmail" required>
           <input type="password" placeholder="Contraseña" class="modal-input" id="loginPass" required>
           <p id="loginError" style="color:var(--accent);font-size:13px;display:none;"></p>
           <button type="submit" class="btn btn-accent" style="width:100%;justify-content:center;" id="loginBtn">Iniciar sesión</button>
           <p style="text-align:center;margin-top:8px;"><a onclick="openModal('forgot')" style="font-size:13px;color:var(--text-tertiary);cursor:pointer">¿Olvidaste tu contraseña?</a></p>
         </form>
         <p class="modal-footer-text">¿No tienes cuenta? <a onclick="openModal('register')">Regístrate</a></p>`
      : type === 'forgot'
      ? `<div class="modal-handle"></div>
         <h2 class="modal-title">Restablecer contraseña</h2>
         <p class="modal-desc">Te enviaremos un enlace para restablecer tu contraseña.</p>
         <form class="modal-form" id="forgotForm">
           <input type="email" placeholder="Tu email" class="modal-input" id="forgotEmail" required>
           <p id="forgotError" style="color:var(--accent);font-size:13px;display:none;"></p>
           <button type="submit" class="btn btn-accent" style="width:100%;justify-content:center;" id="forgotBtn">Enviar enlace</button>
         </form>
         <p class="modal-footer-text"><a onclick="openModal('login')" style="cursor:pointer">Volver a iniciar sesión</a></p>`
      : type === 'reset'
      ? `<div class="modal-handle"></div>
         <h2 class="modal-title">Nueva contraseña</h2>
         <p class="modal-desc">Elige una contraseña segura para tu cuenta.</p>
         <form class="modal-form" id="resetForm">
           <input type="password" placeholder="Nueva contraseña" class="modal-input" id="resetPass" required minlength="8">
           <input type="password" placeholder="Confirmar contraseña" class="modal-input" id="resetPass2" required>
           <p id="resetError" style="color:var(--accent);font-size:13px;display:none;"></p>
           <button type="submit" class="btn btn-accent" style="width:100%;justify-content:center;" id="resetBtn">Restablecer</button>
         </form>`
      : `<div class="modal-handle"></div>
         <h2 class="modal-title">Crear cuenta</h2>
         <p class="modal-desc">Únete a la comunidad de bug bounty española.</p>
         <form class="modal-form" id="registerForm">
           <input type="text" placeholder="Nombre completo" class="modal-input" id="regName" required>
           <input type="email" placeholder="Email" class="modal-input" id="regEmail" required>
           <input type="password" placeholder="Contraseña" class="modal-input" id="regPass" required minlength="6">
           <input type="password" placeholder="Confirmar contraseña" class="modal-input" id="regPass2" required>
           <select class="modal-input" id="regRole" style="padding:12px 14px;">
             <option value="hunter">Hunter (cazador de bugs)</option>
             <option value="company">🏢 Empresa</option>
           </select>
           <p id="regError" style="color:var(--accent);font-size:13px;display:none;"></p>
           <button type="submit" class="btn btn-accent" style="width:100%;justify-content:center;" id="regBtn">Crear cuenta</button>
         </form>
         <p class="modal-footer-text">¿Ya tienes cuenta? <a onclick="openModal('login')">Inicia sesión</a></p>`;

  setTimeout(() => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('loginBtn');
        const err = document.getElementById('loginError');
        btn.textContent = 'Entrando...'; btn.style.opacity = '0.7'; err.style.display = 'none';
        try {
          await loginUser(document.getElementById('loginEmail').value, document.getElementById('loginPass').value);
          closeModal(); showToast('Sesión iniciada correctamente');
          const role = JSON.parse(localStorage.getItem('user')).role;
          const dest = role === 'admin' ? '/admin' : role === 'company' ? '/company' : '/dashboard';
          setTimeout(() => window.location.href = dest, 800);
        } catch (e) {
          err.textContent = e.message; err.style.display = 'block';
          btn.textContent = 'Iniciar sesión'; btn.style.opacity = '1';
        }
      });
    }
    const regForm = document.getElementById('registerForm');
    if (regForm) {
      regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('regBtn');
        const err = document.getElementById('regError');
        btn.textContent = 'Creando cuenta...'; btn.style.opacity = '0.7'; err.style.display = 'none';
        const pass = document.getElementById('regPass').value;
        const pass2 = document.getElementById('regPass2').value;
        if (pass !== pass2) { err.textContent = 'Las contraseñas no coinciden'; err.style.display = 'block'; return; }
        try {
          const role = document.getElementById('regRole').value;
          await registerUser(
            document.getElementById('regName').value,
            document.getElementById('regEmail').value,
            pass,
            role
          );
          closeModal(); showToast('Cuenta creada correctamente');
          const dest = role === 'company' ? '/company' : '/dashboard';
          setTimeout(() => window.location.href = dest, 800);
        } catch (e) {
          err.textContent = e.message; err.style.display = 'block';
          btn.textContent = 'Crear cuenta'; btn.style.opacity = '1';
        }
      });
    }
    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
      forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('forgotBtn');
        const err = document.getElementById('forgotError');
        btn.textContent = 'Enviando...'; btn.disabled = true; err.style.display = 'none';
        try {
          const data = await apiCall('POST', '/auth/forgot-password', { email: document.getElementById('forgotEmail').value });
          closeModal();
          if (data.reset_token) {
            const link = `${window.location.origin}/reset-password?token=${data.reset_token}`;
            showToast('Enlace generado: ' + link);
          } else {
            showToast('Revisa tu email para restablecer la contraseña');
          }
        } catch (e) {
          err.textContent = e.message; err.style.display = 'block';
          btn.textContent = 'Enviar enlace'; btn.disabled = false;
        }
      });
    }
    const resetForm = document.getElementById('resetForm');
    if (resetForm) {
      resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('resetBtn');
        const err = document.getElementById('resetError');
        const pass = document.getElementById('resetPass').value;
        const pass2 = document.getElementById('resetPass2').value;
        if (pass !== pass2) { err.textContent = 'Las contraseñas no coinciden'; err.style.display = 'block'; return; }
        btn.textContent = 'Restableciendo...'; btn.disabled = true; err.style.display = 'none';
        try {
          const params = new URLSearchParams(window.location.search);
          const token = params.get('token');
          await apiCall('POST', '/auth/reset-password', { token, password: pass });
          closeModal(); showToast('Contraseña restablecida correctamente');
          const url = new URL(window.location.href);
          url.searchParams.delete('token');
          window.history.replaceState({}, '', url);
        } catch (e) {
          err.textContent = e.message; err.style.display = 'block';
          btn.textContent = 'Restablecer'; btn.disabled = false;
        }
      });
    }
  }, 50);
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.classList.remove('open');
}

const modalOverlay = document.getElementById('modalOverlay');
if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
}

// TOAST
function showToast(msg, type) {
  var t = document.getElementById('toast');
  if (!t) return;
  var icon = '';
  if (type === 'success') icon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>';
  else if (type === 'error') icon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
  t.innerHTML = icon + '<span>' + msg + '</span>';
  t.className = 'toast open' + (type ? ' toast-' + type : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(function(){ t.classList.remove('open'); }, 3500);
}

// SCROLL REVEAL
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  },
  { threshold: 0.08 }
);
reveals.forEach((el) => revealObserver.observe(el));

// HEADER SCROLL
const header = document.querySelector('.header');
if (header) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > 20);
        ticking = false;
      });
      ticking = true;
    }
  });
}

// FEATURE CARDS STAGGERED
const featureCards = document.querySelectorAll('.feature-card');
const cardObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const delay = parseInt(e.target.dataset.delay) || 0;
        setTimeout(() => e.target.classList.add('visible'), delay);
        cardObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.1 }
);
featureCards.forEach((el) => cardObserver.observe(el));

// ANIMATED COUNTERS
const counters = document.querySelectorAll('.stat-counter-num');
const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const el = e.target;
        const target = parseInt(el.dataset.target);
        let current = 0;
        const step = Math.max(1, Math.floor(target / 40));
        const interval = setInterval(() => {
          current += step;
          if (current >= target) {
            el.textContent = target + (target >= 1000 ? '' : '');
            clearInterval(interval);
          } else {
            el.textContent = current;
          }
        }, 30);
        counterObserver.unobserve(el);
      }
    });
  },
  { threshold: 0.5 }
);
counters.forEach((el) => counterObserver.observe(el));

// ACTIVITY BARS
const barsContainer = document.getElementById('activityBars');
if (barsContainer) {
  const heights = [15, 30, 20, 45, 25, 60, 35, 70, 40, 55, 30, 75, 45, 65, 50, 40, 80, 60, 45, 55, 70, 90];
  heights.forEach((h, i) => {
    const bar = document.createElement('div');
    bar.className = 'stats-bar' + (i === heights.length - 1 ? ' active' : '');
    bar.style.height = h + '%';
    barsContainer.appendChild(bar);
  });
}

// LIVE REPORTS
const reports = [
  { name: 'SQL Injection — /api/users', sev: 'critical', label: 'Crítico' },
  { name: 'IDOR — /api/orders', sev: 'high', label: 'Alto' },
  { name: 'XSS — /search?q=', sev: 'medium', label: 'Medio' },
  { name: 'SSRF — /api/fetch', sev: 'critical', label: 'Crítico' },
  { name: 'Auth Bypass — /admin', sev: 'high', label: 'Alto' },
  { name: 'RCE — /api/exec', sev: 'critical', label: 'Crítico' },
  { name: 'Open Redirect — /login', sev: 'low', label: 'Bajo' },
];

const reportList = document.getElementById('reportList');
const reportCount = document.getElementById('reportCount');

let ri = 0;
if (reportList && reportCount) {
  setInterval(() => {
    const r = reports[ri++ % reports.length];
    const el = document.createElement('div');
    el.className = 'mw-report';
    el.style.animation = 'fadeUp 0.3s ease';
    const color = r.sev === 'critical' ? '#dc2626' : r.sev === 'high' ? '#ef4444' : r.sev === 'medium' ? '#f59e0b' : '#22c55e';
    el.innerHTML = `
      <span class="mw-dot" style="background:${color}"></span>
      <span class="mw-name">${r.name}</span>
      <span class="mw-badge" style="color:${color};background:${color}15">${r.label}</span>`;
    reportList.insertBefore(el, reportList.firstChild);
    if (reportList.children.length > 4) reportList.removeChild(reportList.lastChild);
    reportCount.textContent = parseInt(reportCount.textContent) + 1;
  }, 4000);
}

// HUNTER COUNT
const hunterCount = document.getElementById('hunterCount');
if (hunterCount) {
  setInterval(() => {
    const cur = parseInt(hunterCount.textContent);
    const delta = Math.random() > 0.5 ? 1 : -1;
    hunterCount.textContent = Math.max(40, Math.min(60, cur + delta));
  }, 3000);
}

// BACK TO TOP
const backTop = document.getElementById('backTop');
if (backTop) {
  backTop.addEventListener('click', () => {
    window.scroll({ top: 0, behavior: 'smooth' });
  });
}

// HOW IT WORKS TABS
const howStepsData = {
  hunters: [
    { num: '1', title: 'Crea tu cuenta', desc: 'Regístrate como hunter y completa tu perfil con tus skills.' },
    { num: '2', title: 'Elige un programa', desc: 'Explora los programas activos y selecciona el que más te interese.' },
    { num: '3', title: 'Encuentra bugs', desc: 'Analiza, prueba y documenta las vulnerabilidades que descubras.' },
    { num: '4', title: 'Cobra tu recompensa', desc: 'Reporta el bug, recibe validación y cobra en 24 horas.' },
  ],
  empresas: [
    { num: '1', title: 'Publica tu programa', desc: 'Define el scope, las recompensas y las reglas en 10 minutos.' },
    { num: '2', title: 'Recibe reportes', desc: 'Hunters verificados analizan tu producto en busca de fallos.' },
    { num: '3', title: 'Valida y prioriza', desc: 'Revisa los reportes con CVSS, evidencias y pasos para reproducir.' },
    { num: '4', title: 'Paga solo por bugs', desc: 'Solo pagas por vulnerabilidades válidas. Sin sorpresas.' },
  ],
};

function switchHowTab(tab) {
  document.querySelectorAll('.how-tab').forEach((t) => t.classList.remove('active'));
  document.getElementById(tab === 'hunters' ? 'tabHunters' : 'tabEmpresas').classList.add('active');
  const container = document.getElementById('howSteps');
  const data = howStepsData[tab];
  container.innerHTML = data
    .map(
      (s) => `
    <div class="how-step">
      <div class="how-step-num">${s.num}</div>
      <h3>${s.title}</h3>
      <p>${s.desc}</p>
    </div>`
    )
    .join('');
}

// AUTO-OPEN RESET MODAL IF TOKEN IN URL
(function checkResetToken() {
  const p = new URLSearchParams(window.location.search);
  if (p.get('token')) {
    setTimeout(() => openModal('reset'), 300);
  }
})();
