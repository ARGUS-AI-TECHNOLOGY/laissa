/* ============================================================
   DB.JS — "Banco de dados" local usando localStorage
   Popula dados mockados na primeira execução e expõe funções
   CRUD simples para Pessoas e Viagens.
   ============================================================ */

const DB_KEYS = {
  PESSOAS: 'tw_pessoas',
  VIAGENS: 'tw_viagens',
  SEEDED: 'tw_seeded_v2'
};

/* ---------- Helpers de data relativa a hoje (16/07/2026) ---------- */
function isoDaysFromToday(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function isoDateWithYear(monthDay, year) {
  return `${year}-${monthDay}`;
}

/* ---------- Seed: Pessoas ---------- */
const SEED_PESSOAS = [
  { nome: 'Camila Rocha Ferreira', email: 'camila.rocha@email.com', telefone: '(81) 99123-4501', dataNascimento: isoDateWithYear('07-16', 1994), cidade: 'Recife', uf: 'PE', documento: '482.113.220-05', avatarColor: 'coral', observacoes: 'Cliente fiel, prefere viagens de praia.' },
  { nome: 'Thiago Almeida Souza', email: 'thiago.almeida@email.com', telefone: '(81) 99123-4502', dataNascimento: isoDateWithYear('07-19', 1988), cidade: 'Olinda', uf: 'PE', documento: '392.884.110-22', avatarColor: 'teal', observacoes: '' },
  { nome: 'Beatriz Nunes Cardoso', email: 'bia.cardoso@email.com', telefone: '(81) 99123-4503', dataNascimento: isoDateWithYear('07-25', 1996), cidade: 'Recife', uf: 'PE', documento: '501.223.998-31', avatarColor: 'yellow', observacoes: 'Alérgica a frutos do mar, avisar hotéis.' },
  { nome: 'Rafael Costa Lima', email: 'rafael.lima@email.com', telefone: '(81) 99123-4504', dataNascimento: isoDateWithYear('01-08', 1991), cidade: 'Caruaru', uf: 'PE', documento: '287.556.410-77', avatarColor: 'papaya', observacoes: '' },
  { nome: 'Juliana Martins Braga', email: 'ju.braga@email.com', telefone: '(81) 99123-4505', dataNascimento: isoDateWithYear('03-14', 1993), cidade: 'Recife', uf: 'PE', documento: '664.112.880-09', avatarColor: 'teal', observacoes: 'Viaja muito a trabalho.' },
  { nome: 'Eduardo Pereira Gomes', email: 'edu.gomes@email.com', telefone: '(81) 99123-4506', dataNascimento: isoDateWithYear('11-30', 1985), cidade: 'Jaboatão dos Guararapes', uf: 'PE', documento: '119.774.552-64', avatarColor: 'coral', observacoes: '' },
  { nome: 'Larissa Oliveira Dias', email: 'larissa.dias@email.com', telefone: '(81) 99123-4507', dataNascimento: isoDateWithYear('09-02', 1997), cidade: 'Recife', uf: 'PE', documento: '773.221.005-18', avatarColor: 'yellow', observacoes: 'Passaporte válido até 2029.' },
  { nome: 'Gustavo Henrique Melo', email: 'gustavo.melo@email.com', telefone: '(81) 99123-4508', dataNascimento: isoDateWithYear('05-21', 1990), cidade: 'Igarassu', uf: 'PE', documento: '556.998.221-40', avatarColor: 'papaya', observacoes: '' },
  { nome: 'Fernanda Ribeiro Alves', email: 'fe.alves@email.com', telefone: '(81) 99123-4509', dataNascimento: isoDateWithYear('08-04', 1989), cidade: 'Recife', uf: 'PE', documento: '341.887.660-52', avatarColor: 'teal', observacoes: 'Sempre viaja com a família (2 filhos).' },
  { nome: 'Marcelo Santos Barros', email: 'marcelo.barros@email.com', telefone: '(81) 99123-4510', dataNascimento: isoDateWithYear('02-27', 1982), cidade: 'Recife', uf: 'PE', documento: '229.443.117-83', avatarColor: 'coral', observacoes: '' },
  { nome: 'Patrícia Fonseca Lopes', email: 'pati.lopes@email.com', telefone: '(81) 99123-4511', dataNascimento: isoDateWithYear('12-19', 1995), cidade: 'Paulista', uf: 'PE', documento: '887.556.230-91', avatarColor: 'yellow', observacoes: '' },
  { nome: 'André Luiz Teixeira', email: 'andre.teixeira@email.com', telefone: '(81) 99123-4512', dataNascimento: isoDateWithYear('04-11', 1992), cidade: 'Recife', uf: 'PE', documento: '118.220.774-36', avatarColor: 'papaya', observacoes: 'Prefere destinos de aventura/trilha.' },
  { nome: 'Vanessa Cunha Moreira', email: 'vanessa.moreira@email.com', telefone: '(81) 99123-4513', dataNascimento: isoDateWithYear('07-29', 1998), cidade: 'Recife', uf: 'PE', documento: '900.113.442-05', avatarColor: 'teal', observacoes: '' },
  { nome: 'Bruno César Farias', email: 'bruno.farias@email.com', telefone: '(81) 99123-4514', dataNascimento: isoDateWithYear('06-06', 1987), cidade: 'Camaragibe', uf: 'PE', documento: '667.334.882-19', avatarColor: 'coral', observacoes: '' }
];

/* ---------- Seed: Viagens ---------- */
const SEED_VIAGENS = [
  {
    nome: 'Lua de Mel em Fernando de Noronha', destino: 'Fernando de Noronha', uf: 'PE', pais: 'Brasil',
    categoria: 'Lua de Mel', status: 'Confirmada',
    dataInicio: isoDaysFromToday(18), dataFim: isoDaysFromToday(25),
    valorTotal: 18500, valorPago: 12000, imagemSeed: 'noronha-1',
    observacoes: 'Pacote com passeio de barco e mergulho incluso.'
  },
  {
    nome: 'Réveillon em Maragogi', destino: 'Maragogi', uf: 'AL', pais: 'Brasil',
    categoria: 'Praia', status: 'Planejada',
    dataInicio: isoDaysFromToday(165), dataFim: isoDaysFromToday(170),
    valorTotal: 9800, valorPago: 2000, imagemSeed: 'maragogi-1',
    observacoes: ''
  },
  {
    nome: 'Trilha na Chapada Diamantina', destino: 'Chapada Diamantina', uf: 'BA', pais: 'Brasil',
    categoria: 'Aventura', status: 'Em andamento',
    dataInicio: isoDaysFromToday(-2), dataFim: isoDaysFromToday(4),
    valorTotal: 6200, valorPago: 6200, imagemSeed: 'chapada-1',
    observacoes: 'Grupo pequeno, guia local contratado.'
  },
  {
    nome: 'Congresso de Negócios em São Paulo', destino: 'São Paulo', uf: 'SP', pais: 'Brasil',
    categoria: 'Negócios', status: 'Confirmada',
    dataInicio: isoDaysFromToday(9), dataFim: isoDaysFromToday(12),
    valorTotal: 5400, valorPago: 5400, imagemSeed: 'saopaulo-1',
    observacoes: ''
  },
  {
    nome: 'Cultura e Vinho na Serra Gaúcha', destino: 'Gramado', uf: 'RS', pais: 'Brasil',
    categoria: 'Cultural', status: 'Planejada',
    dataInicio: isoDaysFromToday(60), dataFim: isoDaysFromToday(65),
    valorTotal: 11200, valorPago: 3000, imagemSeed: 'gramado-1',
    observacoes: 'Inclui degustação em 3 vinícolas.'
  },
  {
    nome: 'Cruzeiro pelo Nordeste', destino: 'Salvador → Recife → Natal', uf: '', pais: 'Brasil',
    categoria: 'Cruzeiro', status: 'Confirmada',
    dataInicio: isoDaysFromToday(40), dataFim: isoDaysFromToday(47),
    valorTotal: 22300, valorPago: 15000, imagemSeed: 'cruzeiro-1',
    observacoes: ''
  },
  {
    nome: 'Férias em Família em Porto de Galinhas', destino: 'Porto de Galinhas', uf: 'PE', pais: 'Brasil',
    categoria: 'Família', status: 'Concluída',
    dataInicio: isoDaysFromToday(-40), dataFim: isoDaysFromToday(-33),
    valorTotal: 8700, valorPago: 8700, imagemSeed: 'porto-galinhas-1',
    observacoes: 'Cliente pediu berço de bebê no resort.'
  },
  {
    nome: 'Aventura na Patagônia', destino: 'El Calafate', uf: '', pais: 'Argentina',
    categoria: 'Internacional', status: 'Planejada',
    dataInicio: isoDaysFromToday(120), dataFim: isoDaysFromToday(130),
    valorTotal: 27600, valorPago: 5000, imagemSeed: 'patagonia-1',
    observacoes: 'Verificar validade de passaporte de todos.'
  },
  {
    nome: 'Fim de Semana em Jericoacoara', destino: 'Jericoacoara', uf: 'CE', pais: 'Brasil',
    categoria: 'Praia', status: 'Cancelada',
    dataInicio: isoDaysFromToday(-10), dataFim: isoDaysFromToday(-7),
    valorTotal: 4300, valorPago: 1200, imagemSeed: 'jeri-1',
    observacoes: 'Cancelado a pedido do cliente — reembolso parcial.'
  },
  {
    nome: 'Show e Cultura em Nova York', destino: 'Nova York', uf: '', pais: 'Estados Unidos',
    categoria: 'Internacional', status: 'Em andamento',
    dataInicio: isoDaysFromToday(-1), dataFim: isoDaysFromToday(6),
    valorTotal: 31500, valorPago: 31500, imagemSeed: 'ny-1',
    observacoes: ''
  },
  {
    nome: 'Retiro de Bem-Estar em Itacaré', destino: 'Itacaré', uf: 'BA', pais: 'Brasil',
    categoria: 'Praia', status: 'Confirmada',
    dataInicio: isoDaysFromToday(28), dataFim: isoDaysFromToday(32),
    valorTotal: 7100, valorPago: 3500, imagemSeed: 'itacare-1',
    observacoes: ''
  },
  {
    nome: 'Expedição à Amazônia', destino: 'Manaus', uf: 'AM', pais: 'Brasil',
    categoria: 'Aventura', status: 'Planejada',
    dataInicio: isoDaysFromToday(95), dataFim: isoDaysFromToday(101),
    valorTotal: 13400, valorPago: 4000, imagemSeed: 'amazonia-1',
    observacoes: 'Hospedagem em lodge na selva.'
  }
];

/* ---------- Geração de IDs ---------- */
function generateId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ---------- Inicialização / Seed ---------- */
function seedDatabaseIfNeeded() {
  const alreadySeeded = localStorage.getItem(DB_KEYS.SEEDED);
  if (alreadySeeded) return;

  const pessoas = SEED_PESSOAS.map((p, idx) => ({
    id: `pes_${idx + 1}`,
    ...p,
    dataCadastro: isoDaysFromToday(-Math.floor(Math.random() * 200))
  }));

  const pessoaIds = pessoas.map(p => p.id);
  function randomParticipantes(min, max) {
    const count = Math.min(pessoaIds.length, Math.floor(Math.random() * (max - min + 1)) + min);
    const shuffled = [...pessoaIds].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  const viagens = SEED_VIAGENS.map((v, idx) => ({
    id: `via_${idx + 1}`,
    ...v,
    participantes: randomParticipantes(1, 4),
    dataCadastro: isoDaysFromToday(-Math.floor(Math.random() * 150))
  }));

  localStorage.setItem(DB_KEYS.PESSOAS, JSON.stringify(pessoas));
  localStorage.setItem(DB_KEYS.VIAGENS, JSON.stringify(viagens));
  localStorage.setItem(DB_KEYS.SEEDED, 'true');
}

/* ---------- CRUD: Pessoas ---------- */
function getPessoas() {
  return JSON.parse(localStorage.getItem(DB_KEYS.PESSOAS) || '[]');
}
function savePessoas(list) {
  localStorage.setItem(DB_KEYS.PESSOAS, JSON.stringify(list));
}
function getPessoaById(id) {
  return getPessoas().find(p => p.id === id) || null;
}
function addPessoa(data) {
  const list = getPessoas();
  const nova = { id: generateId('pes'), dataCadastro: new Date().toISOString().slice(0, 10), ...data };
  list.unshift(nova);
  savePessoas(list);
  return nova;
}
function updatePessoa(id, data) {
  const list = getPessoas();
  const idx = list.findIndex(p => p.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...data };
  savePessoas(list);
  return list[idx];
}
function deletePessoa(id) {
  savePessoas(getPessoas().filter(p => p.id !== id));
  // Remove a pessoa de qualquer viagem vinculada
  const viagens = getViagens().map(v => ({
    ...v,
    participantes: v.participantes.filter(pid => pid !== id)
  }));
  saveViagens(viagens);
}

/* ---------- CRUD: Viagens ---------- */
function getViagens() {
  return JSON.parse(localStorage.getItem(DB_KEYS.VIAGENS) || '[]');
}
function saveViagens(list) {
  localStorage.setItem(DB_KEYS.VIAGENS, JSON.stringify(list));
}
function getViagemById(id) {
  return getViagens().find(v => v.id === id) || null;
}
function addViagem(data) {
  const list = getViagens();
  const nova = { id: generateId('via'), dataCadastro: new Date().toISOString().slice(0, 10), ...data };
  list.unshift(nova);
  saveViagens(list);
  return nova;
}
function updateViagem(id, data) {
  const list = getViagens();
  const idx = list.findIndex(v => v.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...data };
  saveViagens(list);
  return list[idx];
}
function deleteViagem(id) {
  saveViagens(getViagens().filter(v => v.id !== id));
}

/* Roda o seed assim que o script carrega */
seedDatabaseIfNeeded();
