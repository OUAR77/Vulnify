// AUTH STATE (runs on every page)
(function checkAuth() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  const auth = document.getElementById('headerAuth');
  const userDiv = document.getElementById('headerUser');
  const userName = document.getElementById('headerUserName');
  if (token && user && auth && userDiv && userName) {
    auth.style.display = 'none';
    userDiv.style.display = 'inline-flex';
    userName.textContent = JSON.parse(user).name;
    const role = JSON.parse(user).role;
    const nav = document.querySelector('.nav');
    if (role === 'admin' && nav && !nav.querySelector('.admin-link')) {
      const link = document.createElement('a');
      link.className = 'nav-link admin-link';
      link.href = '/admin';
      link.textContent = 'Admin';
      nav.appendChild(link);
    }
  }
})();

// DARK MODE
function toggleTheme() {
  const html = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  btn.textContent = isDark ? '🌙' : '☀️';
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
}

(function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const useDark = saved ? saved === 'dark' : prefersDark;
  if (useDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = '☀️';
  }
})();

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
  if (!res.ok) throw new Error(data.detail || 'Error');
  return data;
}

async function loginUser(email, password) {
  const data = await apiCall('POST', '/auth/login', { email, password });
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data;
}

async function registerUser(name, email, password, role) {
  const data = await apiCall('POST', '/auth/register', { name, email, password, role: role || 'hunter' });
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

// MODAL
function openModal(type) {
  const overlay = document.getElementById('modalOverlay');
  if (!overlay) return;
  overlay.classList.add('open');
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
         </form>
         <p class="modal-footer-text">¿No tienes cuenta? <a onclick="openModal('register')">Regístrate</a></p>`
      : `<div class="modal-handle"></div>
         <h2 class="modal-title">Crear cuenta</h2>
         <p class="modal-desc">Únete a la comunidad de bug bounty española.</p>
         <form class="modal-form" id="registerForm">
           <input type="text" placeholder="Nombre completo" class="modal-input" id="regName" required>
           <input type="email" placeholder="Email" class="modal-input" id="regEmail" required>
           <input type="password" placeholder="Contraseña" class="modal-input" id="regPass" required minlength="6">
           <input type="password" placeholder="Confirmar contraseña" class="modal-input" id="regPass2" required>
           <select class="modal-input" id="regRole" style="padding:12px 14px;">
             <option value="hunter">🔍 Hunter (cazador de bugs)</option>
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
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('open');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('open'), 2500);
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
