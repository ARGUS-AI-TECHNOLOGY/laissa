/* ============================================================
   UTILS.JS — funções compartilhadas entre todas as páginas
   ============================================================ */

const MESES_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_PT_LONGO = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(iso, style = 'curto') {
  if (!iso) return '—';
  const d = parseISODate(iso);
  if (style === 'curto') {
    return `${String(d.getDate()).padStart(2, '0')} ${MESES_PT[d.getMonth()]}`;
  }
  if (style === 'completo') {
    return `${String(d.getDate()).padStart(2, '0')} de ${MESES_PT_LONGO[d.getMonth()]} de ${d.getFullYear()}`;
  }
  if (style === 'numerico') {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
  return iso;
}

function formatDateRange(isoStart, isoEnd) {
  const s = parseISODate(isoStart);
  const e = parseISODate(isoEnd);
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${String(s.getDate()).padStart(2, '0')}–${String(e.getDate()).padStart(2, '0')} ${MESES_PT[e.getMonth()]} ${e.getFullYear()}`;
  }
  return `${formatDate(isoStart, 'curto')} – ${formatDate(isoEnd, 'curto')} ${e.getFullYear()}`;
}

function formatCurrency(value) {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function calculateAge(dataNascimentoISO) {
  const hoje = new Date();
  const nasc = parseISODate(dataNascimentoISO);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const aindaNaoFezAniversario = (hoje.getMonth() < nasc.getMonth()) ||
    (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate());
  if (aindaNaoFezAniversario) idade--;
  return idade;
}

/** Retorna quantos dias faltam até o próximo aniversário (0 = hoje) */
function daysUntilBirthday(dataNascimentoISO) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const nasc = parseISODate(dataNascimentoISO);
  let proximo = new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate());
  if (proximo < hoje) proximo = new Date(hoje.getFullYear() + 1, nasc.getMonth(), nasc.getDate());
  const diffMs = proximo - hoje;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function isBirthdayToday(dataNascimentoISO) {
  return daysUntilBirthday(dataNascimentoISO) === 0;
}

function daysUntil(dataISO) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = parseISODate(dataISO);
  const diffMs = alvo - hoje;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function getInitials(nomeCompleto) {
  const partes = nomeCompleto.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

const AVATAR_COLOR_MAP = {
  coral: { bg: '#FFE1DC', fg: '#D8452F' },
  teal: { bg: '#D7EDE9', fg: '#0A4B47' },
  yellow: { bg: '#FFEFC7', fg: '#B4780A' },
  papaya: { bg: '#FFE3CE', fg: '#C15A17' }
};

function avatarStyle(colorKey) {
  const c = AVATAR_COLOR_MAP[colorKey] || AVATAR_COLOR_MAP.teal;
  return `background:${c.bg}; color:${c.fg};`;
}

const STATUS_STYLES = {
  'Planejada': { bg: '#FFEFC7', fg: '#8A5B00', dot: '#FFB627' },
  'Confirmada': { bg: '#D7EDE9', fg: '#0A4B47', dot: '#1D8A82' },
  'Em andamento': { bg: '#FFE1DC', fg: '#B8321A', dot: '#FF6B5B' },
  'Concluída': { bg: '#E4E9DD', fg: '#4C6B2F', dot: '#7FA34C' },
  'Cancelada': { bg: '#EFEAE3', fg: '#7A7168', dot: '#A79C8F' }
};

function statusBadgeHTML(status) {
  const s = STATUS_STYLES[status] || STATUS_STYLES['Planejada'];
  return `<span class="status-badge" style="background:${s.bg}; color:${s.fg};">
    <span class="status-dot" style="background:${s.dot};"></span>${status}
  </span>`;
}

const CATEGORIA_ICONS = {
  'Praia': 'fa-umbrella-beach',
  'Aventura': 'fa-person-hiking',
  'Cultural': 'fa-landmark',
  'Cruzeiro': 'fa-ship',
  'Internacional': 'fa-earth-americas',
  'Negócios': 'fa-briefcase',
  'Lua de Mel': 'fa-heart',
  'Família': 'fa-people-roof'
};

function categoriaIcon(categoria) {
  return CATEGORIA_ICONS[categoria] || 'fa-suitcase-rolling';
}

/* ---------- Toast de notificação ---------- */
function showToast(message, type = 'sucesso') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { sucesso: 'fa-circle-check', erro: 'fa-circle-exclamation', info: 'fa-circle-info' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${message}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-show'));
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
