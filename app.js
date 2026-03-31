/* ═══════════════════════════════════════════
   XV AÑOS PLANNER — APP LOGIC
   localStorage persistence | Full CRUD
═══════════════════════════════════════════ */

'use strict';

// ─── DATA MODEL ───────────────────────────
let state = {
  settings: {
    name: '',
    date: '',
    budget: 0
  },
  providers: [],   // { id, name, category, phone, employee, total, deposit, nextPayDate, nextPayAmount, status, notes, payments:[] }
  payments: [],    // { id, providerId, providerName, amount, date, method, note, nextDate, nextAmount }
  checklist: [],   // { id, name, deadline, done }
  padrinos: [],    // { id, name, category, phone, amount, paid, status, notes }
  moodboard: [],   // { id, category, title, desc, tags, image }
  boardTitle: 'Mi Tablero de Ideas'
};

// ─── STORAGE ──────────────────────────────
const STORAGE_KEY = 'xvAnosPlanner_v1';

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Storage error', e);
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
    }
  } catch (e) {
    console.warn('Load error', e);
  }
}

// ─── THEME CONFIGURATION ──────────────────
function initTheme() {
  const t = localStorage.getItem('xvTheme_v1') || 'light';
  document.documentElement.setAttribute('data-theme', t);
  const btn = document.getElementById('btnThemeToggle');
  if (btn) btn.textContent = t === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('xvTheme_v1', next);
  document.getElementById('btnThemeToggle').textContent = next === 'dark' ? '☀️' : '🌙';
}

// ─── UTILITIES ────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fmt(num) {
  const n = parseFloat(num) || 0;
  return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  now.setHours(0,0,0,0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target - now) / 86400000);
}

function daysLabel(days) {
  if (days === null) return null;
  if (days < 0) return `Vencido hace ${Math.abs(days)}d`;
  if (days === 0) return '¡Hoy!';
  if (days === 1) return 'Mañana';
  return `En ${days} días`;
}

function urgencyClass(days) {
  if (days === null) return 'ok';
  if (days <= 3) return 'urgent';
  if (days <= 14) return 'soon';
  return 'ok';
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function categoryIcon(cat) {
  const icons = {
    'Salón':'🏛️','Catering':'🍽️','Misa':'⛪','Música':'🎵','Coreografías':'💃','Fotografía':'📸',
    'Video':'🎬','Decoración':'🌸','Pastel':'🎂','Flores':'💐',
    'Vestido':'👗','Maquillaje':'💄','Invitaciones':'📬','Transporte':'🚗',
    'Show':'🎭','Recuerdos':'🎁',
    'Vino':'🍷','Cocktelería':'🍹','Mesa de Dulces':'🍬','Cabina Fotográfica':'📷',
    'Otro':'✨'
  };
  return icons[cat] || '✨';
}

function padrinoIcon(cat) {
  const icons = {
    'Vestido':'👗','Pastel':'🎂','Salón':'🏛️','Decoración':'🌸',
    'Música':'🎵','Coreografías':'💃','Fotografía':'📸','Flores':'💐',
    'Transporte':'🚗','Recuerdos':'🎁','Misa':'⛪','Brindis':'🥂',
    'Chambelanes':'🕺','Último Juguete':'🧸','Tiara':'👑','Zapatillas':'👠',
    'Anillo':'💍','Biblia':'📖','Cojín':'💜','Ramo':'💐','Otro':'✨'
  };
  return icons[cat] || '✨';
}

function paymentIcon(method) {
  const icons = { 'Efectivo':'💵','Transferencia':'🏦','Tarjeta':'💳','Depósito':'🧾' };
  return icons[method] || '💳';
}

// ─── REGISTRATION ─────────────────────────
const REG_KEY  = 'xvAnosReg_v1';
// Formspree: el primer envío genera un correo de verificación a opl2@yahoo.com
// Una vez confirmado, todos los prospectos llegarán automáticamente
const FORM_URL = 'https://formspree.io/opl2@yahoo.com';


function isRegistered() {
  return !!localStorage.getItem(REG_KEY);
}

function markRegistered(name, phone) {
  localStorage.setItem(REG_KEY, JSON.stringify({ name, phone, ts: new Date().toISOString() }));
}

function getUserPhone() {
  try {
    const data = JSON.parse(localStorage.getItem(REG_KEY));
    return data && data.phone ? data.phone.replace(/\D/g, '') : null;
  } catch(_) { return null; }
}

// The floating WA button has been deprecated.

async function submitRegistration() {
  const name  = document.getElementById('regName').value.trim();
  const phone = document.getElementById('regPhone').value.trim();

  if (!name)  { shakeInput('regName');  return; }
  if (!phone) { shakeInput('regPhone'); return; }

  const btn    = document.getElementById('btnComenzar');
  const txtEl  = document.getElementById('btnComenzarText');
  const loader = document.getElementById('btnComenzarLoader');

  btn.disabled = true;
  txtEl.classList.add('hidden');
  loader.classList.remove('hidden');

  try {
    await fetch(FORM_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        nombre:    name,
        whatsapp:  phone,
        fecha:     new Date().toLocaleString('es-MX'),
        app:       'XV Años Planner',
        _subject:  `Nuevo prospecto Mis XV Planner: ${name}`
      })
    });
  } catch (_) {
    // Si hay error de red, continuamos de todos modos
  }

  markRegistered(name, phone);
  launchApp();
}

function shakeInput(id) {
  const el = document.getElementById(id);
  el.closest('.reg-input-wrap').style.animation = 'none';
  setTimeout(() => { el.closest('.reg-input-wrap').style.animation = 'shake 0.4s ease'; }, 10);
  el.focus();
}

function launchApp() {
  document.getElementById('registerScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  loadState();
  initTheme();
  
  if (!state.settings.name) {
    setTimeout(() => openSettings(), 400);
  }
  refreshAll();
  // Recordatorios de pago al abrir la app
  setTimeout(() => requestAndNotify(), 1200);
}

// ─── RECORDATORIOS DE PAGO ─────────────────
const NOTIF_KEY = 'xvAnosNotifDay_v1';

function requestAndNotify() {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    checkAndSendReminders();
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') checkAndSendReminders();
    });
  }
}

function checkAndSendReminders() {
  const today = new Date().toISOString().split('T')[0];
  const lastSent = localStorage.getItem(NOTIF_KEY);
  // Solo enviar una vez por día
  if (lastSent === today) return;

  const dueReminders = getAllReminders().filter(r => r.days >= 0 && r.days <= 3);
  if (dueReminders.length === 0) return;

  localStorage.setItem(NOTIF_KEY, today);

  dueReminders.forEach((r, i) => {
    setTimeout(() => {
      const label = r.days === 0 ? '¡HOY!' : r.days === 1 ? 'Mañana' : `En ${r.days} días`;
      const n = new Notification('🔔 Mis XV Planner — Pago próximo', {
        body: `${label}: ${r.name}\n${fmt(r.amount)} · ${fmtDate(r.date)}`,
        icon: 'logo.png',
        badge: 'logo.png',
        tag: `xv-reminder-${r.name}-${r.date}`,
        requireInteraction: r.days <= 1   // persiste en pantalla si es urgente
      });
      n.onclick = () => { window.focus(); n.close(); };
    }, i * 800); // espaciadas 0.8s entre sí
  });

  // Banner in-app adicional con resumen
  const nombres = dueReminders.map(r => r.name).join(', ');
  showToast(`🔔 ${dueReminders.length} pago(s) próximo(s): ${nombres}`);
}

