/* ============================================================
   CADASTRO_TURISTA.JS — Atualizado com Titular e Status
   ============================================================ */

let turistasTemporarios = [];
const coresAvatar = ['teal', 'coral', 'yellow', 'papaya'];

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-add-turista').addEventListener('click', adicionarTuristaNaFila);
  document.getElementById('form-pacote').addEventListener('submit', finalizarCadastroCompleto);
});

function adicionarTuristaNaFila() {
  const nome = document.getElementById('t-nome').value.trim();
  const dataNascimento = document.getElementById('t-nascimento').value;
  const isResponsavelCheckbox = document.getElementById('t-responsavel');
  
  if (!nome || !dataNascimento) {
    showToast('Preencha pelo menos o Nome e a Data de Nascimento do turista.', 'erro');
    return;
  }

  const novoTurista = {
    nome: nome,
    email: document.getElementById('t-email').value.trim(),
    telefone: document.getElementById('t-telefone').value.trim(),
    dataNascimento: dataNascimento,
    documento: document.getElementById('t-documento').value.trim(),
    cidade: document.getElementById('t-cidade').value.trim(),
    uf: document.getElementById('t-uf').value.trim().toUpperCase(),
    avatarColor: coresAvatar[Math.floor(Math.random() * coresAvatar.length)],
    observacoes: 'Cadastrado via pacote.',
    isResponsavel: isResponsavelCheckbox.checked // Captura se é o responsável
  };

  turistasTemporarios.push(novoTurista);
  
  // Se marcou como responsável, bloqueia o input para os próximos
  if (isResponsavelCheckbox.checked) {
    isResponsavelCheckbox.checked = false;
    isResponsavelCheckbox.disabled = true; 
    isResponsavelCheckbox.parentElement.style.opacity = '0.5'; // Deixa visualmente desativado
  }
  
  showToast(`${nome} adicionado ao grupo!`, 'info');
  limparFormularioTurista();
  renderizarGrupo();
}

function limparFormularioTurista() {
  document.getElementById('t-nome').value = '';
  document.getElementById('t-email').value = '';
  document.getElementById('t-telefone').value = '';
  document.getElementById('t-nascimento').value = '';
  document.getElementById('t-documento').value = '';
}

function renderizarGrupo() {
  const container = document.getElementById('grupo-adicionado');
  
  if (turistasTemporarios.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = turistasTemporarios.map((t, index) => `
    <div class="filter-chip chip-active" style="display:flex; align-items:center; gap:0.5rem; background: var(--ocean-deep); border: ${t.isResponsavel ? '2px solid #FFB627' : 'none'}">
      <span class="avatar-circle avatar-sm" style="${avatarStyle(t.avatarColor)}">${getInitials(t.nome)}</span>
      ${t.nome.split(' ')[0]} 
      ${t.isResponsavel ? '<i class="fa-solid fa-star" style="color:#FFB627; margin-left:4px;" title="Titular"></i>' : ''}
      <i class="fa-solid fa-xmark" style="cursor:pointer; margin-left:5px;" onclick="removerTuristaDaFila(${index})"></i>
    </div>
  `).join('');
}

window.removerTuristaDaFila = function(index) {
  // Se estivermos removendo quem era o responsável, libera o checkbox novamente
  if (turistasTemporarios[index].isResponsavel) {
    const isResponsavelCheckbox = document.getElementById('t-responsavel');
    isResponsavelCheckbox.disabled = false;
    isResponsavelCheckbox.parentElement.style.opacity = '1';
  }

  turistasTemporarios.splice(index, 1);
  renderizarGrupo();
};

function finalizarCadastroCompleto(e) {
  e.preventDefault();

  const nomePendente = document.getElementById('t-nome').value.trim();
  if (nomePendente) {
    adicionarTuristaNaFila();
  }

  if (turistasTemporarios.length === 0) {
    showToast('Você precisa adicionar pelo menos um turista ao pacote!', 'erro');
    return;
  }

  const participantesIds = [];
  let idDoResponsavel = null; // Variável para guardar quem é o titular da viagem

  // 1. Salvar os turistas e identificar o responsável
  turistasTemporarios.forEach(turista => {
    // Guarda se era responsável antes de enviar ao DB (para não sujar os dados da pessoa se não quiser)
    const eraResponsavel = turista.isResponsavel; 
    delete turista.isResponsavel; // Remove essa flag temporária, pois é algo relacionado à Viagem, não à Pessoa.

    const pessoaSalva = addPessoa(turista); 
    participantesIds.push(pessoaSalva.id);

    if (eraResponsavel) {
      idDoResponsavel = pessoaSalva.id;
    }
  });

  // Se o usuário esqueceu de marcar um responsável, define o primeiro da lista automaticamente
  if (!idDoResponsavel) {
    idDoResponsavel = participantesIds[0];
  }

  // 2. Criar a Viagem incluindo Status e Responsável
  const novaViagem = {
    nome: document.getElementById('v-nome').value.trim(),
    destino: document.getElementById('v-destino').value.trim(),
    categoria: document.getElementById('v-categoria').value,
    status: document.getElementById('v-status').value, // <--- Puxando o status correto
    dataInicio: document.getElementById('v-data-inicio').value,
    dataFim: document.getElementById('v-data-fim').value,
    valorTotal: parseFloat(document.getElementById('v-valor').value) || 0,
    valorPago: parseFloat(document.getElementById('v-pago').value) || 0,
    participantes: participantesIds,
    responsavelId: idDoResponsavel // <--- Vinculando quem é o titular do pacote
  };

  // 3. Salvar viagem
  addViagem(novaViagem); 

  showToast('Pacote cadastrado com sucesso! Redirecionando...', 'sucesso');
  
  setTimeout(() => {
    window.location.href = 'viagens.html'; 
  }, 1500);
}