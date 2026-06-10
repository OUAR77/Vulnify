// ============== AUTH STATE ==============
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
    const navAuth = document.getElementById('navAuth');
    const navUser = document.getElementById('navUser');
    const userNameEl = document.getElementById('headerUserName');
    if (navAuth) navAuth.style.display = loggedIn ? 'none' : '';
    if (navUser) navUser.style.display = loggedIn ? '' : 'none';
    if (userNameEl && userName) userNameEl.textContent = userName;
    const popupAuth = document.getElementById('popupAuth');
    const popupUser = document.getElementById('popupUser');
    const mobileUserNameEl = document.getElementById('mobileUserName');
    if (popupAuth) popupAuth.style.display = loggedIn ? 'none' : '';
    if (popupUser) popupUser.style.display = loggedIn ? '' : 'none';
    if (mobileUserNameEl && userName) mobileUserNameEl.textContent = userName;
  } catch(e) {}
}
applyAuth();
document.addEventListener('DOMContentLoaded', applyAuth);

// ============== API ==============
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
  try { var p = JSON.parse(atob(token.split('.')[1])); return Date.now() >= p.exp * 1000; } catch(e) { return true; }
}
async function getValidToken() {
  var token = getAuthToken();
  if (!token) return null;
  if (!isTokenExpired(token)) return token;
  var rt = localStorage.getItem('refresh_token');
  if (!rt) return null;
  try {
    var res = await fetch('/api/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: rt }) });
    if (!res.ok) return null;
    var data = await res.json();
    if (data.token) { localStorage.setItem(AUTH_KEY, data.token); localStorage.setItem('token', data.token); return data.token; }
    return null;
  } catch(e) { return null; }
}
function logout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

// ============== MENU ==============
const menuToggle = document.getElementById('menu-toggle');
const menuPopup = document.getElementById('menu-popup');
const closeMenu = document.getElementById('close-menu');

function openMenu() {
  if (!menuPopup || !menuToggle) return;
  menuPopup.classList.add('active');
  menuToggle.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  if (window.gsap) {
    gsap.fromTo('.close-btn', { opacity: 0 }, { opacity: 1, duration: 0.3, delay: 0.3 });
    gsap.fromTo('.popup-items li', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out', delay: 0.2 });
  } else {
    document.querySelectorAll('.popup-items li').forEach((el, i) => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  }
}
function closeMenuFn() {
  if (!menuPopup || !menuToggle) return;
  menuPopup.classList.remove('active');
  menuToggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}
if (menuToggle) menuToggle.addEventListener('click', openMenu);
if (closeMenu) closeMenu.addEventListener('click', closeMenuFn);
if (menuPopup) {
  menuPopup.addEventListener('click', function(e) { if (e.target === e.currentTarget) closeMenuFn(); });
  menuPopup.querySelectorAll('.nav-link').forEach(function(l) { l.addEventListener('click', closeMenuFn); });
}

// ============== TOAST ==============
function showToast(msg, type) {
  var t = document.getElementById('toast');
  if (!t) return;
  var icon = '';
  if (type === 'success') icon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#b8e986" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>';
  else if (type === 'error') icon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
  t.innerHTML = icon + '<span>' + msg + '</span>';
  t.className = 'toast open' + (type ? ' toast-' + type : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(function(){ t.classList.remove('open'); }, 3500);
}

// ============== MODAL ==============
function openModal(type) {
  const overlay = document.getElementById('modalOverlay');
  if (!overlay) return;
  overlay.classList.add('open');
  const params = new URLSearchParams(window.location.search);
  const resetToken = params.get('token');
  if (type === 'reset' || resetToken) type = 'reset';
  document.getElementById('modalBody').innerHTML =
    type === 'login'
      ? '<h2 class="modal-title">Bienvenido de nuevo</h2><p class="modal-desc">Accede a tu cuenta de Vulnify.</p><form class="modal-form" id="loginForm"><input type="email" placeholder="Email" id="loginEmail" required><input type="password" placeholder="Contraseña" id="loginPass" required><p id="loginError" style="color:#ef4444;font-size:13px;display:none;"></p><button type="submit" class="btn btn-primary" style="width:100%;justify-content:center" id="loginBtn"><span>Iniciar sesión</span></button><p style="text-align:center;margin-top:8px"><a onclick="openModal(\'forgot\')" style="font-size:13px;color:#6d6d6d;cursor:pointer">¿Olvidaste tu contraseña?</a></p></form><p class="modal-footer-text">¿No tienes cuenta? <a onclick="openModal(\'register\')">Regístrate</a></p>'
      : type === 'forgot'
      ? '<h2 class="modal-title">Restablecer contraseña</h2><p class="modal-desc">Te enviaremos un enlace para restablecer tu contraseña.</p><form class="modal-form" id="forgotForm"><input type="email" placeholder="Tu email" id="forgotEmail" required><p id="forgotError" style="color:#ef4444;font-size:13px;display:none;"></p><button type="submit" class="btn btn-primary" style="width:100%;justify-content:center" id="forgotBtn"><span>Enviar enlace</span></button></form><p class="modal-footer-text"><a onclick="openModal(\'login\')" style="cursor:pointer">Volver a iniciar sesión</a></p>'
      : type === 'reset'
      ? '<h2 class="modal-title">Nueva contraseña</h2><p class="modal-desc">Elige una contraseña segura para tu cuenta.</p><form class="modal-form" id="resetForm"><input type="password" placeholder="Nueva contraseña" id="resetPass" required minlength="8"><input type="password" placeholder="Confirmar contraseña" id="resetPass2" required><p id="resetError" style="color:#ef4444;font-size:13px;display:none;"></p><button type="submit" class="btn btn-primary" style="width:100%;justify-content:center" id="resetBtn"><span>Restablecer</span></button></form>'
      : '<h2 class="modal-title">Crear cuenta</h2><p class="modal-desc">Únete a Vulnify y empieza a proteger tu identidad digital.</p><form class="modal-form" id="registerForm"><input type="text" placeholder="Nombre completo" id="regName" required><input type="email" placeholder="Email" id="regEmail" required><input type="password" placeholder="Contraseña" id="regPass" required minlength="8"><input type="password" placeholder="Confirmar contraseña" id="regPass2" required><p id="regError" style="color:#ef4444;font-size:13px;display:none;"></p><button type="submit" class="btn btn-primary" style="width:100%;justify-content:center" id="regBtn"><span>Crear cuenta</span></button></form><p class="modal-footer-text">¿Ya tienes cuenta? <a onclick="openModal(\'login\')">Inicia sesión</a></p>';

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
        } catch (e) { err.textContent = e.message; err.style.display = 'block'; btn.innerHTML = '<span>Iniciar sesión</span>'; btn.style.opacity = '1'; }
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
          await registerUser(document.getElementById('regName').value, document.getElementById('regEmail').value, pass, 'hunter');
          closeModal(); showToast('Cuenta creada correctamente', 'success');
          setTimeout(() => window.location.href = '/dashboard', 800);
        } catch (e) { err.textContent = e.message; err.style.display = 'block'; btn.innerHTML = '<span>Crear cuenta</span>'; btn.style.opacity = '1'; }
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
          if (data.reset_token) showToast('Enlace generado: ' + data.reset_token, 'success');
          else showToast('Revisa tu email', 'success');
        } catch (e) { err.textContent = e.message; err.style.display = 'block'; btn.innerHTML = '<span>Enviar enlace</span>'; btn.disabled = false; }
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
        } catch (e) { err.textContent = e.message; err.style.display = 'block'; btn.innerHTML = '<span>Restablecer</span>'; btn.disabled = false; }
      });
    }
  }, 50);
}
function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.classList.remove('open');
}
if (document.getElementById('modalOverlay')) {
  document.getElementById('modalOverlay').addEventListener('click', function(e) { if (e.target === e.currentTarget) closeModal(); });
}
(function checkResetToken() { var p = new URLSearchParams(window.location.search); if (p.get('token')) setTimeout(function(){ openModal('reset'); }, 300); })();

