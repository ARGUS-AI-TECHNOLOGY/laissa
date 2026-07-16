/* ============================================================
   DASHBOARD.JS — estatísticas, gráficos e widgets do painel
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  renderStatTickets();
  renderChartFinanceiro();
  renderChartStatus();
  renderAniversariosWidget();
  renderProximasViagensWidget();
  renderDestinosWidget();
  initGlobalSearch();
});

/* ---------- Stat tickets ---------- */
function renderStatTickets() {
  const pessoas = getPessoas();
  const viagens = getViagens();

  const totalViagens = viagens.length;
  const totalPessoas = pessoas.length;
  const receitaTotal = viagens.reduce((sum, v) => sum + (v.valorTotal || 0), 0);
  const totalPago = viagens.reduce((sum, v) => sum + (v.valorPago || 0), 0);
  const percentPago = receitaTotal ? Math.round((totalPago / receitaTotal) * 100) : 0;
  const emAndamento = viagens.filter(v => v.status === 'Em andamento').length;

  const pessoasNovas30d = pessoas.filter(p => daysSinceISO(p.dataCadastro) <= 30).length;
  const viagensNovas30d = viagens.filter(v => daysSinceISO(v.dataCadastro) <= 30).length;

  const cards = [
    {
      icon: 'fa-plane', iconBg: '#D7EDE9', iconFg: '#0A4B47',
      value: totalViagens, label: 'Viagens cadastradas',
      trend: `+${viagensNovas30d} nos últimos 30d`, trendClass: 'info',
      code: `TOTAL · ${totalViagens} VIAGENS`
    },
    {
      icon: 'fa-users', iconBg: '#FFE1DC', iconFg: '#D8452F',
      value: totalPessoas, label: 'Pessoas cadastradas',
      trend: `+${pessoasNovas30d} nos últimos 30d`, trendClass: 'info',
      code: `BASE · ${totalPessoas} CONTATOS`
    },
    {
      icon: 'fa-sack-dollar', iconBg: '#FFEFC7', iconFg: '#8A5B00',
      value: formatCurrency(receitaTotal), label: 'Receita total gerenciada',
      trend: `${percentPago}% já recebido`, trendClass: percentPago >= 60 ? 'up' : 'warn',
      code: `RECEBIDO · ${formatCurrency(totalPago)}`
    },
    {
      icon: 'fa-route', iconBg: '#FFE1DC', iconFg: '#B8321A',
      value: emAndamento, label: 'Viagens em andamento agora',
      trend: emAndamento > 0 ? 'Rolando agora' : 'Nenhuma hoje', trendClass: emAndamento > 0 ? 'up' : 'info',
      code: `AO VIVO · ${emAndamento} EM CURSO`
    }
  ];

  document.getElementById('stats-grid').innerHTML = cards.map(c => `
    <div class="stat-ticket">
      <div class="stat-ticket-top">
        <span class="stat-icon-badge" style="background:${c.iconBg};color:${c.iconFg};"><i class="fa-solid ${c.icon}"></i></span>
        <span class="stat-trend ${c.trendClass}">${c.trend}</span>
      </div>
      <div class="stat-ticket-value">${c.value}</div>
      <div class="stat-ticket-label">${c.label}</div>
      <div class="stat-ticket-perf"></div>
      <div class="stat-ticket-code">${c.code}</div>
    </div>
  `).join('');
}

function daysSinceISO(iso) {
  if (!iso) return 9999;
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const d = parseISODate(iso);
  return Math.round((hoje - d) / (1000 * 60 * 60 * 24));
}

/* ---------- Gráfico financeiro (barras: total vs pago) ---------- */
function renderChartFinanceiro() {
  const viagens = [...getViagens()]
    .sort((a, b) => (b.valorTotal || 0) - (a.valorTotal || 0))
    .slice(0, 6);

  const labels = viagens.map(v => v.destino.length > 16 ? v.destino.slice(0, 15) + '…' : v.destino);
  const totais = viagens.map(v => v.valorTotal || 0);
  const pagos = viagens.map(v => v.valorPago || 0);

  const ctx = document.getElementById('chart-financeiro');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Total contratado', data: totais, backgroundColor: '#D7EDE9', borderColor: '#0A4B47', borderWidth: 1.5, borderRadius: 6, maxBarThickness: 28 },
        { label: 'Valor pago', data: pagos, backgroundColor: '#FF6B5B', borderRadius: 6, maxBarThickness: 28 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: "'Plus Jakarta Sans'", size: 11 }, color: '#587471', usePointStyle: true, boxWidth: 8 } },
        tooltip: {
          backgroundColor: '#0A4B47', padding: 10, cornerRadius: 8,
          callbacks: { label: (c) => `${c.dataset.label}: ${formatCurrency(c.raw)}` }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: "'Space Mono'", size: 10 }, color: '#587471' } },
        y: { grid: { color: '#EDE5D8' }, ticks: { callback: (v) => 'R$ ' + (v / 1000) + 'k', font: { family: "'Space Mono'", size: 10 }, color: '#587471' } }
      }
    }
  });
}

