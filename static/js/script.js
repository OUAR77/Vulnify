// AUTH STATE
const AUTH_KEY = 'vulnify_token';

function getAuthToken() {
  return localStorage.getItem(AUTH_KEY) || localStorage.getItem('token');
}

function applyAuth() {
  try {
    const token = getAuthToken();
    const user = localStorage.getItem('user');
    const parsed = user ? JSON.parse(user) : null;
    const userName = parsed ? parsed.name : null;
    const loggedIn = !!(token && userName);

    const auth = document.getElementById('headerAuth');
    const userDiv = document.getElementById('headerUser');
    const userNameEl = document.getElementById('headerUserName');
    if (auth) auth.style.display = loggedIn ? 'none' : '';
    if (userDiv) userDiv.style.display = loggedIn ? '' : 'none';
    if (userNameEl && userName) userNameEl.textContent = userName;

    const mobileAuth = document.getElementById('mobileAuth');
    const mobileUser = document.getElementById('mobileUser');
    const mobileUserNameEl = document.getElementById('mobileUserName');
    if (mobileAuth) mobileAuth.style.display = loggedIn ? 'none' : '';
    if (mobileUser) mobileUser.style.display = loggedIn ? '' : 'none';
    if (mobileUserNameEl && userName) mobileUserNameEl.textContent = userName;
  } catch(e) {}
}
applyAuth();
document.addEventListener('DOMContentLoaded', applyAuth);

// API
const API = '/api';

async function apiCall(method, path, body, auth) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = `Bearer ${getAuthToken()}`;
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
  localStorage.setItem(AUTH_KEY, data.token);
  localStorage.setItem('token', data.token);
  if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data;
}

async function registerUser(name, email, password, role) {
  const data = await apiCall('POST', '/auth/register', { name, email, password, role: role || 'hunter' });
  localStorage.setItem(AUTH_KEY, data.token);
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
  var token = getAuthToken();
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
      localStorage.setItem(AUTH_KEY, data.token);
      localStorage.setItem('token', data.token);
      return data.token;
    }
    return null;
  } catch(e) { return null; }
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  closeMobileMenu();
  window.location.href = '/';
}

// MOBILE MENU
function closeMobileMenu() {
  const btn = document.querySelector('.hamburger') || document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.remove('open');
  if (btn) btn.classList.remove('open');
  document.body.classList.remove('menu-open');
}

// FAQ
function toggleFaq(btn) {
  btn.closest('.faq-item').classList.toggle('open');
}