// ============== CUSTOM CURSOR ==============
(function initCursor() {
  var c = document.getElementById('cursorContainer');
  if (!c || window.matchMedia('(pointer: coarse)').matches) return;
  var label = document.getElementById('cursor-label');
  var mx = 0, my = 0;
  document.addEventListener('mousemove', function(e) {
    mx = e.clientX; my = e.clientY;
    c.style.transform = 'translate(' + mx + 'px, ' + my + 'px)';
    if (c.style.opacity === '0') c.style.opacity = '1';
  });
  document.addEventListener('mouseleave', function() { c.style.opacity = '0'; });
  document.addEventListener('mouseenter', function() { c.style.opacity = '1'; });
  // Hover targets
  document.querySelectorAll('.cursor-target, a, button, .ticker-item, .nav-link, .home-faq__item summary, .home-cta__btn').forEach(function(el) {
    el.addEventListener('mouseenter', function() { c.classList.add('is-expanded'); });
    el.addEventListener('mouseleave', function() { c.classList.remove('is-expanded'); });
  });
  // View targets (portfolio etc)
  document.querySelectorAll('.cursor-view').forEach(function(el) {
    el.addEventListener('mouseenter', function() { c.classList.add('is-view'); if (label) label.textContent = el.dataset.label || 'Ver'; });
    el.addEventListener('mouseleave', function() { c.classList.remove('is-view'); });
  });
  // Drag targets
  document.querySelectorAll('.cursor-drag').forEach(function(el) {
    el.addEventListener('mouseenter', function() { c.classList.add('is-drag'); if (label) label.textContent = el.dataset.label || 'Arrastrar'; });
    el.addEventListener('mouseleave', function() { c.classList.remove('is-drag'); });
  });
})();

