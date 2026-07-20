/* ============================================================
   VIAGENS.JS — grid, filtros avançados e CRUD de viagens
   ============================================================ */

let viagemEditandoId = null;
let viagemParaExcluirId = null;
let statusFiltroAtivo = '';

document.addEventListener('DOMContentLoaded', () => {
  popularFiltroCategorias();
  aplicarParametrosDaURL();
  renderViagensGrid();
  initViagensToolbar();
  initViagemModal();
  initConfirmModal();
  handleDeepLink();
  syncGlobalSearch('viagens-busca');
});

function popularFiltroCategorias() {
  const categorias = [...new Set(getViagens().map(v => v.categoria))].sort();
  const select = document.getElementById('viagens-categoria');
  categorias.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat; opt.textContent = cat;
    select.appendChild(opt);
  });
}

function aplicarParametrosDaURL() {
  const params = new URLSearchParams(window.location.search);
  const busca = params.get('busca');
  if (busca) document.getElementById('viagens-busca').value = busca;
}

function renderViagensGrid() {
  const termo = (document.getElementById('viagens-busca')?.value || '').toLowerCase().trim();
  const categoria = document.getElementById('viagens-categoria')?.value || '';
  const periodo = document.getElementById('viagens-periodo')?.value || 'todas';
  const ordenar = document.getElementById('viagens-ordenar')?.value || 'data';
  const hoje = new Date().toISOString().slice(0, 10);
  const hojeDate = new Date(); hojeDate.setHours(0,0,0,0);
  const fimDoMes = new Date(hojeDate.getFullYear(), hojeDate.getMonth() + 1, 0);

  let viagens = getViagens();

  if (termo) {
    viagens = viagens.filter(v =>
      v.nome.toLowerCase().includes(termo) || v.destino.toLowerCase().includes(termo));
  }
  if (categoria) viagens = viagens.filter(v => v.categoria === categoria);
  if (statusFiltroAtivo) viagens = viagens.filter(v => v.status === statusFiltroAtivo);

  if (periodo === 'futuras') {
    viagens = viagens.filter(v => v.dataInicio >= hoje);
  } else if (periodo === 'mes') {
    viagens = viagens.filter(v => {
      const d = parseISODate(v.dataInicio);
      return d >= hojeDate && d <= fimDoMes;
    });
  } else if (periodo === 'passadas') {
    viagens = viagens.filter(v => v.dataFim < hoje);
  }

  switch (ordenar) {
    case 'valor':
      viagens.sort((a, b) => (b.valorTotal || 0) - (a.valorTotal || 0));
      break;
    case 'nome':
      viagens.sort((a, b) => a.nome.localeCompare(b.nome));
      break;
    case 'recentes':
      viagens.sort((a, b) => (b.dataCadastro || '').localeCompare(a.dataCadastro || ''));
      break;
    default:
      viagens.sort((a, b) => a.dataInicio.localeCompare(b.dataInicio));
  }

  const grid = document.getElementById('viagens-grid');
  document.getElementById('viagens-count').textContent = `${viagens.length} viagem${viagens.length !== 1 ? 'ns' : ''}`;

  if (viagens.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-suitcase-rolling"></i>
        <strong>Nenhuma viagem encontrada</strong>
        Tente ajustar os filtros ou cadastre uma nova viagem.
      </div>`;
    return;
  }

  const pessoas = getPessoas();

  grid.innerHTML = viagens.map(v => {
    const participantesInfo = v.participantes.map(id => pessoas.find(p => p.id === id)).filter(Boolean);
    const percentPago = v.valorTotal ? Math.min(100, Math.round((v.valorPago / v.valorTotal) * 100)) : 0;
    
    return `
    <div class="trip-card" data-id="${v.id}">
      <div class="trip-card-cover" style="background-image:url('https://picsum.photos/seed/${encodeURIComponent(v.imagemSeed || v.id)}/600/400');">
        <div class="trip-card-hole"></div>
        <div class="trip-card-category" title="${escapeHTML(v.categoria)}"><i class="fa-solid ${categoriaIcon(v.categoria)}"></i></div>
        <div class="trip-card-status-wrap">${statusBadgeHTML(v.status)}</div>
        <div class="trip-card-title-wrap"><strong>${escapeHTML(v.pais || 'Brasil')}</strong></div>
      </div>
      <div class="trip-card-body">
        <h4 class="trip-card-name">${escapeHTML(v.nome)}</h4>
        <div class="trip-card-dest"><i class="fa-solid fa-location-dot"></i> ${escapeHTML(v.destino)}</div>
        <div class="trip-card-dates"><i class="fa-solid fa-calendar-days"></i> ${formatDateRange(v.dataInicio, v.dataFim)}</div>

        <div class="trip-card-payment">
          <div class="payment-row"><span>Pago <strong>${formatCurrency(v.valorPago)}</strong> de ${formatCurrency(v.valorTotal)}</span><span>${percentPago}%</span></div>
          <div class="payment-bar"><div class="payment-bar-fill" style="width:${percentPago}%;"></div></div>
        </div>

        <div class="trip-card-participants">
          <div class="avatar-stack">
            ${participantesInfo.slice(0, 4).map(p => {
              const isTitular = p.id === v.responsavelId;
              const bordaEstilo = isTitular ? 'border-color: #FFB627; z-index: 2;' : '';
              const title = isTitular ? `${escapeHTML(p.nome)} (Titular)` : escapeHTML(p.nome);
              return `<span class="avatar-circle avatar-sm" style="${avatarStyle(p.avatarColor)} ${bordaEstilo}" title="${title}">${getInitials(p.nome)}</span>`;
            }).join('')}
            ${participantesInfo.length > 4 ? `<span class="avatar-circle avatar-sm" style="background:var(--ocean-mist);color:var(--ocean-deep);">+${participantesInfo.length - 4}</span>` : ''}
            ${participantesInfo.length === 0 ? '<small style="color:var(--ink-faint);">Sem participantes</small>' : ''}
          </div>
        </div>

        <div class="trip-card-footer">
          <button class="btn btn-secondary btn-sm" style="flex:1;" data-edit-viagem="${v.id}"><i class="fa-solid fa-pen"></i> Editar</button>
          <button class="btn btn-danger-ghost btn-sm" data-delete-viagem="${v.id}"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('[data-edit-viagem]').forEach(btn =>
    btn.addEventListener('click', () => openViagemModal(btn.dataset.editViagem)));
  grid.querySelectorAll('[data-delete-viagem]').forEach(btn =>
    btn.addEventListener('click', () => openConfirmDelete(btn.dataset.deleteViagem)));
}

function initViagensToolbar() {
  document.getElementById('viagens-busca').addEventListener('input', debounce(renderViagensGrid, 200));
  document.getElementById('viagens-categoria').addEventListener('change', renderViagensGrid);
  document.getElementById('viagens-periodo').addEventListener('change', renderViagensGrid);
  document.getElementById('viagens-ordenar').addEventListener('change', renderViagensGrid);
  document.getElementById('btn-nova-viagem').addEventListener('click', () => openViagemModal(null));

  document.querySelectorAll('#status-chip-group .filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#status-chip-group .filter-chip').forEach(c => c.classList.remove('chip-active'));
      chip.classList.add('chip-active');
      statusFiltroAtivo = chip.dataset.status;
      renderViagensGrid();
    });
  });
}