/* ---------- Gráfico de status (doughnut) ---------- */
function renderChartStatus() {
  const viagens = getViagens();
  const contagem = {};
  viagens.forEach(v => { contagem[v.status] = (contagem[v.status] || 0) + 1; });

  const labels = Object.keys(contagem);
  const valores = Object.values(contagem);
  const cores = labels.map(s => (STATUS_STYLES[s] || STATUS_STYLES.Planejada).dot);

  const ctx = document.getElementById('chart-status');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: valores, backgroundColor: cores, borderColor: '#fff', borderWidth: 3 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '68%',
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: "'Plus Jakarta Sans'", size: 11 }, color: '#587471', usePointStyle: true, boxWidth: 8, padding: 12 } },
        tooltip: { backgroundColor: '#0A4B47', padding: 10, cornerRadius: 8 }
      }
    }
  });
}

/* ---------- Widget: próximos aniversários ---------- */
function renderAniversariosWidget() {
  const el = document.getElementById('aniversarios-widget');
  const proximos = getUpcomingBirthdays(60).slice(0, 5);

  if (proximos.length === 0) {
    el.innerHTML = `<div class="empty-state" style="padding:2rem 1rem;"><i class="fa-solid fa-cake-candles"></i><strong>Nada por aqui</strong>Nenhum aniversário nos próximos 60 dias.</div>`;
    return;
  }

  el.innerHTML = proximos.map(p => {
    const cls = p.diasRestantes === 0 ? 'today' : p.diasRestantes <= 7 ? 'soon' : 'later';
    const texto = p.diasRestantes === 0 ? 'Hoje! 🎉' : p.diasRestantes === 1 ? 'Amanhã' : `Em ${p.diasRestantes} dias`;
    return `
      <div class="postcard-item">
        <span class="avatar-circle avatar-md" style="${avatarStyle(p.avatarColor)}">${getInitials(p.nome)}</span>
        <div>
          <strong style="display:block;font-size:.88rem;">${escapeHTML(p.nome)}</strong>
          <small style="color:var(--ink-soft);font-size:.76rem;">Fará ${calculateAge(p.dataNascimento) + (p.diasRestantes === 0 ? 0 : 1)} anos · ${escapeHTML(p.cidade)}</small>
        </div>
        <span class="postmark ${cls}">${texto}</span>
      </div>`;
  }).join('');
}

/* ---------- Widget: próximas viagens ---------- */
function renderProximasViagensWidget() {
  const el = document.getElementById('proximas-viagens-widget');
  const hoje = new Date().toISOString().slice(0, 10);
  const proximas = getViagens()
    .filter(v => v.status !== 'Cancelada' && v.status !== 'Concluída')
    .sort((a, b) => a.dataInicio.localeCompare(b.dataInicio))
    .slice(0, 5);

  if (proximas.length === 0) {
    el.innerHTML = `<div class="empty-state" style="padding:2rem 1rem;"><i class="fa-solid fa-suitcase-rolling"></i><strong>Nada por aqui</strong>Nenhuma viagem futura cadastrada.</div>`;
    return;
  }

  el.innerHTML = proximas.map(v => {
    const dias = daysUntil(v.dataInicio);
    const quando = v.status === 'Em andamento' ? 'Em andamento agora' : dias === 0 ? 'Começa hoje' : dias < 0 ? 'Em curso' : `Em ${dias} dias`;
    return `
      <a href="viagens.html?id=${v.id}" class="trip-mini">
        <span class="trip-mini-icon" style="background:var(--ocean-mist);color:var(--ocean-deep);"><i class="fa-solid ${categoriaIcon(v.categoria)}"></i></span>
        <span class="trip-mini-info">
          <strong>${escapeHTML(v.nome)}</strong>
          <small>${escapeHTML(v.destino)} · ${formatDateRange(v.dataInicio, v.dataFim)}</small>
        </span>
        <span class="postmark later" style="margin-left:0;">${quando}</span>
      </a>`;
  }).join('');
}

/* ---------- Widget: destinos mais procurados ---------- */
function renderDestinosWidget() {
  const el = document.getElementById('destinos-widget');
  const viagens = getViagens();
  const contagem = {};
  viagens.forEach(v => { contagem[v.destino] = (contagem[v.destino] || 0) + 1; });

  const ranking = Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = ranking.length ? ranking[0][1] : 1;

  if (ranking.length === 0) {
    el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-map-location-dot"></i><strong>Nada por aqui</strong>Cadastre viagens para ver o ranking.</div>`;
    return;
  }

  el.innerHTML = `<div style="display:flex;flex-direction:column;gap:.9rem;">` + ranking.map(([destino, count], idx) => `
    <div>
      <div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:.35rem;">
        <span><strong class="font-mono" style="color:var(--coral);">#${idx + 1}</strong> &nbsp;${escapeHTML(destino)}</span>
        <span class="font-mono" style="color:var(--ink-soft);">${count} viagem${count > 1 ? 'ns' : ''}</span>
      </div>
      <div class="payment-bar"><div class="payment-bar-fill" style="width:${(count / max) * 100}%;"></div></div>
    </div>
  `).join('') + `</div>`;
}

/* ---------- Busca global (topo) ---------- */
function initGlobalSearch() {
  const input = document.getElementById('global-search');
  if (!input) return;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      window.location.href = `viagens.html?busca=${encodeURIComponent(input.value.trim())}`;
    }
  });
}