// ============== LENIS SMOOTH SCROLL ==============
(function initLenis() {
  if (typeof Lenis === 'undefined') return;
  var lenis = new Lenis({ duration: 1.5, easing: function(t) { return 1 - Math.pow(1 - t, 3); }, touchMultiplier: 1.5, wheelMultiplier: 1.2 });
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
  window.lenis = lenis;
  if (typeof ScrollTrigger !== 'undefined') {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function(time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
})();

// ============== GSAP HERO LETTER MORPH ==============
(function initHero() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  var groups = document.querySelectorAll('.letter-group');
  if (!groups.length) return;
  var tl = gsap.timeline();
  groups.forEach(function(g, i) {
    var orig = g.querySelector('.orig-path');
    var eff = g.querySelector('.eff-path');
    if (!orig || !eff) return;
    gsap.set(eff, { opacity: 1, scale: 0.7 });
    tl.to(eff, { morphSVG: orig.getAttribute('d'), duration: 0.8, ease: 'power3.inOut', delay: i * 0.12 }, 0.5 + i * 0.1);
    tl.to(eff, { scale: 1, duration: 0.4, ease: 'back.out(1.7)' }, '-=0.3');
    tl.to(orig, { opacity: 0, duration: 0.01 }, '-=0.2');
  });
  tl.to('.letter-group .eff-path', { opacity: 1, stroke: '#212121', duration: 0.01 }, 0);
  ScrollTrigger.create({ trigger: '#page-main', start: 'top top', end: 'bottom top', onEnter: function() { tl.play(); }, once: true });
})();

// ============== SCROLL REVEAL (IntersectionObserver) ==============
(function initReveals() {
  var els = document.querySelectorAll('.gl-reveal');
  if (!els.length) return;
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) { if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
  els.forEach(function(el) { obs.observe(el); });
})();

// ============== CHARACTER REVEAL (split text) ==============
(function initCharReveal() {
  var targets = document.querySelectorAll('.gl-charreveal');
  if (!targets.length || typeof gsap === 'undefined') return;
  targets.forEach(function(el) {
    var text = el.textContent;
    var chars = [];
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (c === ' ') { chars.push('<span class="char space">&nbsp;</span>'); }
      else { chars.push('<span class="char">' + c + '</span>'); }
    }
    el.innerHTML = chars.join('');
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          var spans = el.querySelectorAll('.char');
          gsap.to(spans, { opacity: 1, y: 0, duration: 0.6, stagger: 0.02, ease: 'power3.out' });
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    obs.observe(el);
  });
})();