function syncGlobalSearch(localInputId) {
  const globalInput = document.getElementById('global-search');
  const localInput = document.getElementById(localInputId);
  if (!globalInput || !localInput) return;
  globalInput.addEventListener('input', debounce(() => {
    localInput.value = globalInput.value;
    localInput.dispatchEvent(new Event('input'));
  }, 150));
}

function initViagemModal() {
  document.querySelectorAll('[data-close-modal="viagem-modal"]').forEach(btn =>
    btn.addEventListener('click', () => closeModal('viagem-modal')));
  document.getElementById('viagem-form').addEventListener('submit', (e) => {
    e.preventDefault();
    salvarViagem();
  });
}

function renderParticipantesCheckboxes(selecionados = []) {
  const pessoas = [...getPessoas()].sort((a, b) => a.nome.localeCompare(b.nome));
  const container = document.getElementById('v-participantes-grid');
  
  if (pessoas.length === 0) {
    container.innerHTML = `<small style="color:var(--ink-faint);">Cadastre pessoas primeiro para vinculá-las a uma viagem.</small>`;
    return;
  }
  
  container.innerHTML = pessoas.map(p => `
    <label class="checkbox-person">
      <input type="checkbox" value="${p.id}" ${selecionados.includes(p.id) ? 'checked' : ''}>
      <span class="avatar-circle avatar-sm" style="${avatarStyle(p.avatarColor)}">${getInitials(p.nome)}</span>
      ${escapeHTML(p.nome.split(' ')[0] + ' ' + p.nome.split(' ').slice(-1))}
    </label>`).join('');
}