// ─── COIN SOUND (Web Audio API) ───────────
function playCoinSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    // Metallic ticks that slow down (like a coin spinning and settling)
    const ticks = 18;
    for (let i = 0; i < ticks; i++) {
      // Interval increases as coin slows: starts fast, ends slow
      const t = now + 0.5 + (i * (0.06 + i * 0.012));
      if (t - now > 3.5) break; // Don't exceed animation duration

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      // Higher pitch metallic sound
      osc.frequency.value = 2800 + Math.random() * 600;
      osc.type = 'sine';

      // Volume decreases then increases at end
      const vol = 0.04 + (i < ticks / 2 ? 0.02 : 0.04 * (i / ticks));
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.start(t);
      osc.stop(t + 0.07);
    }

    // Final bright "ding" when coin lands (at 3.5s = when gleam fires)
    const dingTime = now + 3.5;
    const dingOsc = ctx.createOscillator();
    const dingOsc2 = ctx.createOscillator();
    const dingGain = ctx.createGain();
    const dingGain2 = ctx.createGain();

    dingOsc.connect(dingGain);
    dingGain.connect(ctx.destination);
    dingOsc.frequency.value = 4200;
    dingOsc.type = 'sine';
    dingGain.gain.setValueAtTime(0, dingTime);
    dingGain.gain.linearRampToValueAtTime(0.12, dingTime + 0.01);
    dingGain.gain.exponentialRampToValueAtTime(0.001, dingTime + 0.8);
    dingOsc.start(dingTime);
    dingOsc.stop(dingTime + 0.85);

    // Harmonic overtone for richness
    dingOsc2.connect(dingGain2);
    dingGain2.connect(ctx.destination);
    dingOsc2.frequency.value = 6300;
    dingOsc2.type = 'sine';
    dingGain2.gain.setValueAtTime(0, dingTime);
    dingGain2.gain.linearRampToValueAtTime(0.06, dingTime + 0.01);
    dingGain2.gain.exponentialRampToValueAtTime(0.001, dingTime + 0.5);
    dingOsc2.start(dingTime);
    dingOsc2.stop(dingTime + 0.55);

  } catch(e) {
    // Web Audio not supported, silently skip
  }
}

// ─── INIT ──────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const tapScreen = document.getElementById('tapToStart');
  const btnStart = document.getElementById('btnStartApp');
  
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      // 1. Ocultar el tap screen
      if (tapScreen) {
        tapScreen.style.opacity = '0';
        setTimeout(() => tapScreen.remove(), 500);
      }

      // 2. Play sound and trigger animations
      document.body.classList.add('app-running');
      try { playCoinSound(); } catch(_) {}

      // 3. Destruir splash después de la animación de 4.5s
      setTimeout(() => {
        const splash = document.getElementById('splash');
        if (splash) splash.classList.add('hidden');
        
        if (isRegistered()) {
          launchApp();
        } else {
          document.getElementById('registerScreen').classList.remove('hidden');
        }
      }, 4500);
    });
  }
});


// ─── TABS ──────────────────────────────────
function switchTab(tabName, btn) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tabName).classList.add('active');
  btn.classList.add('active');
  if (tabName === 'dashboard') renderDashboard();
  if (tabName === 'providers') renderProviders();
  if (tabName === 'payments') renderPayments();
  if (tabName === 'padrinos') renderPadrinos();
  if (tabName === 'checklist') renderChecklist();
  if (tabName === 'moodboard') renderMoodboard();
}

// ─── REFRESH ALL ──────────────────────────
function refreshAll() {
  updateBudgetBanner();
  renderDashboard();
  renderProviders();
  renderPayments();
  renderPadrinos();
  renderChecklist();
  renderMoodboard();
}