// ============== PROCESS / PRACTICE SECTION ==============
(function initPractice() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  var wrap = document.querySelector('.practice-list-wrap');
  var list = document.querySelector('.practice-list');
  var items = document.querySelectorAll('.practice-item');
  var fill = document.querySelector('.practice-progress__fill');
  var currentEl = document.querySelector('.practice-progress__current');
  var icons = document.querySelectorAll('.practice-progress__icon');
  if (!wrap || !list || !items.length) return;

  if (window.innerWidth > 900) {
    var totalW = 0;
    items.forEach(function(item) { totalW += item.offsetWidth; });
    gsap.set(list, { width: totalW });

    var tl = gsap.timeline({ paused: true });
    tl.to(list, { x: function() { return -(totalW - window.innerWidth); }, duration: items.length * 0.8, ease: 'none' });
    tl.to(fill, { scaleX: 1, duration: items.length * 0.8, ease: 'none' }, 0);

    // Progress count
    var stepProgress = 1 / items.length;
    var prevProgress = 0;
    items.forEach(function(item, i) {
      var stepStart = prevProgress;
      var stepEnd = prevProgress + stepProgress;
      tl.call(function() {
        if (currentEl) currentEl.textContent = '0' + (i + 1);
        icons.forEach(function(ic) { ic.classList.remove('is-active'); });
        if (icons[i]) icons[i].classList.add('is-active');
      }, [], stepStart);
      prevProgress = stepEnd;
    });

    ScrollTrigger.create({
      trigger: wrap,
      start: 'top top',
      end: function() { return '+=' + (totalW - window.innerWidth); },
      pin: true,
      pinSpacing: true,
      animation: tl,
      scrub: 1,
      invalidateOnRefresh: true
    });

    // Curtain animation
    var curtain = document.querySelector('.process__curtain');
    if (curtain) {
      ScrollTrigger.create({
        trigger: '.process__curtain-area',
        start: 'top 80%',
        onEnter: function() { gsap.to(curtain, { scaleY: 1, duration: 1, ease: 'power4.inOut', transformOrigin: 'top center' }); },
        once: true
      });
    }
  } else {
    // Mobile: just curtain
    var curtain2 = document.querySelector('.process__curtain');
    if (curtain2) {
      ScrollTrigger.create({
        trigger: '.process__curtain-area',
        start: 'top 80%',
        onEnter: function() { gsap.to(curtain2, { scaleY: 1, duration: 1, ease: 'power4.inOut', transformOrigin: 'top center' }); },
        once: true
      });
    }
    // Show all items
    items.forEach(function(item) { item.style.opacity = '1'; item.style.transform = 'translateY(0)'; });
  }
})();

// ============== TICKER HOVER PREVIEW ==============
(function initTicker() {
  var items = document.querySelectorAll('.ticker-item');
  var preview = document.getElementById('home-ticker-preview');
  var previewImg = preview ? preview.querySelector('img') : null;
  if (!items.length || !preview || !previewImg || window.matchMedia('(pointer: coarse)').matches) return;

  // Set some placeholder preview or hide it
  preview.style.display = 'none';
})();

// ============== CTA PARTICLES ==============
(function initCTAParticles() {
  var canvas = document.getElementById('cta-particles');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w, h, particles = [];
  function resize() {
    w = canvas.parentElement.offsetWidth;
    h = canvas.parentElement.offsetHeight;
    canvas.width = w;
    canvas.height = h;
  }
  resize();
  for (var i = 0; i < 40; i++) {
    particles.push({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5
    });
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(function(p) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(242,242,242,0.15)';
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
  window.addEventListener('resize', resize);
})();

// ============== NAV LINK SCROLL HIGHLIGHT ==============
(function initNavHighlight() {
  var links = document.querySelectorAll('.nav-link.gl-nav-link');
  var sections = document.querySelectorAll('section[id]');
  if (!sections.length) return;
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        links.forEach(function(link) { link.classList.toggle('is-current', link.getAttribute('href') === '#' + entry.target.id); });
      }
    });
  }, { threshold: 0.3 });
  sections.forEach(function(s) { obs.observe(s); });
})();

// ============== FAQ ==============
document.querySelectorAll('.home-faq__item').forEach(function(item) {
  item.addEventListener('toggle', function() {
    if (item.open) {
      // Close others
      document.querySelectorAll('.home-faq__item[open]').forEach(function(other) { if (other !== item) other.open = false; });
    }
  });
});
