/* ============================================================
   PESSOAS.JS — grid, busca/ordenação e CRUD de pessoas
   ============================================================ */

let pessoaEditandoId = null;
let pessoaParaExcluirId = null;

document.addEventListener('DOMContentLoaded', () => {
  renderPessoasGrid();
  initPessoasToolbar();
  initPessoaModal();
  initConfirmModal();
  handleDeepLink();
  syncGlobalSearch('pessoas-busca');
});

/* ---------- Render principal ---------- */
/* ---------- Render principal ---------- */
function renderPessoasGrid() {
  const termo = (document.getElementById('pessoas-busca')?.value || '').toLowerCase().trim();
  const ordenar = document.getElementById('pessoas-ordenar')?.value || 'nome';

  let pessoas = getPessoas();

  if (termo) {
    pessoas = pessoas.filter(p =>
      p.nome.toLowerCase().includes(termo) ||
      (p.cidade || '').toLowerCase().includes(termo) ||
      (p.email || '').toLowerCase().includes(termo)
    );
  }

  pessoas = pessoas.map(p => ({ ...p, _diasAniversario: daysUntilBirthday(p.dataNascimento) }));

  switch (ordenar) {
    case 'aniversario':
      pessoas.sort((a, b) => a._diasAniversario - b._diasAniversario);
      break;
    case 'cidade':
      pessoas.sort((a, b) => (a.cidade || '').localeCompare(b.cidade || ''));
      break;
    case 'recentes':
      pessoas.sort((a, b) => (b.dataCadastro || '').localeCompare(a.dataCadastro || ''));
      break;
    default:
      pessoas.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  const grid = document.getElementById('pessoas-grid');
  document.getElementById('pessoas-count').textContent = `${pessoas.length} pessoa${pessoas.length !== 1 ? 's' : ''}`;

  if (pessoas.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-user-magnifying-glass"></i>
        <strong>Nenhuma pessoa encontrada</strong>
        Tente ajustar sua busca ou cadastre uma nova pessoa.
      </div>`;
    return;
  }

  const viagens = getViagens();

  grid.innerHTML = pessoas.map(p => {
    const idade = calculateAge(p.dataNascimento);
    const viagensDaPessoa = viagens.filter(v => (v.participantes || []).includes(p.id)).length;
    
    // NOVIDADE: Conta em quantas viagens essa pessoa é a responsável financeira
    const titularEm = viagens.filter(v => v.responsavelId === p.id).length;
    
    const aniversarioHoje = p._diasAniversario === 0;
    
    return `
    <div class="pessoa-card" data-id="${p.id}">
      ${aniversarioHoje ? '<span class="pessoa-card-birthday-flag" title="Aniversário hoje!">🎂</span>' : ''}
      <div class="pessoa-card-top">
        <span class="avatar-circle avatar-lg" style="${avatarStyle(p.avatarColor)}">${getInitials(p.nome)}</span>
        <div>
          <strong>${escapeHTML(p.nome)}</strong>
          <small>${idade} anos · ${escapeHTML(p.cidade || 'Cidade não informada')}${p.uf ? '/' + escapeHTML(p.uf) : ''}</small>
        </div>
      </div>
      <div class="pessoa-card-info">
        <span><i class="fa-solid fa-envelope"></i> ${escapeHTML(p.email || 'Não informado')}</span>
        <span><i class="fa-solid fa-phone"></i> ${escapeHTML(p.telefone || 'Não informado')}</span>
        <span><i class="fa-solid fa-cake-candles"></i> ${formatDate(p.dataNascimento, 'completo')}</span>
        <span><i class="fa-solid fa-suitcase-rolling"></i> ${viagensDaPessoa} viagem${viagensDaPessoa !== 1 ? 'ns' : ''} vinculada${viagensDaPessoa !== 1 ? 's' : ''}</span>
        
        <!-- NOVIDADE: Mostra a estrela de titular se ela for responsável por alguma viagem -->
        ${titularEm > 0 ? `<span><i class="fa-solid fa-star" style="color:#FFB627;"></i> Titular em ${titularEm} pacote${titularEm !== 1 ? 's' : ''}</span>` : ''}
      </div>
      <div class="pessoa-card-actions">
        <button class="btn btn-secondary btn-sm" style="flex:1;" data-edit-pessoa="${p.id}"><i class="fa-solid fa-pen"></i> Editar</button>
        <button class="btn btn-danger-ghost btn-sm" data-delete-pessoa="${p.id}"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('[data-edit-pessoa]').forEach(btn =>
    btn.addEventListener('click', () => openPessoaModal(btn.dataset.editPessoa)));
  grid.querySelectorAll('[data-delete-pessoa]').forEach(btn =>
    btn.addEventListener('click', () => openConfirmDelete(btn.dataset.deletePessoa)));
}

/* ---------- Toolbar (busca + ordenação) ---------- */
function initPessoasToolbar() {
  document.getElementById('pessoas-busca').addEventListener('input', debounce(renderPessoasGrid, 200));
  document.getElementById('pessoas-ordenar').addEventListener('change', renderPessoasGrid);
  document.getElementById('btn-nova-pessoa').addEventListener('click', () => openPessoaModal(null));
}

/* Sincroniza a busca do topo com o campo de busca local da página */
function syncGlobalSearch(localInputId) {
  const globalInput = document.getElementById('global-search');
  const localInput = document.getElementById(localInputId);
  if (!globalInput || !localInput) return;
  globalInput.addEventListener('input', debounce(() => {
    localInput.value = globalInput.value;
    localInput.dispatchEvent(new Event('input'));
  }, 150));
}

/* ---------- Modal: Nova / Editar pessoa ---------- */
function initPessoaModal() {
  document.querySelectorAll('[data-close-modal="pessoa-modal"]').forEach(btn =>
    btn.addEventListener('click', () => closeModal('pessoa-modal')));

  // Submissão normal do formulário (botão "Salvar e fechar")
  document.getElementById('pessoa-form').addEventListener('submit', (e) => {
    e.preventDefault();
    salvarPessoa(true); // true = deve fechar o modal ao final
  });

  // Ação do novo botão "Salvar e adicionar outra"
  document.getElementById('btn-salvar-adicionar').addEventListener('click', () => {
    const form = document.getElementById('pessoa-form');
    // reportValidity() força o HTML a checar se os campos com "required" foram preenchidos
    if (form.reportValidity()) {
      salvarPessoa(false); // false = NÃO fechar o modal ao final
    }
  });
}

function openPessoaModal(id) {
  pessoaEditandoId = id;
  const form = document.getElementById('pessoa-form');
  form.reset();

  const btnAdicionarOutra = document.getElementById('btn-salvar-adicionar');
  const btnSalvarFechar = document.getElementById('btn-salvar-fechar');

  if (id) {
    const p = getPessoaById(id);
    if (!p) return;
    document.getElementById('pessoa-modal-title').textContent = 'Editar pessoa';
    document.getElementById('f-nome').value = p.nome;
    document.getElementById('f-email').value = p.email || '';
    document.getElementById('f-telefone').value = p.telefone || '';
    document.getElementById('f-nascimento').value = p.dataNascimento;
    document.getElementById('f-documento').value = p.documento || '';
    document.getElementById('f-cidade').value = p.cidade || '';
    document.getElementById('f-uf').value = p.uf || '';
    document.getElementById('f-observacoes').value = p.observacoes || '';
    const radio = form.querySelector(`input[name="avatarColor"][value="${p.avatarColor}"]`);
    if (radio) radio.checked = true;

    // Se estiver editando, escondemos o botão de "Adicionar outra" para não confundir o usuário
    btnAdicionarOutra.style.display = 'none';
    btnSalvarFechar.innerHTML = '<i class="fa-solid fa-check"></i> Salvar alterações';
  } else {
    document.getElementById('pessoa-modal-title').textContent = 'Nova pessoa';
    
    // Se for cadastro novo, garantimos que o botão "Adicionar outra" apareça
    btnAdicionarOutra.style.display = 'inline-flex';
    btnSalvarFechar.innerHTML = '<i class="fa-solid fa-check"></i> Salvar e fechar';
  }

  openModal('pessoa-modal');
}

function salvarPessoa(fecharModal) {
  const data = {
    nome: document.getElementById('f-nome').value.trim(),
    email: document.getElementById('f-email').value.trim(),
    telefone: document.getElementById('f-telefone').value.trim(),
    dataNascimento: document.getElementById('f-nascimento').value,
    documento: document.getElementById('f-documento').value.trim(),
    cidade: document.getElementById('f-cidade').value.trim(),
    uf: document.getElementById('f-uf').value.trim().toUpperCase(),
    observacoes: document.getElementById('f-observacoes').value.trim(),
    avatarColor: document.querySelector('input[name="avatarColor"]:checked')?.value || 'teal'
  };

  if (!data.nome || !data.dataNascimento) {
    showToast('Preencha nome e data de nascimento.', 'erro');
    return;
  }

  if (pessoaEditandoId) {
    updatePessoa(pessoaEditandoId, data);
    showToast('Pessoa atualizada com sucesso.', 'sucesso');
  } else {
    addPessoa(data);
    showToast('Pessoa cadastrada com sucesso.', 'sucesso');
  }

  renderPessoasGrid();
  
  // Atualiza a notificação de aniversários, caso a função exista no seu código
  if (typeof updateNotificationBellContent === 'function') {
    updateNotificationBellContent();
  }

  if (fecharModal) {
    // Fecha o modal se o usuário clicou em "Salvar e fechar"
    closeModal('pessoa-modal');
  } else {
    // Se clicou em "Salvar e adicionar outra", reseta o form, limpa os IDs e foca no nome
    document.getElementById('pessoa-form').reset();
    pessoaEditandoId = null;
    document.getElementById('f-nome').focus(); // Coloca o cursor piscando no campo Nome
  }
}

/* ---------- Modal: Confirmar exclusão ---------- */
function initConfirmModal() {
  document.querySelectorAll('[data-close-modal="confirm-modal"]').forEach(btn =>
    btn.addEventListener('click', () => closeModal('confirm-modal')));
  document.getElementById('confirm-modal-btn').addEventListener('click', () => {
    if (!pessoaParaExcluirId) return;
    deletePessoa(pessoaParaExcluirId);
    showToast('Pessoa removida.', 'info');
    closeModal('confirm-modal');
    renderPessoasGrid();
    updateNotificationBellContent();
  });
}

function openConfirmDelete(id) {
  const p = getPessoaById(id);
  if (!p) return;
  pessoaParaExcluirId = id;
  document.getElementById('confirm-modal-text').textContent =
    `Remover "${p.nome}"? Essa ação não pode ser desfeita e ela será removida de qualquer viagem vinculada.`;
  openModal('confirm-modal');
}

/* ---------- Helpers genéricos de modal ---------- */
function openModal(id) {
  document.getElementById(id).classList.add('modal-visible');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('modal-visible');
}

/* ---------- Deep link: pessoas.html?id=xxx abre direto a edição ---------- */
function handleDeepLink() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (id && getPessoaById(id)) {
    openPessoaModal(id);
  }
}