// TOAST
function showToast(msg, type) {
  var t = document.getElementById('toast');
  if (!t) return;
  var icon = '';
  if (type === 'success') icon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#c9a84c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>';
  else if (type === 'error') icon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
  t.innerHTML = icon + '<span>' + msg + '</span>';
  t.className = 'toast open' + (type ? ' toast-' + type : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(function(){ t.classList.remove('open'); }, 3500);
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
           <input type="email" placeholder="Email" id="loginEmail" required>
           <input type="password" placeholder="Contraseña" id="loginPass" required>
           <p id="loginError" style="color:var(--accent);font-size:13px;display:none;"></p>
           <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center" id="loginBtn"><span>Iniciar sesión</span></button>
           <p style="text-align:center;margin-top:8px"><a onclick="openModal('forgot')" style="font-size:13px;color:var(--text-tertiary);cursor:pointer">¿Olvidaste tu contraseña?</a></p>
         </form>
         <p class="modal-footer-text">¿No tienes cuenta? <a onclick="openModal('register')">Regístrate</a></p>`
      : type === 'forgot'
      ? `<div class="modal-handle"></div>
         <h2 class="modal-title">Restablecer contraseña</h2>
         <p class="modal-desc">Te enviaremos un enlace para restablecer tu contraseña.</p>
         <form class="modal-form" id="forgotForm">
           <input type="email" placeholder="Tu email" id="forgotEmail" required>
           <p id="forgotError" style="color:var(--accent);font-size:13px;display:none;"></p>
           <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center" id="forgotBtn"><span>Enviar enlace</span></button>
         </form>
         <p class="modal-footer-text"><a onclick="openModal('login')" style="cursor:pointer">Volver a iniciar sesión</a></p>`
      : type === 'reset'
      ? `<div class="modal-handle"></div>
         <h2 class="modal-title">Nueva contraseña</h2>
         <p class="modal-desc">Elige una contraseña segura para tu cuenta.</p>
         <form class="modal-form" id="resetForm">
           <input type="password" placeholder="Nueva contraseña" id="resetPass" required minlength="8">
           <input type="password" placeholder="Confirmar contraseña" id="resetPass2" required>
           <p id="resetError" style="color:var(--accent);font-size:13px;display:none;"></p>
           <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center" id="resetBtn"><span>Restablecer</span></button>
         </form>`
      : `<div class="modal-handle"></div>
         <h2 class="modal-title">Crear cuenta</h2>
         <p class="modal-desc">Únete a Vulnify y transforma tu negocio con IA.</p>
         <form class="modal-form" id="registerForm">
           <input type="text" placeholder="Nombre completo" id="regName" required>
           <input type="email" placeholder="Email" id="regEmail" required>
           <input type="password" placeholder="Contraseña" id="regPass" required minlength="8">
           <input type="password" placeholder="Confirmar contraseña" id="regPass2" required>
           <p id="regError" style="color:var(--accent);font-size:13px;display:none;"></p>
           <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center" id="regBtn"><span>Crear cuenta</span></button>
         </form>
         <p class="modal-footer-text">¿Ya tienes cuenta? <a onclick="openModal('login')">Inicia sesión</a></p>`;

  setTimeout(() => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('loginBtn');
        const err = document.getElementById('loginError');
        btn.innerHTML = '<span>Entrando...</span>'; btn.style.opacity = '0.7'; err.style.display = 'none';
        try {
          await loginUser(document.getElementById('loginEmail').value, document.getElementById('loginPass').value);
          closeModal(); showToast('Sesión iniciada correctamente', 'success');
          const role = JSON.parse(localStorage.getItem('user')).role;
          const dest = role === 'admin' ? '/admin' : role === 'company' ? '/company' : '/dashboard';
          setTimeout(() => window.location.href = dest, 800);
        } catch (e) {
          err.textContent = e.message; err.style.display = 'block';
          btn.innerHTML = '<span>Iniciar sesión</span>'; btn.style.opacity = '1';
        }
      });
    }
    const regForm = document.getElementById('registerForm');
    if (regForm) {
      regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('regBtn');
        const err = document.getElementById('regError');
        btn.innerHTML = '<span>Creando cuenta...</span>'; btn.style.opacity = '0.7'; err.style.display = 'none';
        const pass = document.getElementById('regPass').value;
        const pass2 = document.getElementById('regPass2').value;
        if (pass !== pass2) { err.textContent = 'Las contraseñas no coinciden'; err.style.display = 'block'; btn.innerHTML = '<span>Crear cuenta</span>'; btn.style.opacity = '1'; return; }
        try {
          await registerUser(
            document.getElementById('regName').value,
            document.getElementById('regEmail').value,
            pass,
            'hunter'
          );
          closeModal(); showToast('Cuenta creada correctamente', 'success');
          setTimeout(() => window.location.href = '/dashboard', 800);
        } catch (e) {
          err.textContent = e.message; err.style.display = 'block';
          btn.innerHTML = '<span>Crear cuenta</span>'; btn.style.opacity = '1';
        }
      });
    }
    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
      forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('forgotBtn');
        const err = document.getElementById('forgotError');
        btn.innerHTML = '<span>Enviando...</span>'; btn.disabled = true; err.style.display = 'none';
        try {
          const data = await apiCall('POST', '/auth/forgot-password', { email: document.getElementById('forgotEmail').value });
          closeModal();
          if (data.reset_token) {
            showToast('Enlace generado: ' + data.reset_token, 'success');
          } else {
            showToast('Revisa tu email', 'success');
          }
        } catch (e) {
          err.textContent = e.message; err.style.display = 'block';
          btn.innerHTML = '<span>Enviar enlace</span>'; btn.disabled = false;
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
        btn.innerHTML = '<span>Restableciendo...</span>'; btn.disabled = true; err.style.display = 'none';
        try {
          const params = new URLSearchParams(window.location.search);
          const token = params.get('token');
          await apiCall('POST', '/auth/reset-password', { token, password: pass });
          closeModal(); showToast('Contraseña restablecida', 'success');
          const url = new URL(window.location.href);
          url.searchParams.delete('token');
          window.history.replaceState({}, '', url);
        } catch (e) {
          err.textContent = e.message; err.style.display = 'block';
          btn.innerHTML = '<span>Restablecer</span>'; btn.disabled = false;
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

// AUTO-OPEN RESET MODAL
(function checkResetToken() {
  const p = new URLSearchParams(window.location.search);
  if (p.get('token')) {
    setTimeout(() => openModal('reset'), 300);
  }
})();

// ===== ANIMATIONS =====

// Scroll Reveal
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);
revealEls.forEach((el) => revealObserver.observe(el));

// Animated Counters
const counters = document.querySelectorAll('.stat-counter');
const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const el = e.target;
        const target = parseInt(el.dataset.target);
        let current = 0;
        const step = Math.max(1, Math.floor(target / 50));
        const interval = setInterval(() => {
          current += step;
          if (current >= target) {
            el.textContent = target;
            clearInterval(interval);
          } else {
            el.textContent = current;
          }
        }, 25);
        counterObserver.unobserve(el);
      }
    });
  },
  { threshold: 0.5 }
);
counters.forEach((el) => counterObserver.observe(el));

// Header Scroll Effect
const header = document.querySelector('.header');
if (header) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > 60);
        ticking = false;
      });
      ticking = true;
    }
  });
}

// Hamburger Menu Toggle
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
if (menuToggle && mobileMenu) {
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('open');
    mobileMenu.classList.toggle('open');
    document.body.classList.toggle('menu-open');
  });
  // Close on nav-link click
  mobileMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.classList.remove('menu-open');
    });
  });
}

// Active nav link highlighting
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');
if (sections.length > 0) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
          });
        }
      });
    },
    { threshold: 0.3 }
  );
  sections.forEach(s => navObserver.observe(s));
}