// Popula a lista do select de Titular/Responsável
function renderResponsavelSelect(selecionadoId = '') {
  const pessoas = [...getPessoas()].sort((a, b) => a.nome.localeCompare(b.nome));
  const select = document.getElementById('v-responsavel');
  
  select.innerHTML = '<option value="">Sem titular definido</option>' + 
    pessoas.map(p => `
      <option value="${p.id}" ${selecionadoId === p.id ? 'selected' : ''}>
        ${escapeHTML(p.nome)}
      </option>
    `).join('');
}

function openViagemModal(id) {
  viagemEditandoId = id;
  const form = document.getElementById('viagem-form');
  form.reset();

  if (id) {
    const v = getViagemById(id);
    if (!v) return;
    document.getElementById('viagem-modal-title').textContent = 'Editar viagem';
    document.getElementById('v-nome').value = v.nome;
    document.getElementById('v-destino').value = v.destino;
    document.getElementById('v-pais').value = v.pais || 'Brasil';
    document.getElementById('v-categoria').value = v.categoria;
    document.getElementById('v-status').value = v.status;
    document.getElementById('v-inicio').value = v.dataInicio;
    document.getElementById('v-fim').value = v.dataFim;
    document.getElementById('v-valor-total').value = v.valorTotal || 0;
    document.getElementById('v-valor-pago').value = v.valorPago || 0;
    document.getElementById('v-observacoes').value = v.observacoes || '';
    
    renderResponsavelSelect(v.responsavelId || '');
    renderParticipantesCheckboxes(v.participantes || []);
  } else {
    document.getElementById('viagem-modal-title').textContent = 'Nova viagem';
    renderResponsavelSelect('');
    renderParticipantesCheckboxes([]);
  }

  openModal('viagem-modal');
}

function salvarViagem() {
  const participantes = [...document.querySelectorAll('#v-participantes-grid input[type="checkbox"]:checked')]
    .map(cb => cb.value);

  const responsavelId = document.getElementById('v-responsavel').value || null;

  // Se o responsável foi selecionado mas não estava marcado nos checkboxes, nós o incluímos automaticamente
  if (responsavelId && !participantes.includes(responsavelId)) {
    participantes.push(responsavelId);
  }

  const data = {
    nome: document.getElementById('v-nome').value.trim(),
    destino: document.getElementById('v-destino').value.trim(),
    pais: document.getElementById('v-pais').value.trim() || 'Brasil',
    categoria: document.getElementById('v-categoria').value,
    status: document.getElementById('v-status').value,
    dataInicio: document.getElementById('v-inicio').value,
    dataFim: document.getElementById('v-fim').value,
    valorTotal: Number(document.getElementById('v-valor-total').value) || 0,
    valorPago: Number(document.getElementById('v-valor-pago').value) || 0,
    observacoes: document.getElementById('v-observacoes').value.trim(),
    responsavelId: responsavelId,
    participantes: participantes
  };

  if (!data.nome || !data.destino || !data.dataInicio || !data.dataFim) {
    showToast('Preencha nome, destino e as datas da viagem.', 'erro');
    return;
  }
  if (data.dataFim < data.dataInicio) {
    showToast('A data de fim não pode ser antes da data de início.', 'erro');
    return;
  }

  if (viagemEditandoId) {
    const original = getViagemById(viagemEditandoId);
    updateViagem(viagemEditandoId, { ...data, imagemSeed: original?.imagemSeed });
    showToast('Viagem atualizada com sucesso.', 'sucesso');
  } else {
    addViagem({ ...data, imagemSeed: generateId('img') });
    showToast('Viagem cadastrada com sucesso.', 'sucesso');
  }

  closeModal('viagem-modal');
  popularFiltroCategorias();
  renderViagensGrid();
}

function initConfirmModal() {
  document.querySelectorAll('[data-close-modal="confirm-modal"]').forEach(btn =>
    btn.addEventListener('click', () => closeModal('confirm-modal')));
  document.getElementById('confirm-modal-btn').addEventListener('click', () => {
    if (!viagemParaExcluirId) return;
    deleteViagem(viagemParaExcluirId);
    showToast('Viagem removida.', 'info');
    closeModal('confirm-modal');
    renderViagensGrid();
  });
}

function openConfirmDelete(id) {
  const v = getViagemById(id);
  if (!v) return;
  viagemParaExcluirId = id;
  document.getElementById('confirm-modal-text').textContent = `Remover "${v.nome}"? Essa ação não pode ser desfeita.`;
  openModal('confirm-modal');
}

function openModal(id) { document.getElementById(id).classList.add('modal-visible'); }
function closeModal(id) { document.getElementById(id).classList.remove('modal-visible'); }

function handleDeepLink() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (id && getViagemById(id)) {
    openViagemModal(id);
  }
}