// ─── BUDGET BANNER ────────────────────────
function updateBudgetBanner() {
  const totalBudget = parseFloat(state.settings.budget) || 0;
  const totalPaid = state.payments.reduce((s, p) => s + (parseFloat(p.amount)||0), 0);
  const totalContracts = state.providers.reduce((s, p) => s + (parseFloat(p.total)||0), 0);
  const totalPending = totalContracts - totalPaid;

  const pendingAmount = Math.max(0, totalPending);
  document.getElementById('totalBudget').textContent = fmt(totalBudget || totalContracts);
  document.getElementById('totalPaid').textContent = fmt(totalPaid);
  document.getElementById('totalPending').textContent = fmt(pendingAmount);

  // Lógica de Confeti
  if (totalContracts > 0 && pendingAmount <= 0 && !window.confettiFired) {
    window.confettiFired = true;
    if (typeof confetti === 'function') {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  } else if (pendingAmount > 0) {
    window.confettiFired = false;
  }

  const pct = totalContracts > 0 ? Math.min(100, (totalPaid / totalContracts) * 100) : 0;
  document.getElementById('progressFill').style.width = pct.toFixed(1) + '%';
  document.getElementById('progressPct').textContent = pct.toFixed(0) + '%';
}

// ─── DASHBOARD ────────────────────────────
function renderDashboard() {
  // Settings display
  const name = state.settings.name;
  document.getElementById('eventNameDisplay').textContent = name || 'Mi Fiesta';
  document.getElementById('countdownName').textContent = name ? `🌸 ${name}` : '🌸';

  // Date + countdown
  const dateStr = state.settings.date;
  const days = daysUntil(dateStr);
  
  const regData = localStorage.getItem('xvAnosReg_v1');
  let startDate = new Date();
  if (regData) {
    try { const r = JSON.parse(regData); if(r.ts) startDate = new Date(r.ts); } catch(e){}
  }

  if (dateStr) {
    document.getElementById('countdownDate').textContent = fmtDate(dateStr);
    
    const targetD = new Date(dateStr + 'T00:00:00');
    const totalDays = Math.max(1, Math.round((targetD - startDate) / (1000 * 60 * 60 * 24)));
    let pctTime = 0;

    if (days !== null && days === 0) {
      document.getElementById('countdownNum').textContent = '🎉';
      document.getElementById('countdownLabel').textContent = '¡Hoy es el gran día!';
      pctTime = 100;
    } else if (days !== null && days < 0) {
      document.getElementById('countdownNum').textContent = '✨';
      document.getElementById('countdownLabel').textContent = '¡La fiesta ya pasó!';
      pctTime = 100;
    } else {
      document.getElementById('countdownNum').textContent = days !== null ? days : '--';
      document.getElementById('countdownLabel').textContent = 'días para la gran fiesta';
      const daysPassed = totalDays - days;
      pctTime = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
    }
    const bar = document.getElementById('countdownProgressFill');
    if(bar) bar.style.width = pctTime.toFixed(1) + '%';
  } else {
    document.getElementById('countdownDate').textContent = 'Fecha por definir';
    document.getElementById('countdownNum').textContent = '--';
    document.getElementById('countdownLabel').textContent = 'días para la gran fiesta';
    const bar = document.getElementById('countdownProgressFill');
    if(bar) bar.style.width = '0%';
  }

  // Stats
  const contracted = state.providers.filter(p => p.status === 'contracted').length;
  const pendingCount = (state.checklist || []).filter(p => !p.done).length;
  // Upcoming payment reminders
  const reminders = getAllReminders();

  document.getElementById('statProviders').textContent = state.providers.length;
  document.getElementById('statContracted').textContent = contracted;
  document.getElementById('statChecklistTodo').textContent = pendingCount;
  document.getElementById('statReminders').textContent = reminders.length;

  // Upcoming reminders list
  const remBox = document.getElementById('upcomingReminders');
  const upcoming = reminders.sort((a,b) => a.days - b.days).slice(0, 6);
  if (upcoming.length === 0) {
    remBox.innerHTML = '<div class="empty-state">Sin recordatorios próximos</div>';
  } else {
    remBox.innerHTML = upcoming.map(r => `
      <div class="reminder-item">
        <div class="reminder-dot ${urgencyClass(r.days)}"></div>
        <div class="reminder-info">
          <div class="reminder-name">${r.name}</div>
          <div class="reminder-sub">${daysLabel(r.days)} · ${fmtDate(r.date)}</div>
        </div>
        <div class="reminder-amount">${fmt(r.amount)}</div>
      </div>
    `).join('');
  }

  // Category breakdown
  const catBox = document.getElementById('categoryBreakdown');
  const catTotals = {};
  state.providers.forEach(p => {
    const key = p.category || 'Otro';
    catTotals[key] = (catTotals[key] || 0) + (parseFloat(p.total) || 0);
  });
  const maxCat = Math.max(...Object.values(catTotals), 1);
  const catEntries = Object.entries(catTotals).sort((a,b) => b[1]-a[1]);
  if (catEntries.length === 0) {
    catBox.innerHTML = '<div class="empty-state">Agrega proveedores para ver el detalle</div>';
  } else {
    catBox.innerHTML = catEntries.map(([cat, total]) => `
      <div class="cat-item">
        <span class="cat-label">${categoryIcon(cat)} ${cat}</span>
        <div class="cat-bar-bg">
          <div class="cat-bar-fill" style="width:${(total/maxCat*100).toFixed(1)}%"></div>
        </div>
        <span class="cat-amount">${fmt(total)}</span>
      </div>
    `).join('');
  }
}

function getAllReminders() {
  const reminders = [];
  const today = new Date();
  today.setHours(0,0,0,0);

  state.providers.forEach(p => {
    if (p.nextPayDate && p.nextPayAmount) {
      const days = daysUntil(p.nextPayDate);
      if (days !== null && days <= 30 && days >= 0) {
        reminders.push({
          name: p.name,
          date: p.nextPayDate,
          amount: p.nextPayAmount,
          days
        });
      }
    }
  });

  state.payments.forEach(pay => {
    if (pay.nextDate && pay.nextAmount) {
      const days = daysUntil(pay.nextDate);
      if (days !== null && days <= 30 && days >= 0) {
        // de-duplicate con providers
        const already = reminders.find(r => r.date === pay.nextDate && r.name === pay.providerName);
        if (!already) {
          reminders.push({
            name: pay.providerName,
            date: pay.nextDate,
            amount: pay.nextAmount,
            days
          });
        }
      }
    }
  });

  return reminders;
}

// ─── SETTINGS ─────────────────────────────
function openSettings() {
  document.getElementById('settingName').value = state.settings.name || '';
  document.getElementById('settingDate').value = state.settings.date || '';
  document.getElementById('settingBudget').value = state.settings.budget || '';
  openModal('modalSettings');
}

function saveSettings() {
  const name = document.getElementById('settingName').value.trim();
  const date = document.getElementById('settingDate').value;
  const budget = parseFloat(document.getElementById('settingBudget').value) || 0;
  state.settings = { name, date, budget };
  saveState();
  closeModal('modalSettings');
  refreshAll();
  showToast('✅ Configuración guardada');
}

// ─── WHATSAPP LINK BUILDER ────────────────
function buildWALink(contactPhone, contactName, type) {
  const userPhone = getUserPhone();
  const userName = state.settings.name || 'la quinceañera';
  // If provider/padrino has their own phone, link to them with a greeting
  if (contactPhone) {
    const cleanPhone = contactPhone.replace(/\D/g, '');
    const msg = encodeURIComponent(`Hola ${contactName}, soy organizador(a) de los XV años de ${userName} 🌸`);
    return `https://wa.me/52${cleanPhone}?text=${msg}`;
  }
  // Fallback: link to user's phone so they can be contacted
  if (userPhone) {
    const label = type === 'padrino' ? 'padrino/madrina' : 'proveedor';
    const msg = encodeURIComponent(`Hola, soy ${contactName} (${label}) y te contacto por los XV de ${userName} 🌸`);
    return `https://wa.me/52${userPhone}?text=${msg}`;
  }
  return '#';
}

// ─── PROVIDERS ────────────────────────────
let currentProviderFilter = 'all';

function togglePhotoDateField() {
  const cat = document.getElementById('providerCategory').value;
  const group = document.getElementById('photoSessionGroup');
  if (group) {
    group.style.display = (cat === 'Fotografía' || cat === 'Video') ? '' : 'none';
  }
}

function filterProviders(filter, btn) {
  currentProviderFilter = filter;
  document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  renderProviders();
}

function renderProviders() {
  const box = document.getElementById('providersList');
  let list = [...state.providers];

  if (currentProviderFilter === 'contracted') list = list.filter(p => p.status === 'contracted');
  else if (currentProviderFilter === 'pending') list = list.filter(p => p.status !== 'contracted');

  if (list.length === 0) {
    box.innerHTML = `
      <div class="empty-state-big">
        <div class="empty-icon">🎪</div>
        <p>Sin proveedores${currentProviderFilter !== 'all' ? ' en esta categoría' : ''}</p>
        <button class="btn-add" onclick="openProviderModal()">Agregar Proveedor</button>
      </div>`;
    return;
  }

  box.innerHTML = list.map(p => {
    const paid = getPaidAmount(p.id);
    const total = parseFloat(p.total) || 0;
    const remaining = Math.max(0, total - paid);
    const pct = total > 0 ? Math.min(100, (paid/total)*100) : 0;
    const days = daysUntil(p.nextPayDate);
    const urg = urgencyClass(days);

    let nextPayHtml = '';
    if (p.nextPayDate) {
      nextPayHtml = `<div class="provider-next-pay next-pay-${urg}">🔔 ${daysLabel(days)}: ${fmt(p.nextPayAmount)} (${fmtDate(p.nextPayDate)})</div>`;
    }

    let photoDateHtml = '';
    if (p.category === 'Fotografía' && p.photoDate) {
      const photoDays = daysUntil(p.photoDate);
      photoDateHtml = `<div class="provider-next-pay next-pay-${urgencyClass(photoDays)}" onclick="event.stopPropagation()">📸 Sesión: ${fmtDate(p.photoDate)}${photoDays !== null ? ' (' + daysLabel(photoDays) + ')' : ''}</div>`;
    }

    const statusLabels = { contracted:'✅ Contratado', negotiating:'🤝 Negociando', pending:'⏳ Pendiente' };

    return `
      <div class="provider-card status-${p.status}" onclick="viewProvider('${p.id}')">
        <div class="provider-top">
          <div class="provider-name">${p.name}</div>
          <div class="provider-cat-badge">${categoryIcon(p.category)}${p.category||'Otro'}</div>
        </div>
        <div class="provider-amounts">
          <div class="amount-block">
            <div class="amount-label">Total</div>
            <div class="amount-value total">${fmt(total)}</div>
          </div>
          <div class="amount-block">
            <div class="amount-label">Pagado</div>
            <div class="amount-value paid2">${fmt(paid)}</div>
          </div>
          <div class="amount-block">
            <div class="amount-label">Resto</div>
            <div class="amount-value remain">${fmt(remaining)}</div>
          </div>
        </div>
        <div class="provider-bottom">
          <div class="provider-progress-bg">
            <div class="provider-progress-fill" style="width:${pct.toFixed(1)}%"></div>
          </div>
          <span class="provider-pct">${pct.toFixed(0)}%</span>
          <div class="provider-actions" onclick="event.stopPropagation()">
            <button class="btn-icon" onclick="openProviderModal('${p.id}')" title="Editar">✏️</button>
            <button class="btn-icon danger" onclick="confirmDelete('provider','${p.id}')" title="Eliminar">🗑️</button>
          </div>
        </div>
        ${p.employee ? `<div class="provider-employee" onclick="event.stopPropagation()">👤 <span class="employee-name">${p.employee}</span></div>` : ''}
        ${p.phone ? `<div class="provider-phone" onclick="event.stopPropagation()"><a class="whatsapp-link" href="${buildWALink(p.phone, p.name, 'provider')}" target="_blank"><svg class="wa-icon-sm" viewBox="0 0 24 24" fill="#25D366" width="14" height="14"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> ${p.phone}</a></div>` : ''}
        ${nextPayHtml}
        ${photoDateHtml}
        <div style="margin-top:0.4rem">
          <span class="status-badge ${p.status}">${statusLabels[p.status]||p.status}</span>
        </div>
      </div>
    `;
  }).join('');
}

function getPaidAmount(providerId) {
  return state.payments
    .filter(pay => pay.providerId === providerId)
    .reduce((s, pay) => s + (parseFloat(pay.amount)||0), 0);
}

function openProviderModal(id = null) {
  const modal = document.getElementById('modalProvider');
  if (id) {
    const p = state.providers.find(x => x.id === id);
    if (!p) return;
    document.getElementById('providerModalTitle').textContent = '✏️ Editar Proveedor';
    document.getElementById('providerId').value = p.id;
    document.getElementById('providerName').value = p.name || '';
    document.getElementById('providerEmployee').value = p.employee || '';
    document.getElementById('providerCategory').value = p.category || '';
    document.getElementById('providerPhone').value = p.phone || '';
    document.getElementById('providerTotal').value = p.total || '';
    document.getElementById('providerDeposit').value = p.deposit || '';
    document.getElementById('providerNextPayDate').value = p.nextPayDate || '';
    document.getElementById('providerNextPayAmount').value = p.nextPayAmount || '';
    document.getElementById('providerStatus').value = p.status || 'contracted';
    document.getElementById('providerNotes').value = p.notes || '';
    document.getElementById('providerPhotoDate').value = p.photoDate || '';
    togglePhotoDateField();
  } else {
    document.getElementById('providerModalTitle').textContent = '🎪 Nuevo Proveedor';
    document.getElementById('providerId').value = '';
    document.getElementById('providerName').value = '';
    document.getElementById('providerEmployee').value = '';
    document.getElementById('providerCategory').value = '';
    document.getElementById('providerPhone').value = '';
    document.getElementById('providerTotal').value = '';
    document.getElementById('providerDeposit').value = '';
    document.getElementById('providerNextPayDate').value = '';
    document.getElementById('providerNextPayAmount').value = '';
    document.getElementById('providerStatus').value = 'contracted';
    document.getElementById('providerNotes').value = '';
    document.getElementById('providerPhotoDate').value = '';
    togglePhotoDateField();
  }
  openModal('modalProvider');
}

function saveProvider() {
  const name = document.getElementById('providerName').value.trim();
  if (!name) { showToast('⚠️ El nombre es obligatorio'); return; }
  const total = document.getElementById('providerTotal').value;
  if (!total) { showToast('⚠️ El importe total es obligatorio'); return; }

  const id = document.getElementById('providerId').value;
  const data = {
    name,
    employee: document.getElementById('providerEmployee').value.trim(),
    category: document.getElementById('providerCategory').value,
    phone: document.getElementById('providerPhone').value.trim(),
    total: parseFloat(total) || 0,
    deposit: parseFloat(document.getElementById('providerDeposit').value) || 0,
    nextPayDate: document.getElementById('providerNextPayDate').value,
    nextPayAmount: parseFloat(document.getElementById('providerNextPayAmount').value) || 0,
    status: document.getElementById('providerStatus').value,
    notes: document.getElementById('providerNotes').value.trim(),
    photoDate: document.getElementById('providerPhotoDate').value
  };

  if (id) {
    const idx = state.providers.findIndex(p => p.id === id);
    if (idx > -1) state.providers[idx] = { ...state.providers[idx], ...data };
  } else {
    state.providers.push({ id: uid(), payments: [], ...data });

    // Auto-register deposit as payment if provided
    if (data.deposit > 0) {
      state.payments.push({
        id: uid(),
        providerId: state.providers[state.providers.length - 1].id,
        providerName: data.name,
        amount: data.deposit,
        date: new Date().toISOString().split('T')[0],
        method: 'Efectivo',
        note: 'Anticipo / Enganche',
        nextDate: data.nextPayDate,
        nextAmount: data.nextPayAmount
      });
    }
  }

  saveState();
  closeModal('modalProvider');
  refreshAll();
  showToast(id ? '✅ Proveedor actualizado' : '✅ Proveedor agregado');
}

function viewProvider(id) {
  const p = state.providers.find(x => x.id === id);
  if (!p) return;
  const paid = getPaidAmount(p.id);
  const remaining = Math.max(0, (parseFloat(p.total)||0) - paid);
  const statusLabels = { contracted:'✅ Contratado', negotiating:'🤝 En negociación', pending:'⏳ Pendiente de contratar' };

  const rows = [
    ['Categoría', `${categoryIcon(p.category)} ${p.category || '—'}`],
    ['Asesor', p.employee ? `👤 ${p.employee}` : '—'],
    ['Importe Total', fmt(p.total)],
    ['Total Pagado', fmt(paid)],
    ['Saldo Pendiente', fmt(remaining)],
    ['WhatsApp', p.phone ? `<a class="whatsapp-link" href="${buildWALink(p.phone, p.name, 'provider')}" target="_blank"><svg class="wa-icon-sm" viewBox="0 0 24 24" fill="#25D366" width="14" height="14"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> ${p.phone}</a>` : '—'],
    ['Próx. Pago', p.nextPayDate ? `${fmtDate(p.nextPayDate)} · ${fmt(p.nextPayAmount)}` : '—'],
    ['Estado', statusLabels[p.status] || p.status],
    ...(p.category === 'Fotografía' && p.photoDate ? [['Sesión Fotográfica', `📸 ${fmtDate(p.photoDate)}`]] : []),
    ['Notas', p.notes || '—']
  ];

  document.getElementById('detailTitle').textContent = p.name;
  document.getElementById('detailBody').innerHTML = rows.map(([k,v]) => `
    <div class="detail-row">
      <span class="detail-key">${k}</span>
      <span class="detail-val">${v}</span>
    </div>
  `).join('');
  document.getElementById('detailEditBtn').onclick = () => {
    closeModal('modalProviderDetail');
    openProviderModal(id);
  };
  openModal('modalProviderDetail');
}

// ─── PAYMENTS ─────────────────────────────
function openPaymentModal() {
  // Populate provider selector
  const sel = document.getElementById('paymentProvider');
  sel.innerHTML = '<option value="">-- Seleccionar proveedor --</option>';
  state.providers.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${categoryIcon(p.category)} ${p.name}`;
    sel.appendChild(opt);
  });
  document.getElementById('paymentAmount').value = '';
  document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('paymentMethod').value = 'Efectivo';
  document.getElementById('paymentNote').value = '';
  document.getElementById('paymentNextDate').value = '';
  document.getElementById('paymentNextAmount').value = '';
  openModal('modalPayment');
}

function savePayment() {
  const providerId = document.getElementById('paymentProvider').value;
  if (!providerId) { showToast('⚠️ Selecciona un proveedor'); return; }
  const amount = parseFloat(document.getElementById('paymentAmount').value);
  if (!amount || amount <= 0) { showToast('⚠️ El monto debe ser mayor a 0'); return; }
  const date = document.getElementById('paymentDate').value;
  if (!date) { showToast('⚠️ La fecha es obligatoria'); return; }

  const provider = state.providers.find(p => p.id === providerId);
  const nextDate = document.getElementById('paymentNextDate').value;
  const nextAmount = parseFloat(document.getElementById('paymentNextAmount').value) || 0;

  const payment = {
    id: uid(),
    providerId,
    providerName: provider ? provider.name : '—',
    amount,
    date,
    method: document.getElementById('paymentMethod').value,
    note: document.getElementById('paymentNote').value.trim(),
    nextDate,
    nextAmount
  };
  state.payments.push(payment);

  // Update provider next pay info
  if (provider && nextDate) {
    provider.nextPayDate = nextDate;
    provider.nextPayAmount = nextAmount;
  }

  saveState();
  closeModal('modalPayment');
  refreshAll();
  showToast('✅ Pago registrado exitosamente');
}

function renderPayments() {
  const box = document.getElementById('paymentsList');
  if (state.payments.length === 0) {
    box.innerHTML = `
      <div class="empty-state-big">
        <div class="empty-icon">💳</div>
        <p>Sin pagos registrados aún</p>
        <button class="btn-add" onclick="openPaymentModal()">Registrar Pago</button>
      </div>`;
    return;
  }

  const sorted = [...state.payments].sort((a,b) => b.date.localeCompare(a.date));
  box.innerHTML = sorted.map(pay => `
    <div class="payment-card">
      <div class="payment-icon-wrap">${paymentIcon(pay.method)}</div>
      <div class="payment-info">
        <div class="payment-provider">${pay.providerName}</div>
        <div class="payment-meta">${fmtDate(pay.date)} · ${pay.method}${pay.note ? ' · ' + pay.note : ''}</div>
        ${pay.nextDate ? `<div class="payment-meta" style="color:var(--gold)">🔔 Próx: ${fmtDate(pay.nextDate)} ${pay.nextAmount ? '· ' + fmt(pay.nextAmount) : ''}</div>` : ''}
      </div>
      <div>
        <div class="payment-amount">${fmt(pay.amount)}</div>
        <button class="payment-delete" onclick="confirmDelete('payment','${pay.id}')" title="Eliminar">🗑️</button>
      </div>
    </div>
  `).join('');
}

// ─── CHECKLIST ────────────────────────────
function openChecklistModal(id = null) {
  if (id) {
    const s = state.checklist.find(x => x.id === id);
    if (!s) return;
    document.getElementById('checklistId').value = s.id;
    document.getElementById('checklistName').value = s.name || '';
    document.getElementById('checklistDeadline').value = s.deadline || '';
  } else {
    document.getElementById('checklistId').value = '';
    document.getElementById('checklistName').value = '';
    document.getElementById('checklistDeadline').value = '';
  }
  openModal('modalChecklist');
}

function saveChecklist() {
  const name = document.getElementById('checklistName').value.trim();
  if (!name) { showToast('⚠️ El nombre de la tarea es obligatorio'); return; }

  const id = document.getElementById('checklistId').value;
  const deadline = document.getElementById('checklistDeadline').value;

  if (id) {
    const idx = state.checklist.findIndex(c => c.id === id);
    if (idx > -1) {
      state.checklist[idx].name = name;
      state.checklist[idx].deadline = deadline;
    }
  } else {
    state.checklist.push({ id: uid(), name, deadline, done: false });
  }

  saveState();
  closeModal('modalChecklist');
  renderChecklist();
  renderDashboard();
  showToast(id ? '✅ Tarea actualizada' : '✅ Tarea agregada al Checklist');
}

function toggleChecklistDone(id) {
  const s = state.checklist.find(x => x.id === id);
  if (s) {
    s.done = !s.done;
    saveState();
    renderChecklist();
    renderDashboard();
    showToast(s.done ? '✅ Tarea completada' : '↩️ Tarea reactivada');
  }
}

function buildChecklistWA(taskName, taskDate) {
  const userPhone = getUserPhone();
  const userName = state.settings.name || 'Festejada';
  if (!userPhone) return '#';
  let dateText = '';
  if (taskDate) {
    dateText = ` para el ${fmtDate(taskDate)}`;
  }
  const msg = encodeURIComponent(`Hola ${userName} 💕 recuerda que${dateText} tienes pendiente: ${taskName}`);
  return `https://wa.me/52${userPhone}?text=${msg}`;
}

function renderChecklist() {
  const box = document.getElementById('checklistCont');
  if (!state.checklist || state.checklist.length === 0) {
    box.innerHTML = `
      <div class="empty-state-big">
        <div class="empty-icon">✅</div>
        <p>¡Todo al día! No tienes tareas registradas.</p>
        <button class="btn-add" onclick="openChecklistModal()">Añadir Tarea</button>
      </div>`;
    return;
  }

  const active = state.checklist.filter(p => !p.done).sort((a,b) => (a.deadline||'9999').localeCompare(b.deadline||'9999'));
  const done   = state.checklist.filter(p => p.done);
  const all = [...active, ...done];

  box.innerHTML = all.map(s => {
    const days = daysUntil(s.deadline);
    const waLink = buildChecklistWA(s.name, s.deadline);
    
    return `
      <div class="checklist-card ${s.done ? ' done' : ''}">
        <div class="checklist-top" style="display:flex; align-items:flex-start; justify-content:space-between; width:100%;">
          
          <div style="display:flex; align-items:center; gap:0.6rem; flex:1;">
            <div class="checklist-check ${s.done ? 'checked' : ''}" onclick="toggleChecklistDone('${s.id}')">
              ${s.done ? '✓' : ''}
            </div>
            <div>
              <div class="checklist-name" style="font-weight:600; font-size:1rem; ${s.done ? 'text-decoration:line-through; opacity:0.6;' : 'color:var(--text);'}">${s.name}</div>
              ${s.deadline ? `<div style="font-size:0.8rem; margin-top:0.2rem; color:var(--text-muted);">📅 Vence: ${fmtDate(s.deadline)}${!s.done && days !== null ? ' (' + daysLabel(days) + ')' : ''}</div>` : ''}
            </div>
          </div>
          
          <div class="checklist-actions" style="display:flex; align-items:center; gap:0.4rem;">
            ${!s.done ? `<a href="${waLink}" target="_blank" class="btn-icon" style="background:#25D366; color:#fff; font-size:0.8rem; padding:0.3rem 0.6rem; border-radius:12px; text-decoration:none;" title="Enviar recordatorio a WhatsApp">📱 Avisar</a>` : ''}
            <button class="btn-icon" onclick="openChecklistModal('${s.id}')" title="Editar">✏️</button>
            <button class="btn-icon danger" onclick="confirmDelete('checklist','${s.id}')" title="Eliminar">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ─── DELETE CONFIRM ───────────────────────
let _deleteType = null;
let _deleteId = null;

function confirmDelete(type, id) {
  _deleteType = type;
  _deleteId = id;
  const msgs = {
    provider: '¿Eliminar este proveedor? También se eliminarán sus pagos asociados.',
    payment:  '¿Eliminar este registro de pago?',
    checklist: '¿Eliminar esta tarea del checklist?',
    padrino:  '¿Eliminar este padrino/madrina?'
  };
  document.getElementById('confirmMsg').textContent = msgs[type] || '¿Eliminar este elemento?';
  document.getElementById('confirmDeleteBtn').onclick = () => executeDelete();
  openModal('modalConfirm');
}

function executeDelete() {
  if (_deleteType === 'provider') {
    state.providers = state.providers.filter(p => p.id !== _deleteId);
    state.payments = state.payments.filter(p => p.providerId !== _deleteId);
  } else if (_deleteType === 'payment') {
    state.payments = state.payments.filter(p => p.id !== _deleteId);
  } else if (_deleteType === 'checklist') {
    state.checklist = state.checklist.filter(p => p.id !== _deleteId);
  } else if (_deleteType === 'padrino') {
    state.padrinos = state.padrinos.filter(p => p.id !== _deleteId);
  }
  saveState();
  closeModal('modalConfirm');
  refreshAll();
  showToast('🗑️ Eliminado correctamente');
}

// ─── MODALS ───────────────────────────────
function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
}

// Close modals with Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    document.body.style.overflow = '';
  }
});

// ─── PADRINOS ─────────────────────────────
let currentPadrinoFilter = 'all';

function filterPadrinos(filter, btn) {
  currentPadrinoFilter = filter;
  document.querySelectorAll('#tab-padrinos .filter-chips .chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  renderPadrinos();
}

function renderPadrinos() {
  const box = document.getElementById('padrinosList');
  let list = [...(state.padrinos || [])];

  if (currentPadrinoFilter === 'confirmed') list = list.filter(p => p.status === 'confirmed');
  else if (currentPadrinoFilter === 'pending') list = list.filter(p => p.status !== 'confirmed');

  if (list.length === 0) {
    box.innerHTML = `
      <div class="empty-state-big">
        <div class="empty-icon">🤵</div>
        <p>Sin padrinos${currentPadrinoFilter !== 'all' ? ' en esta categoría' : ''}</p>
        <button class="btn-add" onclick="openPadrinoModal()">Agregar Padrino</button>
      </div>`;
    return;
  }

  box.innerHTML = list.map(p => {
    const amount = parseFloat(p.amount) || 0;
    const paid = parseFloat(p.paid) || 0;
    const remaining = Math.max(0, amount - paid);
    const pct = amount > 0 ? Math.min(100, (paid / amount) * 100) : 0;

    const statusLabels = { confirmed:'✅ Confirmado', pending:'⏳ Por confirmar', declined:'❌ Declinó' };

    return `
      <div class="provider-card status-${p.status === 'confirmed' ? 'contracted' : p.status === 'declined' ? 'pending' : 'negotiating'}" onclick="viewPadrino('${p.id}')">
        <div class="provider-top">
          <div class="provider-name">${p.name}</div>
          <div class="provider-cat-badge">${padrinoIcon(p.category)}${p.category || 'Otro'}</div>
        </div>
        ${amount > 0 ? `
        <div class="provider-amounts">
          <div class="amount-block">
            <div class="amount-label">Comprometido</div>
            <div class="amount-value total">${fmt(amount)}</div>
          </div>
          <div class="amount-block">
            <div class="amount-label">Entregado</div>
            <div class="amount-value paid2">${fmt(paid)}</div>
          </div>
          <div class="amount-block">
            <div class="amount-label">Pendiente</div>
            <div class="amount-value remain">${fmt(remaining)}</div>
          </div>
        </div>
        <div class="provider-bottom">
          <div class="provider-progress-bg">
            <div class="provider-progress-fill" style="width:${pct.toFixed(1)}%"></div>
          </div>
          <span class="provider-pct">${pct.toFixed(0)}%</span>
          <div class="provider-actions" onclick="event.stopPropagation()">
            <button class="btn-icon" onclick="openPadrinoModal('${p.id}')" title="Editar">✏️</button>
            <button class="btn-icon danger" onclick="confirmDelete('padrino','${p.id}')" title="Eliminar">🗑️</button>
          </div>
        </div>
        ` : `
        <div class="provider-bottom">
          <div style="flex:1"></div>
          <div class="provider-actions" onclick="event.stopPropagation()">
            <button class="btn-icon" onclick="openPadrinoModal('${p.id}')" title="Editar">✏️</button>
            <button class="btn-icon danger" onclick="confirmDelete('padrino','${p.id}')" title="Eliminar">🗑️</button>
          </div>
        </div>
        `}
        ${p.phone ? `<div class="provider-phone" onclick="event.stopPropagation()"><a class="whatsapp-link" href="${buildWALink(p.phone, p.name, 'padrino')}" target="_blank"><svg class="wa-icon-sm" viewBox="0 0 24 24" fill="#25D366" width="14" height="14"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> ${p.phone}</a></div>` : ''}
        <div style="margin-top:0.4rem">
          <span class="status-badge ${p.status === 'confirmed' ? 'contracted' : p.status === 'declined' ? 'pending' : 'negotiating'}">${statusLabels[p.status] || p.status}</span>
        </div>
      </div>
    `;
  }).join('');
}

function openPadrinoModal(id = null) {
  if (id) {
    const p = (state.padrinos || []).find(x => x.id === id);
    if (!p) return;
    document.getElementById('padrinoModalTitle').textContent = '✏️ Editar Padrino';
    document.getElementById('padrinoId').value = p.id;
    document.getElementById('padrinoName').value = p.name || '';
    document.getElementById('padrinoCategory').value = p.category || '';
    document.getElementById('padrinoPhone').value = p.phone || '';
    document.getElementById('padrinoAmount').value = p.amount || '';
    document.getElementById('padrinoPaid').value = p.paid || '';
    document.getElementById('padrinoStatus').value = p.status || 'confirmed';
    document.getElementById('padrinoNotes').value = p.notes || '';
  } else {
    document.getElementById('padrinoModalTitle').textContent = '🤵 Nuevo Padrino';
    document.getElementById('padrinoId').value = '';
    document.getElementById('padrinoName').value = '';
    document.getElementById('padrinoCategory').value = '';
    document.getElementById('padrinoPhone').value = '';
    document.getElementById('padrinoAmount').value = '';
    document.getElementById('padrinoPaid').value = '';
    document.getElementById('padrinoStatus').value = 'confirmed';
    document.getElementById('padrinoNotes').value = '';
  }
  openModal('modalPadrino');
}

function savePadrino() {
  const name = document.getElementById('padrinoName').value.trim();
  if (!name) { showToast('⚠️ El nombre es obligatorio'); return; }
  const category = document.getElementById('padrinoCategory').value;
  if (!category) { showToast('⚠️ Selecciona qué apadrina'); return; }

  const id = document.getElementById('padrinoId').value;
  const data = {
    name,
    category,
    phone: document.getElementById('padrinoPhone').value.trim(),
    amount: parseFloat(document.getElementById('padrinoAmount').value) || 0,
    paid: parseFloat(document.getElementById('padrinoPaid').value) || 0,
    status: document.getElementById('padrinoStatus').value,
    notes: document.getElementById('padrinoNotes').value.trim()
  };

  if (!state.padrinos) state.padrinos = [];

  if (id) {
    const idx = state.padrinos.findIndex(p => p.id === id);
    if (idx > -1) state.padrinos[idx] = { ...state.padrinos[idx], ...data };
  } else {
    state.padrinos.push({ id: uid(), ...data });
  }

  saveState();
  closeModal('modalPadrino');
  refreshAll();
  showToast(id ? '✅ Padrino actualizado' : '✅ Padrino agregado');
}

function viewPadrino(id) {
  const p = (state.padrinos || []).find(x => x.id === id);
  if (!p) return;
  const amount = parseFloat(p.amount) || 0;
  const paid = parseFloat(p.paid) || 0;
  const remaining = Math.max(0, amount - paid);
  const statusLabels = { confirmed:'✅ Confirmado', pending:'⏳ Por confirmar', declined:'❌ Declinó' };

  const waLink = p.phone ? `<a class="whatsapp-link" href="${buildWALink(p.phone, p.name, 'padrino')}" target="_blank"><svg class="wa-icon-sm" viewBox="0 0 24 24" fill="#25D366" width="14" height="14"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> ${p.phone}</a>` : '—';

  const rows = [
    ['Apadrina', `${padrinoIcon(p.category)} ${p.category || '—'}`],
    ['WhatsApp', waLink],
    ['Monto Comprometido', fmt(amount)],
    ['Monto Entregado', fmt(paid)],
    ['Saldo Pendiente', fmt(remaining)],
    ['Estado', statusLabels[p.status] || p.status],
    ['Notas', p.notes || '—']
  ];

  document.getElementById('padrinoDetailTitle').textContent = p.name;
  document.getElementById('padrinoDetailBody').innerHTML = rows.map(([k,v]) => `
    <div class="detail-row">
      <span class="detail-key">${k}</span>
      <span class="detail-val">${v}</span>
    </div>
  `).join('');
  document.getElementById('padrinoDetailEditBtn').onclick = () => {
    closeModal('modalPadrinoDetail');
    openPadrinoModal(id);
  };
  openModal('modalPadrinoDetail');
}

// ─── MOODBOARD ────────────────────────────
let currentMoodFilter = 'all';

function renderMoodboard() {
  document.getElementById('moodBoardTitle').textContent = state.boardTitle || 'Mi Tablero de Ideas';
  
  const grid = document.getElementById('moodboardGrid');
  
  let filtered = state.moodboard || [];
  if (currentMoodFilter !== 'all') {
    filtered = filtered.filter(i => i.category === currentMoodFilter || (currentMoodFilter === 'Otro' && !['Vestido','Peinado','Maquillaje','Decoración','Mesa Principal','Pastel','Invitaciones','Foto','Poses','Vals','Color','Flores','Accesorios','Iluminación'].includes(i.category)));
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state-big">
        <div class="empty-icon">🎨</div>
        <p>${state.moodboard && state.moodboard.length > 0 ? 'No hay ideas en esta categoría' : 'Aún no hay ideas en tu moodboard'}</p>
        <button class="btn-add" onclick="openMoodIdeaModal()">Agregar idea</button>
      </div>`;
    grid.style.columnCount = '1';
    return;
  }
  
  grid.style.columnCount = ''; // Reset to default (2 or 1 depending on media query)

  grid.innerHTML = filtered.map(i => {
    let imgHtml = '';
    if (i.image) {
      imgHtml = `<img src="${DOMPurify(i.image)}" class="mood-card-img" alt="${DOMPurify(i.title)}" onerror="this.onerror=null; this.classList.add('placeholder'); this.src=''; this.alt='🖼️';" />`;
    } else {
      imgHtml = `<div class="mood-card-img placeholder">✨</div>`;
    }
    
    let tagsHtml = '';
    if (i.tags && i.tags.length > 0) {
      tagsHtml = `<div class="mood-card-tags">` + i.tags.map(t => `<span class="mood-tag">${DOMPurify(t)}</span>`).join('') + `</div>`;
    }

    return `
      <div class="mood-card" onclick="viewMoodIdea('${i.id}')">
        ${imgHtml}
        <div class="mood-card-actions" onclick="event.stopPropagation()">
          <button class="btn-icon" onclick="openMoodIdeaModal('${i.id}')" title="Editar">✏️</button>
          <button class="btn-icon danger" onclick="confirmDelete('moodboard','${i.id}')" title="Eliminar">🗑️</button>
        </div>
        <div class="mood-card-body">
          <div class="mood-card-cat">${DOMPurify(i.category || 'Idea')}</div>
          <div class="mood-card-title">${DOMPurify(i.title)}</div>
          ${i.desc ? `<div class="mood-card-desc">${DOMPurify(i.desc)}</div>` : ''}
          ${tagsHtml}
        </div>
      </div>
    `;
  }).join('');
}

function filterMoodboard(filter, btn) {
  currentMoodFilter = filter;
  document.querySelectorAll('.mood-chips .chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  renderMoodboard();
}

function editBoardTitle() {
  const newTitle = prompt('Nombre de tu tablero:', state.boardTitle || 'Mi Tablero de Ideas');
  if (newTitle !== null && newTitle.trim() !== '') {
    state.boardTitle = newTitle.trim();
    saveState();
    renderMoodboard();
  }
}

function openMoodIdeaModal(id = null) {
  const imgInput = document.getElementById('moodIdeaImage');
  const imgPreview = document.getElementById('moodPreviewImg');
  const previewDiv = document.getElementById('moodImagePreview');

  if (id) {
    const idea = state.moodboard.find(x => x.id === id);
    if (!idea) return;
    document.getElementById('moodIdeaModalTitle').textContent = '✏️ Editar Idea';
    document.getElementById('moodIdeaId').value = idea.id;
    document.getElementById('moodIdeaCategory').value = idea.category || '';
    document.getElementById('moodIdeaTitle').value = idea.title || '';
    document.getElementById('moodIdeaDesc').value = idea.desc || '';
    document.getElementById('moodIdeaTags').value = idea.tags ? idea.tags.join(', ') : '';
    imgInput.value = idea.image || '';
    
    if (idea.image) {
      imgPreview.src = idea.image;
      previewDiv.style.display = 'block';
    } else {
      previewDiv.style.display = 'none';
      imgPreview.src = '';
    }
  } else {
    document.getElementById('moodIdeaModalTitle').textContent = '💡 Nueva Idea';
    document.getElementById('moodIdeaId').value = '';
    document.getElementById('moodIdeaCategory').value = '';
    document.getElementById('moodIdeaTitle').value = '';
    document.getElementById('moodIdeaDesc').value = '';
    document.getElementById('moodIdeaTags').value = '';
    imgInput.value = '';
    document.getElementById('moodIdeaFileInput').value = '';
    previewDiv.style.display = 'none';
    imgPreview.src = '';
  }
  openModal('modalMoodIdea');
}

// Preview image on input change
document.getElementById('moodIdeaImage').addEventListener('input', function(e) {
  const url = e.target.value.trim();
  const previewDiv = document.getElementById('moodImagePreview');
  const imgPreview = document.getElementById('moodPreviewImg');
  
  if (url) {
    imgPreview.src = url;
    previewDiv.style.display = 'block';
  } else {
    previewDiv.style.display = 'none';
    imgPreview.src = '';
  }
});
document.getElementById('moodPreviewImg').addEventListener('error', function() {
  // If preview fails to load
  this.src = '';
  document.getElementById('moodImagePreview').style.display = 'none';
});

function saveMoodIdea() {
  const title = document.getElementById('moodIdeaTitle').value.trim();
  if (!title) { showToast('⚠️ El título es obligatorio'); return; }
  const category = document.getElementById('moodIdeaCategory').value;
  if (!category) { showToast('⚠️ La categoría es obligatoria'); return; }

  const tagsRaw = document.getElementById('moodIdeaTags').value;
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(t => t) : [];

  const id = document.getElementById('moodIdeaId').value;
  const data = {
    category,
    title,
    desc: document.getElementById('moodIdeaDesc').value.trim(),
    tags,
    image: document.getElementById('moodIdeaImage').value.trim()
  };

  if (!state.moodboard) state.moodboard = [];

  if (id) {
    const idx = state.moodboard.findIndex(i => i.id === id);
    if (idx > -1) state.moodboard[idx] = { ...state.moodboard[idx], ...data };
  } else {
    state.moodboard.push({ id: uid(), ...data });
  }

  saveState();
  closeModal('modalMoodIdea');
  renderMoodboard();
  showToast(id ? '✅ Idea actualizada' : '✅ Idea agregada');
}

function viewMoodIdea(id) {
  openMoodIdeaModal(id);
}

function DOMPurify(str) {
  if (!str) return '';
  return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
}

// ─── MOODBOARD IMAGE PROCESSING ───────────

function handleMoodImageFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  processMoodImageFile(file);
}

function clearMoodImagePreview() {
  document.getElementById('moodIdeaImage').value = '';
  document.getElementById('moodIdeaFileInput').value = '';
  document.getElementById('moodPreviewImg').src = '';
  document.getElementById('moodImagePreview').style.display = 'none';
}

document.getElementById('moodIdeaImage').addEventListener('paste', function(e) {
  const items = (e.clipboardData || e.originalEvent.clipboardData).items;
  for (let index in items) {
    const item = items[index];
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const blob = item.getAsFile();
      processMoodImageFile(blob);
      e.preventDefault(); 
    }
  }
});

function processMoodImageFile(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      // Reducir tamaño para no saturar el localStorage (límite de ~5MB)
      const MAX_WIDTH = 600;
      const MAX_HEIGHT = 600;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
           height = Math.round(height * (MAX_WIDTH / width));
           width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
           width = Math.round(width * (MAX_HEIGHT / height));
           height = MAX_HEIGHT;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Comprimir como JPEG al 65% de calidad
      const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
      
      document.getElementById('moodIdeaImage').value = dataUrl;
      const imgPreview = document.getElementById('moodPreviewImg');
      imgPreview.src = dataUrl;
      document.getElementById('moodImagePreview').style.display = 'block';
    }
    img.src = e.target.result;
  }
  reader.readAsDataURL(file);
}
