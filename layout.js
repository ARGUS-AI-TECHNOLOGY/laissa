/* ============================================================
   LAYOUT.JS — comportamento comum a todas as páginas:
   navegação ativa da sidebar, sino de aniversários no topo,
   menu mobile (sidebar retrátil).
   ============================================================ */

function initSidebarActiveState(pageId) {
  document.querySelectorAll('[data-nav]').forEach(link => {
    if (link.getAttribute('data-nav') === pageId) {
      link.classList.add('nav-active');
    }
  });
}

function initMobileSidebar() {
  const btn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!btn || !sidebar || !overlay) return;
  const open = () => { sidebar.classList.add('sidebar-open'); overlay.classList.add('overlay-visible'); };
  const close = () => { sidebar.classList.remove('sidebar-open'); overlay.classList.remove('overlay-visible'); };
  btn.addEventListener('click', open);
  overlay.addEventListener('click', close);
}

/* ---------- Sino de aniversários (aparece em todas as páginas) ---------- */
function getUpcomingBirthdays(withinDays = 30) {
  return getPessoas()
    .map(p => ({ ...p, diasRestantes: daysUntilBirthday(p.dataNascimento) }))
    .filter(p => p.diasRestantes <= withinDays)
    .sort((a, b) => a.diasRestantes - b.diasRestantes);
}

/** Atualiza apenas o conteúdo (badge + lista) do sino. Pode ser chamada várias vezes. */
function updateNotificationBellContent() {
  const badge = document.getElementById('notif-badge');
  const list = document.getElementById('notif-list');
  if (!badge || !list) return;

  const upcoming = getUpcomingBirthdays(30);
  const hojeCount = upcoming.filter(p => p.diasRestantes === 0).length;

  badge.classList.remove('badge-pulse');
  if (upcoming.length === 0) {
    badge.classList.add('hidden');
  } else {
    badge.textContent = upcoming.length;
    badge.classList.remove('hidden');
    if (hojeCount > 0) badge.classList.add('badge-pulse');
  }

  list.innerHTML = upcoming.length
    ? upcoming.slice(0, 8).map(p => `
      <a href="pessoas.html?id=${p.id}" class="notif-item">
        <span class="avatar-circle avatar-sm" style="${avatarStyle(p.avatarColor)}">${getInitials(p.nome)}</span>
        <span class="notif-item-text">
          <strong>${escapeHTML(p.nome)}</strong>
          <small>${p.diasRestantes === 0 ? '🎉 Aniversário é hoje!' : p.diasRestantes === 1 ? 'Aniversário amanhã' : `Aniversário em ${p.diasRestantes} dias`}</small>
        </span>
      </a>`).join('')
    : `<div class="notif-empty">Nenhum aniversário nos próximos 30 dias.</div>`;
}

/** Anexa os listeners do sino uma única vez (abrir/fechar dropdown) e faz a 1ª renderização. */
function initNotificationBell() {
  const bellBtn = document.getElementById('notif-bell-btn');
  const dropdown = document.getElementById('notif-dropdown');
  if (!bellBtn || !dropdown) return;

  updateNotificationBellContent();

  bellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('dropdown-visible');
  });
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== bellBtn) {
      dropdown.classList.remove('dropdown-visible');
    }
  });
}

/* ---------- Modal de aniversário do dia (dispara ao entrar no site) ---------- */
function checkTodaysBirthdaysModal() {
  const modal = document.getElementById('birthday-modal');
  if (!modal) return;

  const jaExibidoNestaSessao = sessionStorage.getItem('tw_birthday_modal_shown');
  const aniversariantes = getPessoas().filter(p => isBirthdayToday(p.dataNascimento));

  if (aniversariantes.length === 0 || jaExibidoNestaSessao) return;

  const nomesHTML = aniversariantes.map(p => `
    <div class="birthday-modal-person">
      <span class="avatar-circle avatar-md" style="${avatarStyle(p.avatarColor)}">${getInitials(p.nome)}</span>
      <div>
        <strong>${escapeHTML(p.nome)}</strong>
        <small>${calculateAge(p.dataNascimento)} anos hoje · ${escapeHTML(p.cidade)}</small>
      </div>
    </div>`).join('');

  document.getElementById('birthday-modal-list').innerHTML = nomesHTML;
  modal.classList.add('modal-visible');
  sessionStorage.setItem('tw_birthday_modal_shown', 'true');

  document.getElementById('birthday-modal-close')?.addEventListener('click', () => {
    modal.classList.remove('modal-visible');
  });
}

function getSaudacaoHora() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function initGreeting(nome = 'Manu') {
  const el = document.getElementById('greeting-text');
  const dateEl = document.getElementById('greeting-date');
  if (el) el.textContent = `${getSaudacaoHora()}, ${nome} 👋`;
  if (dateEl) {
    const hoje = new Date();
    const texto = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    dateEl.textContent = texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileSidebar();
  initNotificationBell();
  initGreeting();
});
