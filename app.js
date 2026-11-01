/* Minha Paróquia São Sebastião — protótipo navegável (dados fictícios)
   Referência: Caderno Mestre de Especificação Funcional, 20 módulos, consolidação 30/10/2026.
   Este arquivo NÃO é sistema de produção: não há autenticação real nem banco de dados.
   Os dados ficam apenas no navegador de quem testa (localStorage). */
(() => {
'use strict';

/* ================= CONFIGURAÇÃO ================= */
const CONFIG = {
  telefoneSecretaria: '(48) 3256-0124',
  horarioSecretaria: '[horário da Secretaria a confirmar]', // [DEPENDÊNCIA] Anexo F
  valorCertidao: 20,     // Anexo A — valor ordinário informado
  prazoCertidaoDiasUteis: 4,
  valorBatismo: 30       // Anexo C — não é impedimento sacramental
};

/* ================= COMUNIDADES (Módulo 02: 15 oficiais) ================= */
const UNIDADES = [
  { nome: 'Matriz São Sebastião', bairro: 'Centro' },
  { nome: 'Santo Antônio', bairro: 'Varginha' },
  { nome: 'São Domingos', bairro: 'Rio do Meio' },
  { nome: 'Santa Bárbara', bairro: 'Rio da Prata' },
  { nome: 'São Francisco de Sales', bairro: 'Maracujá' },
  { nome: 'Nossa Senhora da Glória', bairro: 'Santa Maria' },
  { nome: 'Nossa Senhora das Graças', bairro: 'Rio do Ouro' },
  { nome: 'São Pedro e São Paulo', bairro: 'Rio dos Pinheiros' },
  { nome: 'São José', bairro: 'Rio do Sul' },
  { nome: 'Senhor Bom Jesus', bairro: 'Rio Branco' },
  { nome: 'Divino Espírito Santo', bairro: 'Rio Cachimbo' },
  { nome: 'Santa Teresinha', bairro: 'Povoamento Igreja' },
  { nome: 'Sagrado Coração de Jesus', bairro: 'Salto' },
  { nome: 'Santa Paulina', bairro: 'Barra Gaspar' },
  { nome: 'Santa Cecília', bairro: 'Povoamento Escola' }
];
// Locais que NÃO entram na contagem de comunidades (critério de aceite do Módulo 02)
const OUTROS_LOCAIS = [
  { nome: 'São Miguel', bairro: 'Serrinha', obs: 'Consta na programação de missas; não confirmada como 16ª comunidade.' },
  { nome: 'Acampamento São Padre Pio', bairro: 'Local a confirmar', obs: 'Atividade/evento, não comunidade.' }
];
const NOMES_UNIDADES = UNIDADES.map(u => u.nome);
const MATRIZ = NOMES_UNIDADES[0];
const SALOES = ['Salão Paroquial (Matriz)', ...NOMES_UNIDADES.slice(1).map(n => 'Salão da comunidade ' + n)];
const comunidadeDoSalao = s => s.startsWith('Salão Paroquial') ? MATRIZ : s.replace('Salão da comunidade ', '');

/* ================= PERMISSÕES E FUNÇÕES ================= */
const PERMISSOES = [
  ['verPainel', 'Ver painel do pároco'],
  ['verTodasSolicitacoes', 'Ver solicitações de todos (sem isso, vê só as próprias)'],
  ['criarSolicitacao', 'Criar solicitações e processos'],
  ['encaminhar', 'Receber, conferir e encaminhar (Secretaria)'],
  ['processos', 'Ver e conduzir certidões, Batismo, Matrimônio e contratos de salão (dados sensíveis)'],
  ['decidir', 'Aprovar, devolver, pedir esclarecimentos ou não aprovar'],
  ['cadastrarFieis', 'Cadastrar fiéis de qualquer comunidade e confirmar cadastros'],
  ['cadastrarGrupo', 'Cadastrar fiéis apenas da própria comunidade ou grupo'],
  ['catequeseTodas', 'Ver todas as turmas de catequese'],
  ['agendar', 'Incluir na agenda'],
  ['tarefas', 'Criar e encerrar tarefas'],
  ['financeiro', 'Ver financeiro'],
  ['administrar', 'Acessar Administradores, permissões e auditoria']
];
const TODAS = PERMISSOES.map(([k]) => k);
const SO_PADRE = ['decidir', 'financeiro', 'administrar'];

const FUNCOES = {
  fiel:       { nome: 'Fiel', perms: ['criarSolicitacao'] },
  lideranca:  { nome: 'Coordenador de comunidade ou pastoral', perms: ['criarSolicitacao', 'agendar', 'tarefas', 'cadastrarGrupo'] },
  catequista: { nome: 'Catequista', perms: ['criarSolicitacao', 'agendar'] },
  conselho:   { nome: 'Conselho (CPP ou CAE)', perms: ['agendar', 'tarefas'] },
  secretaria: { nome: 'Secretaria', perms: ['criarSolicitacao', 'verTodasSolicitacoes', 'encaminhar', 'processos', 'cadastrarFieis', 'catequeseTodas', 'agendar', 'tarefas', 'administrar'] },
  padre:      { nome: 'Pároco', perms: TODAS }
};
function permsDe(funcoes) {
  const p = {};
  TODAS.forEach(k => p[k] = false);
  funcoes.forEach(f => FUNCOES[f].perms.forEach(k => p[k] = true));
  return p;
}

/* ================= MODELOS DE PROCESSO (Anexos A, B, C, D, D.1) ================= */
const SIM_NAO = ['Não', 'Sim'];
const MODELOS = {
  certidao: {
    nome: 'Segunda via de certidão', icone: '📄',
    ajuda: 'A data aproximada é muito importante para agilizar a busca. Em muitos casos, é necessário pesquisar livro por livro e página por página.',
    campos: [
      { k: 'tipoCert', rot: 'Certidão de', tipo: 'select', ops: ['Batismo', 'Crisma', 'Casamento'], obrig: true },
      { k: 'nomeCompleto', rot: 'Nome completo de quem recebeu o sacramento', obrig: true },
      { k: 'pais', rot: 'Nomes dos pais', obrig: true, completa: true },
      { k: 'nascimento', rot: 'Data de nascimento', tipo: 'date', completa: true },
      { k: 'padrinhos', rot: 'Nomes dos padrinhos (se souber)' },
      { k: 'dataSacramento', rot: 'Data exata ou aproximada do sacramento', completa: true, ajuda: 'Ex.: "por volta de 1998" ou "maio de 2005".' },
      { k: 'local', rot: 'Comunidade onde foi registrado', tipo: 'select', ops: ['Não sei', ...NOMES_UNIDADES] },
      { k: 'finalidade', rot: 'A certidão é para processo de casamento?', tipo: 'select', ops: SIM_NAO },
      { k: 'solicitante', rot: 'Seu nome (solicitante)', obrig: true },
      { k: 'telefone', rot: 'Telefone / WhatsApp', obrig: true },
      { k: 'consente', rot: 'Autorizo a Secretaria a me contatar por WhatsApp sobre este pedido', tipo: 'check' },
      { k: 'obs', rot: 'Observações', tipo: 'textarea' }
    ],
    titulo: d => `Certidão de ${d.tipoCert} — ${d.nomeCompleto}`,
    etapas: [
      { n: 'Enviado' },
      { n: 'Recebido pela Secretaria', quem: 'sec', msg: 'recebimento', iniciaPrazo: true },
      { n: 'Pesquisando', quem: 'sec', msg: 'pesquisa' },
      { n: 'Certidão impressa', quem: 'sec' },
      { n: 'Disponível para retirada', quem: 'sec', msg: 'retirada', pede: [{ k: 'dataRetirada', rot: 'Retirada a partir de', tipo: 'date', obrig: true }] },
      { n: 'Entregue', quem: 'sec', pede: [{ k: 'retiradoPor', rot: 'Retirado por (nome)', obrig: true }] }
    ],
    alt: ['Aguardando complementação', 'Registro não localizado', 'Suspenso para orientação', 'Cancelado'],
    altMsg: { 'Aguardando complementação': 'pendencia' },
    msgs: {
      recebimento: 'Olá, {nome}! Recebemos sua solicitação de segunda via de {tipo}, protocolo {protocolo}. Nossa Secretaria fará a conferência dos dados. Paróquia São Sebastião.',
      pesquisa: 'Olá, {nome}! Sua solicitação {protocolo} está em pesquisa nos registros paroquiais. Avisaremos quando houver atualização.',
      pendencia: 'Olá, {nome}! Para continuar a solicitação {protocolo}, precisamos das seguintes informações: {pendencias}. Por favor, responda à Secretaria.',
      retirada: 'Olá, {nome}! Sua certidão de {tipo}, protocolo {protocolo}, está pronta. Poderá ser retirada na Secretaria Paroquial a partir de {data_retirada}, no horário {horario_secretaria}. Se a finalidade for casamento, siga as orientações de entrega informadas pela Secretaria.'
    },
    vars: p => ({ nome: p.dados.solicitante, tipo: p.dados.tipoCert, data_retirada: dataBR(p.dados.dataRetirada), horario_secretaria: CONFIG.horarioSecretaria }),
    docs: () => []
  },

  batismo: {
    nome: 'Batismo', icone: '💧',
    ajuda: `Valor de inscrição informado: R$ ${CONFIG.valorBatismo},00 — não é condição para o sacramento.`,
    campos: [
      { k: 'crianca', rot: 'Nome da criança', obrig: true },
      { k: 'nascimento', rot: 'Data de nascimento da criança', tipo: 'date' },
      { k: 'solicitante', rot: 'Responsável legal (quem acompanha o processo)', obrig: true },
      { k: 'telefone', rot: 'Telefone / WhatsApp do responsável', obrig: true },
      { k: 'consente', rot: 'Autorizo contato por WhatsApp sobre este processo', tipo: 'check' },
      { k: 'comunidade', rot: 'Comunidade', tipo: 'select', ops: NOMES_UNIDADES },
      { k: 'padrinhos', rot: 'Padrinhos (nomes)' },
      { k: 'obs', rot: 'Observações', tipo: 'textarea' }
    ],
    titulo: d => `Batismo — ${d.crianca}`,
    etapas: [
      { n: 'Solicitação enviada' },
      { n: 'Recebida pela Secretaria', quem: 'sec', msg: 'recebimento' },
      { n: 'Documentos em conferência', quem: 'sec' },
      { n: 'Catequese Batismal agendada', quem: 'sec', msg: 'catequese', pede: [
        { k: 'catData', rot: 'Data da Catequese Batismal', tipo: 'date', obrig: true },
        { k: 'catHora', rot: 'Horário', tipo: 'time', obrig: true },
        { k: 'catLocal', rot: 'Local', obrig: true }] },
      { n: 'Catequese Batismal concluída', quem: 'sec' },
      { n: 'Orientação pastoral concluída (quando necessária)', quem: 'paroco' },
      { n: 'Data da celebração confirmada', quem: 'sec', msg: 'confirmacao', gateDocs: true, pede: [
        { k: 'celData', rot: 'Data da celebração', tipo: 'date', obrig: true },
        { k: 'celHora', rot: 'Horário', tipo: 'time', obrig: true },
        { k: 'igreja', rot: 'Igreja', tipo: 'select', ops: NOMES_UNIDADES, obrig: true }] },
      { n: 'Batismo celebrado', quem: 'sec' },
      { n: 'Registro sacramental nos livros oficiais', quem: 'sec' }
    ],
    alt: ['Aguardando documentos', 'Conversa com o pároco', 'Suspenso para orientação', 'Cancelado'],
    altMsg: { 'Aguardando documentos': 'pendencia' },
    msgs: {
      recebimento: 'Olá, {responsavel}! Recebemos o pedido de Batismo de {crianca}, protocolo {protocolo}. A Secretaria conferirá os documentos.',
      pendencia: 'Olá, {responsavel}! Para continuar o processo de Batismo, precisamos dos seguintes itens: {pendencias}. Estamos à disposição para orientar.',
      catequese: 'Olá, {responsavel}! A Catequese Batismal está agendada para {data}, às {hora}, em {local}. Verifiquem a participação dos pais e padrinhos.',
      confirmacao: 'Olá, {responsavel}! A celebração do Batismo de {crianca} está confirmada para {data_cel}, às {hora_cel}, na {igreja}. Em caso de dúvida, contatem a Secretaria.'
    },
    vars: p => ({ responsavel: p.dados.solicitante, crianca: p.dados.crianca, data: dataBR(p.dados.catData), hora: p.dados.catHora, local: p.dados.catLocal,
      data_cel: dataBR(p.dados.celData), hora_cel: p.dados.celHora, igreja: p.dados.igreja }),
    docs: () => [
      { nome: 'Criança: certidão de nascimento' },
      { nome: 'Pais: certidão de Batismo OU de casamento religioso' },
      { nome: 'Pais: comprovante de contribuição do Dízimo na comunidade', naoBloqueia: true, nota: 'Não é impedimento sacramental.' },
      { nome: 'Padrinhos: documento de identidade' },
      { nome: 'Padrinhos: comprovantes de Batismo, Primeira Comunhão e Crisma', nota: 'Se faltar algum sacramento: conversa pessoal com o pároco, sem rejeição automática.' },
      { nome: 'Pais e padrinhos: participação na Catequese Batismal' }
    ]
  },

  matrimonio: {
    nome: 'Processo matrimonial', icone: '💍',
    ajuda: 'O casal acompanha o mesmo processo. A aptidão canônica nunca é inferida automaticamente a partir de arquivos anexados.',
    campos: [
      { k: 'nubente', rot: 'Nome do nubente', obrig: true },
      { k: 'nubenta', rot: 'Nome da nubenta', obrig: true },
      { k: 'telefone', rot: 'Telefone / WhatsApp do casal', obrig: true },
      { k: 'consente', rot: 'Autorizamos contato por WhatsApp sobre este processo', tipo: 'check' },
      { k: 'comunidade', rot: 'Comunidade', tipo: 'select', ops: NOMES_UNIDADES },
      { k: 'dataPretendida', rot: 'Data pretendida para o casamento', tipo: 'date' },
      { k: 'obs', rot: 'Observações', tipo: 'textarea' }
    ],
    titulo: d => `Matrimônio — ${d.nubente} e ${d.nubenta}`,
    etapas: [
      { n: 'Inscrição enviada' },
      { n: 'Documentos em conferência', quem: 'sec', msg: 'recebimento' },
      { n: 'Documentação suficiente para entrevista', quem: 'sec', gateDocs: true },
      { n: 'Entrevista matrimonial agendada', quem: 'sec', msg: 'entrevista', pede: [
        { k: 'entData', rot: 'Data da entrevista', tipo: 'date', obrig: true },
        { k: 'entHora', rot: 'Horário (30 min)', tipo: 'time', obrig: true },
        { k: 'entLocal', rot: 'Local', obrig: true }] },
      { n: 'Entrevista realizada', quem: 'paroco' },
      { n: 'Preparação e verificações canônicas', quem: 'paroco' },
      { n: 'Processo apto para celebração', quem: 'paroco', msg: 'orientacao' },
      { n: 'Celebração realizada e registros encaminhados', quem: 'sec' }
    ],
    alt: ['Aguardando documentos', 'Requer orientação', 'Suspenso para orientação', 'Cancelado'],
    altMsg: { 'Aguardando documentos': 'pendencia' },
    msgs: {
      recebimento: 'Olá, {nomes}! Recebemos a inscrição para o processo matrimonial, protocolo {protocolo}. A Secretaria iniciará a conferência dos documentos.',
      pendencia: 'Olá, {nomes}! Para continuar a preparação matrimonial, precisamos conferir ou receber: {pendencias}. Acompanhem também o andamento pelo aplicativo.',
      entrevista: 'Olá, {nomes}! A entrevista matrimonial está confirmada para {data}, às {hora}, na {local}. Caso precisem alterar, contatem a Secretaria.',
      orientacao: 'Queridos nubentes, recomendamos que procurem o sacramento da Reconciliação na semana do casamento, como parte da preparação espiritual.'
    },
    vars: p => ({ nomes: `${p.dados.nubente} e ${p.dados.nubenta}`, data: dataBR(p.dados.entData), hora: p.dados.entHora, local: p.dados.entLocal }),
    docs: () => {
      const base = [
        ['Certidão de nascimento'],
        ['Certidão de Batismo atualizada (últimos 60 dias)', 'Confirmar a aplicação exata com a norma diocesana.'],
        ['Certidão de Crisma'],
        ['Comprovante da Primeira Comunhão', 'Se não houver: orientação, sem bloqueio automático.', true],
        ['CPF e RG ou CNH'],
        ['Comprovante de residência'],
        ['Comprovante do Encontro de Preparação para o Matrimônio']
      ];
      const out = [];
      ['Nubente', 'Nubenta'].forEach(q => base.forEach(([n, nota, nb]) => out.push({ nome: `${q}: ${n}`, nota, naoBloqueia: !!nb })));
      return out;
    }
  },

  salao: {
    nome: 'Reserva / locação de salão', icone: '🏛️',
    ajuda: 'Pedido pendente não é reserva confirmada. A reserva só é confirmada após contrato assinado presencialmente. Valores, caução e condições seguem o regulamento aprovado — o app não inventa preços.',
    campos: [
      { k: 'pessoa', rot: 'Contratante', tipo: 'select', ops: ['Pessoa Física', 'Pessoa Jurídica'], obrig: true, recarrega: true },
      { k: 'salao', rot: 'Local a ser alugado', tipo: 'select', ops: SALOES, obrig: true },
      { k: 'evento', rot: 'Evento / finalidade', obrig: true },
      { k: 'data', rot: 'Data do evento', tipo: 'date', obrig: true },
      { k: 'inicio', rot: 'Início', tipo: 'time', obrig: true },
      { k: 'fim', rot: 'Término', tipo: 'time', obrig: true },
      { k: 'publico', rot: 'Público estimado', tipo: 'number' },
      { k: 'solicitante', rot: 'Nome completo', obrig: true, so: 'Pessoa Física' },
      { k: 'profissao', rot: 'Profissão', so: 'Pessoa Física' },
      { k: 'cpf', rot: 'CPF', so: 'Pessoa Física' },
      { k: 'rg', rot: 'RG', so: 'Pessoa Física' },
      { k: 'endereco', rot: 'Endereço', so: 'Pessoa Física' },
      { k: 'estadoCivil', rot: 'Estado civil', so: 'Pessoa Física' },
      { k: 'empresa', rot: 'Nome da empresa', obrig: true, so: 'Pessoa Jurídica' },
      { k: 'cnpj', rot: 'CNPJ', so: 'Pessoa Jurídica' },
      { k: 'enderecoEmpresa', rot: 'Endereço da empresa', so: 'Pessoa Jurídica' },
      { k: 'repNome', rot: 'Representante legal: nome', obrig: true, so: 'Pessoa Jurídica' },
      { k: 'repFuncao', rot: 'Representante: função', so: 'Pessoa Jurídica' },
      { k: 'repCpf', rot: 'Representante: CPF', so: 'Pessoa Jurídica' },
      { k: 'repRg', rot: 'Representante: RG', so: 'Pessoa Jurídica' },
      { k: 'repEndereco', rot: 'Representante: endereço', so: 'Pessoa Jurídica' },
      { k: 'repEstadoCivil', rot: 'Representante: estado civil', so: 'Pessoa Jurídica' },
      { k: 'telefone', rot: 'Telefone / WhatsApp', obrig: true },
      { k: 'consente', rot: 'Autorizo contato por WhatsApp sobre esta reserva', tipo: 'check' },
      { k: 'vistoria', rot: 'Data da vistoria e entrega das chaves', tipo: 'date' },
      { k: 'devolucao', rot: 'Data da devolução das chaves e vistoria final', tipo: 'date' },
      { k: 'valorBase', rot: 'Valor base da locação (conforme regulamento)', tipo: 'number', ajuda: 'Mais luz e gás consumidos, apurados na vistoria final.' },
      { k: 'regulamento', rot: 'Declaro ciência do regulamento de uso do salão', tipo: 'check', obrig: true },
      { k: 'obs', rot: 'Equipamentos, montagem/desmontagem e observações', tipo: 'textarea' }
    ],
    titulo: d => `${d.salao} — ${d.evento}`,
    etapas: [
      { n: 'Solicitação enviada' },
      { n: 'Em análise (Secretaria e coordenação)', quem: 'coord', msg: 'recebimento' },
      { n: 'Reserva aprovada (sujeita ao contrato)', quem: 'coord', checaConflito: true },
      { n: 'Contrato gerado e impresso pela Secretaria', quem: 'sec' },
      { n: 'Aguardando assinatura presencial', quem: 'sec' },
      { n: 'Contrato assinado — reserva CONFIRMADA', quem: 'sec', msg: 'confirmacao', confirma: true },
      { n: 'Vistoria inicial e chaves entregues', quem: 'sec', pede: [{ k: 'chavesPara', rot: 'Chaves entregues a (nome)', obrig: true }] },
      { n: 'Evento realizado', quem: 'sec' },
      { n: 'Chaves devolvidas e vistoria final', quem: 'sec' },
      { n: 'Consumos conferidos — contrato encerrado', quem: 'sec', pede: [{ k: 'consumos', rot: 'Luz e gás: medições e acerto final', obrig: true, tipo: 'textarea' }] }
    ],
    alt: ['Data indisponível', 'Devolvida para ajustes', 'Não aprovada', 'Cancelada'],
    altMsg: { 'Devolvida para ajustes': 'pendencia', 'Cancelada': 'cancelamento' },
    msgs: {
      recebimento: 'Olá, {nome}! Recebemos seu pedido de reserva do {salao} para {data}, das {inicio} às {fim}, protocolo {protocolo}. O pedido ainda depende de análise.',
      confirmacao: 'Olá, {nome}! Sua reserva do {salao} está CONFIRMADA para {data}, das {inicio} às {fim}, para {finalidade}. Protocolo {protocolo}. Orientações: {orientacoes}. Paróquia São Sebastião.',
      pendencia: 'Olá, {nome}! Para concluir sua reserva do {salao}, precisamos de {pendencias}. A data ainda não está confirmada.',
      cancelamento: 'Olá, {nome}! Informamos que a reserva {protocolo}, referente ao {salao} em {data}, foi cancelada conforme registro do processo. Entre em contato com a Secretaria para orientações.'
    },
    vars: p => ({ nome: p.dados.pessoa === 'Pessoa Jurídica' ? p.dados.repNome : p.dados.solicitante, salao: p.dados.salao, data: dataBR(p.dados.data),
      inicio: p.dados.inicio, fim: p.dados.fim, finalidade: p.dados.evento, orientacoes: '[orientações do regulamento]' }),
    docs: () => []
  }
};
const ALT_ENCERRA = ['Cancelado', 'Cancelada', 'Não aprovada', 'Data indisponível', 'Registro não localizado'];

/* ================= UTILITÁRIOS ================= */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const isoLocal = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hojeISO = () => isoLocal(new Date());
const agoraISO = () => new Date().toISOString();
const dataBR = iso => { if (!iso) return '—'; const [a, m, d] = String(iso).slice(0, 10).split('-'); return d ? `${d}/${m}/${a}` : esc(iso); };
const dataCurta = iso => { const [, m, d] = iso.split('-'); return `${d}/${m}`; };
const dataHoraBR = iso => { if (!iso) return '—'; const d = new Date(iso); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const reais = v => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
const proximoId = lista => lista.length ? Math.max(...lista.map(i => i.id)) + 1 : 1;
const minutos = h => { const [a, b] = String(h || '0:0').split(':').map(Number); return a * 60 + b; };
const horaDe = m => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
const sobrepoe = (i1, f1, i2, f2) => i1 < f2 && i2 < f1;
function addDiasUteis(iso, n) { // feriados não considerados (ver sugestões)
  const d = new Date(iso.slice(0, 10) + 'T12:00:00');
  let c = 0;
  while (c < n) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) c++; }
  return isoLocal(d);
}
// Telefone → formato internacional. Retorna null se inválido.
function telefoneWa(tel) {
  let t = String(tel || '').replace(/\D/g, '');
  if (t.length === 10 || t.length === 11) t = '55' + t;
  return (t.length === 12 || t.length === 13) && t.startsWith('55') ? t : null;
}
// Números de demonstração (48) 90000-xxxx não abrem conversa com um número real.
const telefoneFicticio = tel => /^\(?48\)?\s*90000/.test(String(tel || '').trim());

/* ================= DADOS INICIAIS (FICTÍCIOS) ================= */
const CRIANCAS = [
  ['Alice Exemplo', 'Helena Exemplo'], ['Arthur Modelo', 'Marcos Modelo'], ['Beatriz Teste', 'Sandra Teste'], ['Benjamin Exemplo', 'Paulo Exemplo'],
  ['Cecília Modelo', 'Rosa Modelo'], ['Davi Teste', 'Cláudia Teste'], ['Elisa Exemplo', 'Marta Exemplo'], ['Enzo Modelo', 'Rafael Modelo'],
  ['Gabriel Teste', 'Simone Teste'], ['Heitor Exemplo', 'Joana Exemplo'], ['Isadora Modelo', 'Vera Modelo'], ['Joaquim Teste', 'André Teste'],
  ['Laura Exemplo', 'Patrícia Exemplo'], ['Lorenzo Modelo', 'Fábio Modelo'], ['Manuela Teste', 'Adriana Teste'], ['Mateus Exemplo', 'Renata Exemplo'],
  ['Miguel Modelo', 'Luciana Modelo'], ['Olívia Teste', 'Daniela Teste'], ['Pedro Exemplo', 'Sérgio Exemplo'], ['Rafaela Modelo', 'Camila Modelo'],
  ['Samuel Teste', 'Juliana Teste'], ['Sofia Exemplo', 'Priscila Exemplo'], ['Valentina Modelo', 'Eduardo Modelo']
];
const DATAS_2026 = ['2026-04-11', '2026-04-25', '2026-05-09', '2026-05-23', '2026-06-13', '2026-06-27', '2026-07-26', '2026-08-01', '2026-08-08',
  '2026-08-15', '2026-08-22', '2026-09-05', '2026-09-12', '2026-09-19', '2026-09-26', '2026-09-27', '2026-10-03', '2026-10-10'];

function seedCatequese() {
  const cal = (window.IVC_CALENDARIO || {})['2026'] || [];
  const catequizandos = CRIANCAS.map(([nome, resp], i) => ({
    id: i + 1, nome, responsavel: resp, telefone: `(48) 90000-${2000 + i + 1}`, consente: i % 6 !== 5, situacao: 'Cursando'
  }));
  const especiais = { 4: { 12: 'F', 13: 'F' }, 9: { 8: 'F', 11: 'F', 15: 'F' }, 15: { 10: 'J', 14: 'F' }, 20: { 17: 'F', 18: 'F' } };
  const encontros = {};
  DATAS_2026.forEach((data, idx) => {
    const n = idx + 1;
    const enc = cal.find(e => e.n === n);
    const reg = { data, presencas: {}, pais: {}, por: 'Teresa Exemplo', em: data + 'T12:00:00.000Z' };
    catequizandos.forEach((c, i) => {
      if (enc && enc.tipo === 'Famílias') reg.pais[c.id] = (i * 3 + n) % 11 === 0 ? 'F' : 'P';
      else {
        let v = 'P';
        if ((i * 7 + n) % 29 === 0) v = 'J';
        if (especiais[c.id] && especiais[c.id][n]) v = especiais[c.id][n];
        reg.presencas[c.id] = v;
      }
    });
    encontros['2026-' + n] = reg;
  });
  return [{
    id: 1, nome: 'IVC Lv. 1 2026', anoInicio: 2026, comunidade: MATRIZ, etapa: '1ª Etapa', material: 'Itinerário Vol. I',
    diaHorario: '', catequistas: [6, 7, 8, 9], catequizandos, encontros, acompanhamentos: []
  }];
}

function seed() {
  const P = (id, nome, funcoes, comunidade = MATRIZ, situacao = 'ativo', consente = true) =>
    ({ id, nome, telefone: `(48) 90000-00${pad(id)}`, comunidade, funcoes, perms: permsDe(funcoes), situacao, consente });
  const h = (acao, por, em, obs = '') => ({ em, por, acao, obs });
  const d = {
    seqProtocolo: 9,
    pessoas: [
      P(1, 'Pe. Exemplo (pároco)', ['padre']),
      P(2, 'Maria Exemplo (secretária)', ['secretaria']),
      P(3, 'José Exemplo (coord. Santa Cecília)', ['lideranca'], 'Santa Cecília'),
      P(4, 'Ana Exemplo', ['fiel']),
      P(5, 'João Exemplo', ['fiel'], 'Santo Antônio', 'aguardando conferência'),
      P(6, 'Teresa Exemplo (catequista)', ['catequista']),
      P(7, 'Lúcia Exemplo (catequista)', ['catequista']),
      P(8, 'Paula Exemplo (catequista)', ['catequista']),
      P(9, 'Rita Exemplo (catequista)', ['catequista']),
      P(10, 'Carlos Exemplo (coord. Matriz)', ['lideranca'])
    ],
    solicitacoes: [
      { id: 1, protocolo: '2026-0001', titulo: 'Atualização de coordenação', unidade: 'Santa Cecília', tipo: 'Gestão institucional',
        detalhe: 'Atualização fictícia sujeita à conferência documental e à aprovação competente.', status: 'Encaminhada ao pároco',
        origem: 3, prioridade: 'Normal', prazo: '2026-11-10', criadoEm: '2026-10-20T13:00:00.000Z',
        historico: [h('Enviada', 'José Exemplo (coord. Santa Cecília)', '2026-10-20T13:00:00.000Z'), h('Recebida pela Secretaria', 'Maria Exemplo (secretária)', '2026-10-21T12:00:00.000Z'),
          h('Encaminhada ao pároco', 'Maria Exemplo (secretária)', '2026-10-21T12:05:00.000Z', 'Documentação conferida.')] },
      { id: 2, protocolo: '2026-0002', titulo: 'Agendar bênção de casa', unidade: MATRIZ, tipo: 'Agendamento de bênção ou visita',
        detalhe: 'Pedido fictício de bênção domiciliar.', status: 'Enviada', origem: 4, prioridade: 'Normal', prazo: '', criadoEm: '2026-10-30T15:00:00.000Z',
        historico: [h('Enviada', 'Ana Exemplo', '2026-10-30T15:00:00.000Z')] }
    ],
    processos: [],
    eventos: [
      { id: 1, data: '2026-11-01', hora: '14:30', fim: '15:30', nome: 'Missa da Partilha', unidade: 'Santa Cecília', tipo: 'pública' },
      { id: 2, data: '2026-11-01', hora: '16:30', fim: '17:30', nome: 'Missa da Partilha', unidade: 'Santa Teresinha', tipo: 'pública' },
      { id: 3, data: '2026-11-02', hora: '19:00', fim: '20:00', nome: 'Missa de Finados', unidade: MATRIZ, tipo: 'pública' },
      { id: 4, data: '2026-11-05', hora: '19:30', fim: '21:00', nome: 'Reunião da coordenação do CPP (preparatória)', unidade: MATRIZ, tipo: 'institucional' }
    ],
    tarefas: [
      { id: 1, nome: 'Conferir programação de Finados', unidade: 'Secretaria', responsavel: 2, prazo: '2026-10-30', estado: 'aberta', historico: [] },
      { id: 2, nome: 'Revisar solicitações pendentes', unidade: 'Paróquia', responsavel: 2, prazo: '2026-11-06', estado: 'aberta', historico: [] },
      { id: 3, nome: 'Preparar reunião comunitária', unidade: 'Santa Cecília', responsavel: 3, prazo: '2026-11-12', estado: 'concluída', historico: [] }
    ],
    financeiro: [
      { unidade: 'Paróquia (administração central)', mes: 'Outubro/2026', entradas: 3000, saidas: 1800 },
      { unidade: 'Matriz São Sebastião', mes: 'Outubro/2026', entradas: 4200, saidas: 3100 },
      { unidade: 'Santa Cecília', mes: 'Outubro/2026', entradas: 900, saidas: 650 }
    ],
    turmas: seedCatequese(),
    auditoria: []
  };
  // Processos de exemplo
  const proc = (id, protocolo, modelo, origem, dados, etapa, criadoEm, extra = {}) => {
    const M = MODELOS[modelo];
    const historico = [h(M.etapas[0].n, dados.solicitante || dados.nubente || 'Solicitante', criadoEm)];
    for (let i = 1; i <= etapa; i++) historico.push(h(M.etapas[i].n, 'Maria Exemplo (secretária)', criadoEm.replace('T1', 'T2')));
    return Object.assign({ id, protocolo, modelo, origem, dados, etapa, alt: null, pendencias: '', titulo: M.titulo(dados),
      unidade: dados.comunidade || (dados.salao ? comunidadeDoSalao(dados.salao) : MATRIZ),
      docs: M.docs().map(x => Object.assign({ status: 'pendente', obs: '' }, x)), historico, comunic: [], criadoEm }, extra);
  };
  d.processos.push(proc(1, '2026-0003', 'certidao', 4, { tipoCert: 'Batismo', nomeCompleto: 'Ana Exemplo', pais: 'Pai Exemplo e Mãe Exemplo',
    nascimento: '1990-03-10', dataSacramento: 'por volta de 1990', local: MATRIZ, finalidade: 'Não', solicitante: 'Ana Exemplo',
    telefone: '(48) 90000-0004', consente: true }, 2, '2026-10-28T13:00:00.000Z', { prazo: '2026-11-03' }));
  const b = proc(2, '2026-0004', 'batismo', 4, { crianca: 'Bebê Exemplo', nascimento: '2026-07-02', solicitante: 'Ana Exemplo',
    telefone: '(48) 90000-0004', consente: true, comunidade: MATRIZ, padrinhos: 'Casal Exemplo' }, 2, '2026-10-25T14:00:00.000Z');
  b.docs[0].status = 'conferido'; b.docs[1].status = 'recebido'; b.docs[2].status = 'pendente';
  d.processos.push(b);
  d.processos.push(proc(3, '2026-0005', 'matrimonio', 4, { nubente: 'Lucas Exemplo', nubenta: 'Ana Exemplo', telefone: '(48) 90000-0004',
    consente: true, comunidade: MATRIZ, dataPretendida: '2027-05-15' }, 1, '2026-10-15T13:00:00.000Z'));
  d.processos.push(proc(4, '2026-0006', 'salao', 4, { pessoa: 'Pessoa Física', salao: 'Salão da comunidade Santa Cecília', evento: 'Aniversário (exemplo)',
    data: '2026-11-21', inicio: '18:00', fim: '23:00', publico: 60, solicitante: 'Ana Exemplo', telefone: '(48) 90000-0004',
    consente: true, regulamento: true }, 0, '2026-10-29T12:00:00.000Z'));
  d.processos.push(proc(5, '2026-0007', 'salao', 4, { pessoa: 'Pessoa Física', salao: 'Salão Paroquial (Matriz)', evento: 'Casamento civil — recepção (exemplo)',
    data: '2026-11-14', inicio: '18:00', fim: '23:59', publico: 120, solicitante: 'Ana Exemplo', telefone: '(48) 90000-0004', consente: true, regulamento: true }, 5, '2026-10-01T12:00:00.000Z'));
  d.processos.push(proc(6, '2026-0008', 'salao', 4, { pessoa: 'Pessoa Jurídica', salao: 'Salão Paroquial (Matriz)', evento: 'Confraternização de empresa (exemplo)',
    data: '2026-11-14', inicio: '20:00', fim: '23:00', publico: 40, empresa: 'Empresa Exemplo Ltda.', repNome: 'Ana Exemplo', telefone: '(48) 90000-0004',
    consente: true, regulamento: true }, 1, '2026-10-30T12:00:00.000Z'));
  return d;
}

/* ================= ESTADO ================= */
const CHAVE = 'minha-paroquia-demo-v6';
let dados;
try { dados = JSON.parse(localStorage.getItem(CHAVE)) || seed(); } catch (e) { dados = seed(); }
const estado = {
  tela: 'boas-vindas', pessoaId: null, visitante: false, aba: 'paroco', aviso: '', erro: '',
  detalhe: null, proc: null, procNovo: null, rascunho: {}, editPessoa: null, filtro: { status: '', tipo: '' },
  turma: null, ano: null, chamada: null, catEdit: null, consulta: null, msgAberta: null
};
function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch (e) {} }

const pessoaPorId = id => dados.pessoas.find(p => p.id === id);
const pessoaAtual = () => estado.visitante ? null : pessoaPorId(estado.pessoaId);
const nomeAtual = () => (pessoaAtual() || { nome: 'Visitante (formulário público)' }).nome;
const pode = acao => { const p = pessoaAtual(); return !!(p && p.perms[acao]); };
const temFuncao = f => { const p = pessoaAtual(); return !!(p && p.funcoes.includes(f)); };
const nomeFuncoes = p => p.funcoes.map(f => FUNCOES[f].nome.split(' (')[0]).join(', ') || 'Sem função';
const ehPadre = p => !!p && p.funcoes.includes('padre');

function registrar(acao) {
  dados.auditoria.unshift({ em: agoraISO(), por: nomeAtual(), acao });
  if (dados.auditoria.length > 400) dados.auditoria.length = 400;
}
function historico(obj, acao, obs = '') {
  obj.historico = obj.historico || [];
  obj.historico.push({ em: agoraISO(), por: nomeAtual(), acao, obs });
  registrar(`${obj.protocolo ? obj.protocolo + ' · ' : ''}${acao}${obs ? ' — ' + obs : ''}`);
}
function novoProtocolo() { dados.seqProtocolo = (dados.seqProtocolo || 0) + 1; return `${new Date().getFullYear()}-${String(dados.seqProtocolo).padStart(4, '0')}`; }

/* ================= REGRAS DE PROCESSO ================= */
const procPorId = id => dados.processos.find(p => p.id === id);
const situacaoProc = p => p.alt || MODELOS[p.modelo].etapas[p.etapa].n;
const procEncerrado = p => (p.alt && ALT_ENCERRA.includes(p.alt)) || p.etapa === MODELOS[p.modelo].etapas.length - 1;
const ehSecretaria = () => pode('processos');
function podeConduzir(p, idx) {
  const E = MODELOS[p.modelo].etapas[idx];
  if (!E) return false;
  const eu = pessoaAtual();
  if (ehPadre(eu)) return true;
  if (E.quem === 'paroco') return false;
  if (ehSecretaria()) return true;
  return E.quem === 'coord' && temFuncao('lideranca') && eu.comunidade === p.unidade;
}
function processosVisiveis() {
  const eu = pessoaAtual();
  if (!eu) return [];
  if (pode('processos')) return dados.processos;
  return dados.processos.filter(p => p.origem === eu.id);
}
const docsPendentes = p => p.docs.filter(d => !d.naoBloqueia && !['conferido', 'dispensado/alternativo'].includes(d.status));
const dadosCompletos = p => MODELOS[p.modelo].campos.filter(c => c.completa).every(c => p.dados[c.k]);
const reservaConfirmada = p => p.modelo === 'salao' && p.etapa >= 5 && !p.alt;
function conflitosSalao(p) {
  if (p.modelo !== 'salao') return [];
  return dados.processos.filter(o => o.id !== p.id && o.modelo === 'salao' && o.dados.salao === p.dados.salao && o.dados.data === p.dados.data &&
    !(o.alt && ALT_ENCERRA.includes(o.alt)) && sobrepoe(minutos(p.dados.inicio), minutos(p.dados.fim), minutos(o.dados.inicio), minutos(o.dados.fim)));
}
function preencher(texto, vars) { return texto.replace(/\{(\w+)\}/g, (m, k) => vars[k] !== undefined && vars[k] !== '' && vars[k] !== '—' ? vars[k] : `[${k}]`); }
function mensagemProc(p, chave) {
  const M = MODELOS[p.modelo];
  return preencher(M.msgs[chave] || '', Object.assign({ protocolo: p.protocolo, pendencias: p.pendencias || '' }, M.vars(p)));
}

/* ================= COMPONENTES ================= */
function barraProgresso(p, compacta = false) {
  const M = MODELOS[p.modelo];
  const total = M.etapas.length - 1;
  const pct = Math.round(p.etapa / total * 100);
  if (compacta) return `<div class="barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Andamento"><span style="width:${pct}%"></span></div>`;
  const quando = n => { const h = (p.historico || []).filter(x => x.acao === n).pop(); return h ? dataHoraBR(h.em) : ''; };
  return `
    ${p.alt ? `<div class="alerta" role="status"><b>Situação: ${esc(p.alt)}</b> — o processo está parado na etapa “${esc(M.etapas[p.etapa].n)}”. Isto não é progresso concluído.</div>` : ''}
    <ol class="passos" aria-label="Etapas do processo">
      ${M.etapas.map((e, i) => {
        const cls = i < p.etapa || (i === p.etapa && i === total) ? 'feito' : i === p.etapa ? 'atual' : '';
        return `<li class="${cls}" ${i === p.etapa ? 'aria-current="step"' : ''}><span class="dot">${i < p.etapa || cls === 'feito' ? '✓' : i + 1}</span>
          <div><b>${esc(e.n)}</b>${quando(e.n) && i <= p.etapa ? `<div class="muted">${quando(e.n)}</div>` : ''}${e.quem === 'paroco' && i > p.etapa ? '<div class="muted">Competência do pároco</div>' : ''}</div></li>`;
      }).join('')}
    </ol>`;
}

const ICONE_WA = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-3px"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.4-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3z"/></svg>';

/* Padrão transversal de WhatsApp (Anexo E): abre o WhatsApp com texto, nunca envia sozinho. */
function blocoWhats({ alvo, id, tel, consente, texto, seletor = '' }) {
  const historicoCom = (alvo.comunic || []).slice().reverse().map(c =>
    `<li>${dataHoraBR(c.em)} · <b>${esc(c.situacao)}</b> · ${esc(c.por)}</li>`).join('');
  let corpo;
  if (!consente) corpo = '<p class="muted">Sem autorização registrada para contato por WhatsApp. Use telefone ou atendimento presencial.</p>';
  else if (!telefoneWa(tel)) corpo = '<p class="muted">Telefone ausente ou inválido para WhatsApp. Corrija o cadastro antes de preparar a mensagem.</p>';
  else corpo = `
    ${seletor}
    <label for="wa-txt">Prévia da mensagem (pode corrigir antes de abrir)</label>
    <textarea id="wa-txt" rows="4">${esc(texto)}</textarea>
    ${telefoneFicticio(tel) ? '<p class="muted">Número de demonstração: o WhatsApp abrirá sem destinatário para você escolher o contato.</p>' : ''}
    <div class="actions">
      <button class="btn wa" data-acao="waAbrir" data-alvo="${esc(id)}" aria-label="Preparar mensagem no WhatsApp">${ICONE_WA} Preparar mensagem no WhatsApp</button>
      ${(alvo.comunic || []).some(c => c.situacao === 'WhatsApp aberto') ? `<button class="btn outline" data-acao="waConfirmar" data-alvo="${esc(id)}">Marcar envio confirmado manualmente</button>` : ''}
    </div>
    <p class="muted">Abrir o WhatsApp não significa que a mensagem foi enviada. Não inclua documentos, números de documentos nem dados sensíveis.</p>`;
  return `<section class="card"><h3>${ICONE_WA} Comunicação por WhatsApp</h3>${corpo}
    ${historicoCom ? `<details><summary>Registro de comunicação</summary><ul class="hist">${historicoCom}</ul></details>` : ''}</section>`;
}
// Resolve o alvo de comunicação a partir de "proc-3", "sol-2" ou "cat-1-5"
function alvoComunicacao(ref) {
  const [t, a, b] = String(ref).split('-');
  if (t === 'proc') { const p = procPorId(Number(a)); return p && { obj: p, tel: p.dados.telefone }; }
  if (t === 'sol') { const s = dados.solicitacoes.find(x => x.id === Number(a)); const au = s && pessoaPorId(s.origem); return s && { obj: s, tel: au && au.telefone }; }
  if (t === 'cat') { const tu = dados.turmas.find(x => x.id === Number(a)); const c = tu && tu.catequizandos.find(x => x.id === Number(b));
    if (!c) return null; c.comunic = c.comunic || []; return { obj: c, tel: c.telefone }; }
  return null;
}

function campoHTML(c, val, prefixo = 'f') {
  const id = `${prefixo}-${c.k}`;
  const req = c.obrig ? ' <span aria-hidden="true" style="color:var(--wine)">*</span>' : '';
  const ajuda = c.ajuda ? `<div class="muted">${esc(c.ajuda)}</div>` : '';
  if (c.tipo === 'check') return `<label class="check"><input type="checkbox" id="${id}" ${val ? 'checked' : ''}> ${esc(c.rot)}${req}</label>${ajuda}`;
  let input;
  if (c.tipo === 'select') input = `<select id="${id}" ${c.recarrega ? 'data-mudar="rascunho"' : ''}>${c.ops.map(o => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  else if (c.tipo === 'textarea') input = `<textarea id="${id}" rows="3">${esc(val || '')}</textarea>`;
  else input = `<input type="${c.tipo || 'text'}" id="${id}" value="${esc(val || '')}">`;
  return `<label for="${id}">${esc(c.rot)}${req}</label>${input}${ajuda}`;
}
function lerCampos(campos, prefixo = 'f') {
  const out = {};
  campos.forEach(c => {
    const el = document.getElementById(`${prefixo}-${c.k}`);
    if (!el) return;
    out[c.k] = c.tipo === 'check' ? el.checked : el.value.trim();
  });
  return out;
}
const camposAtivos = (M, d) => M.campos.filter(c => !c.so || c.so === (d.pessoa || 'Pessoa Física'));

/* ================= TELAS ANTES DE ENTRAR ================= */
function telaBoasVindas() {
  const proximos = eventosAgenda(true).filter(e => e.data >= hojeISO()).slice(0, 3);
  return `
    <div class="inicio">
      <img class="logo-centro" src="logo.png" alt="Logomarca da Paróquia São Sebastião" onerror="this.style.display='none'">
      <h2 class="title" style="text-align:center">Bem-vindo à nossa Paróquia</h2>
      <div class="muted" style="text-align:center">Paróquia: Comunidade de Comunidades, Uma Só Família.</div>
      <button class="escolha" data-tela="entrar"><b>Entrar</b><small>Para quem já tem cadastro na paróquia.</small></button>
      <button class="escolha" data-tela="cadastro"><b>Fazer meu cadastro</b><small>A Secretaria confere e libera o acesso.</small></button>
      <button class="escolha" data-tela="certidao"><b>Pedir segunda via de certidão</b><small>Batismo, Crisma ou Casamento · acompanhe pelo protocolo.</small></button>
      <button class="escolha" data-visitante><b>Continuar sem login</b><small>Ver comunidades e a agenda pública de celebrações.</small></button>
      <section class="card banner" style="margin-top:18px"><h2>Permanecer · Unir · Frutificar</h2>
        <div class="muted" style="margin-bottom:6px">“Permanecei em mim e produzireis muitos frutos” (Jo 15,5)</div>
        ${proximos.map(e => `<div class="item"><div style="display:flex;gap:11px;align-items:center"><span class="datebox">${dataCurta(e.data)}</span><div><b>${esc(e.nome)}</b><div class="muted">${esc(e.unidade)} · ${esc(e.hora)}</div></div></div></div>`).join('') || '<p class="muted">Sem celebrações cadastradas nos próximos dias.</p>'}
      </section>
    </div>`;
}
function telaEntrar() {
  return `
    <div class="caixa">
      <h2 class="title" style="text-align:center">Entrar</h2>
      <p class="muted" style="text-align:center">Demonstração: escolha a pessoa, sem senha. O que você vê depende das permissões do cadastro.</p>
      <label for="login-pessoa">Pessoa cadastrada</label>
      <select id="login-pessoa">
        ${dados.pessoas.filter(p => p.situacao === 'ativo').map(p => `<option value="${p.id}">${esc(p.nome)} · ${esc(nomeFuncoes(p))}</option>`).join('')}
      </select>
      <p class="muted">Cadastros aguardando conferência ainda não podem entrar.</p>
      <div class="actions"><button class="btn" data-acao="entrar">Entrar</button><button class="btn outline" data-tela="boas-vindas">Voltar</button></div>
    </div>`;
}
function telaCadastroProprio() {
  return `
    <div class="caixa">
      <h2 class="title" style="text-align:center">Fazer meu cadastro</h2>
      <p class="muted">Após o envio, a Secretaria ou o coordenador da sua comunidade confere o cadastro e libera o acesso.</p>
      <label for="auto-nome">Nome completo</label><input type="text" id="auto-nome" placeholder="Seu nome">
      <label for="auto-tel">Telefone</label><input type="text" id="auto-tel" placeholder="(48) 90000-0000">
      <label for="auto-com">Comunidade</label><select id="auto-com">${NOMES_UNIDADES.map(n => `<option>${esc(n)}</option>`).join('')}</select>
      <label class="check"><input type="checkbox" id="auto-cons"> Autorizo contato da paróquia por WhatsApp</label>
      <label class="check"><input type="checkbox" id="auto-lgpd"> Li e concordo com o uso dos meus dados para a vida paroquial (LGPD)</label>
      <div class="actions"><button class="btn" data-acao="cadastroProprio">Enviar cadastro</button><button class="btn outline" data-tela="boas-vindas">Voltar</button></div>
    </div>`;
}
function telaCertidaoPublica() {
  const consulta = estado.consulta ? dados.processos.find(p => p.protocolo === estado.consulta) : null;
  return `
    <div class="caixa" style="max-width:620px">
      <h2 class="title" style="text-align:center">Segunda via de certidão</h2>
      <p class="muted">Valor ordinário: ${reais(CONFIG.valorCertidao)}. Prazo: até ${CONFIG.prazoCertidaoDiasUteis} dias úteis após recebermos todos os dados necessários.</p>
      <details ${estado.consulta ? 'open' : ''}><summary>Já pediu? Consultar andamento pelo protocolo</summary>
        <label for="cons-prot">Número do protocolo</label><input type="text" id="cons-prot" placeholder="Ex.: 2026-0003" value="${esc(estado.consulta || '')}">
        <div class="actions"><button class="btn small" data-acao="consultar">Consultar</button></div>
        ${estado.consulta ? (consulta ? `<div class="bloco"><b>${esc(MODELOS[consulta.modelo].nome)} · ${esc(consulta.protocolo)}</b>${barraProgresso(consulta)}</div>`
          : '<p class="alerta">Protocolo não encontrado.</p>') : ''}
      </details>
      ${formProcessoCampos('certidao')}
      <div class="actions"><button class="btn" data-acao="procEnviar" data-modelo="certidao">Enviar pedido</button><button class="btn outline" data-tela="boas-vindas">Voltar</button></div>
    </div>`;
}

/* ================= PAINEL DO PÁROCO (Módulo 09) ================= */
function itensDecisao() {
  const sol = dados.solicitacoes.filter(s => s.status === 'Encaminhada ao pároco');
  const proc = dados.processos.filter(p => !p.alt && !procEncerrado(p) && (MODELOS[p.modelo].etapas[p.etapa + 1] || {}).quem === 'paroco');
  return { sol, proc };
}
function telaPainel() {
  const { sol, proc } = itensDecisao();
  const atrasadas = dados.tarefas.filter(t => t.estado === 'aberta' && t.prazo && t.prazo < hojeISO());
  const alertasCat = dados.turmas.flatMap(t => alertasTurma(t, anoCorrente(t)).map(a => ({ t, a })));
  const semChamada = dados.turmas.flatMap(t => chamadasAtrasadas(t).map(e => ({ t, e })));
  const reservas = dados.processos.filter(p => p.modelo === 'salao' && !p.alt && p.etapa <= 1);
  const cadastros = dados.pessoas.filter(p => p.situacao !== 'ativo');
  const agenda = eventosAgenda(false).filter(e => e.data >= hojeISO()).slice(0, 5);
  return `
    <h2 class="title">Painel do Pároco</h2>
    <div class="muted">Visão institucional, fila de decisões e alertas · hoje ${dataBR(hojeISO())}</div>
    <div class="grid3" style="margin-top:12px">
      <div class="stat"><span class="muted">Aguardando sua decisão</span><strong>${sol.length + proc.length}</strong></div>
      <div class="stat"><span class="muted">Tarefas atrasadas</span><strong>${atrasadas.length}</strong></div>
      <div class="stat"><span class="muted">Alertas da catequese</span><strong>${alertasCat.length + semChamada.length}</strong></div>
      <div class="stat"><span class="muted">Reservas em análise</span><strong>${reservas.length}</strong></div>
      <div class="stat"><span class="muted">Processos em andamento</span><strong>${dados.processos.filter(p => !procEncerrado(p)).length}</strong></div>
      <div class="stat"><span class="muted">Cadastros a confirmar</span><strong>${cadastros.length}</strong></div>
    </div>
    <section class="card"><h3>Aguardando decisão</h3>
      ${sol.map(s => `<div class="item"><div><b>${esc(s.titulo)}</b><div class="muted">${esc(s.protocolo)} · ${esc(s.unidade)}</div><span class="tag pend">${esc(s.status)}</span></div>
        <button class="btn" data-acao="abrirSol" data-id="${s.id}">Analisar</button></div>`).join('')}
      ${proc.map(p => `<div class="item"><div><b>${esc(p.titulo)}</b><div class="muted">${esc(p.protocolo)} · próxima etapa: ${esc(MODELOS[p.modelo].etapas[p.etapa + 1].n)}</div></div>
        <button class="btn" data-acao="abrirProc" data-id="${p.id}">Analisar</button></div>`).join('')}
      ${sol.length + proc.length ? '' : '<p class="muted">Nada aguardando sua decisão.</p>'}
    </section>
    ${alertasCat.length || semChamada.length ? `<section class="card"><h3>Catequese — acompanhamento</h3>
      ${alertasCat.map(({ t, a }) => `<div class="item"><div><b>${esc(a.c.nome)}</b><div class="muted">${esc(t.nome)} · ${esc(a.motivo)}</div></div>
        <button class="btn outline" data-acao="abrirTurma" data-id="${t.id}">Analisar</button></div>`).join('')}
      ${semChamada.length ? `<div class="item"><div><b>${semChamada.length} encontro(s) de meses anteriores sem chamada registrada</b><div class="muted">${esc(semChamada[0].t.nome)}</div></div>
        <button class="btn outline" data-acao="abrirTurma" data-id="${semChamada[0].t.id}">Analisar</button></div>` : ''}
    </section>` : ''}
    ${atrasadas.length ? `<section class="card"><h3>Tarefas atrasadas</h3>${atrasadas.map(t => `<div class="item"><div><b>${esc(t.nome)}</b>
      <div class="muted">${esc(t.unidade)} · prazo ${dataBR(t.prazo)} · ${esc((pessoaPorId(t.responsavel) || {}).nome || '—')}</div></div>
      <button class="btn outline" data-aba="tarefas">Analisar</button></div>`).join('')}</section>` : ''}
    ${reservas.length ? `<section class="card"><h3>Reservas de salão em análise</h3>${reservas.map(p => `<div class="item"><div><b>${esc(p.titulo)}</b>
      <div class="muted">${dataBR(p.dados.data)} · ${esc(p.dados.inicio)}–${esc(p.dados.fim)}${conflitosSalao(p).length ? ' · <b style="color:var(--wine)">conflito de horário</b>' : ''}</div></div>
      <button class="btn outline" data-acao="abrirProc" data-id="${p.id}">Analisar</button></div>`).join('')}</section>` : ''}
    <section class="card"><h3>Próximos compromissos</h3>${agenda.map(e => linhaEvento(e)).join('') || '<p class="muted">Sem compromissos.</p>'}</section>`;
}

/* ================= SOLICITAÇÕES / PROTOCOLOS (Módulo 03) ================= */
const STATUS_SOL = ['Enviada', 'Recebida pela Secretaria', 'Encaminhada ao pároco', 'Aguardando esclarecimento', 'Devolvida para correção', 'Aprovada', 'Não aprovada', 'Concluída'];
const TIPOS_SOL = ['Documento ou informação', 'Atendimento pastoral', 'Agendamento de bênção ou visita', 'Comunicação PASCOM', 'Gestão institucional', 'Outro'];
function classeStatus(s) {
  if (['Aprovada', 'Concluída', 'Entregue'].includes(s)) return 'ok';
  if (['Não aprovada', 'Devolvida para correção', 'Cancelado', 'Cancelada', 'Registro não localizado', 'Data indisponível'].includes(s)) return 'nao';
  return 'pend';
}
function solicitacoesVisiveis() {
  let l = pode('verTodasSolicitacoes') ? dados.solicitacoes : dados.solicitacoes.filter(s => s.origem === estado.pessoaId);
  if (estado.filtro.status) l = l.filter(s => s.status === estado.filtro.status);
  if (estado.filtro.tipo) l = l.filter(s => s.tipo === estado.filtro.tipo);
  return l.slice().sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}
function telaSolicitacoes() {
  if (estado.detalhe !== null) return telaDetalheSol();
  const lista = solicitacoesVisiveis();
  const filtros = pode('verTodasSolicitacoes') ? `
    <div class="row2">
      <div><label for="fil-status">Situação</label><select id="fil-status" data-mudar="filtro"><option value="">Todas</option>${STATUS_SOL.map(s => `<option ${s === estado.filtro.status ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
      <div><label for="fil-tipo">Tipo</label><select id="fil-tipo" data-mudar="filtro"><option value="">Todos</option>${TIPOS_SOL.map(s => `<option ${s === estado.filtro.tipo ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
    </div>` : '';
  const formNova = pode('criarSolicitacao') ? `
    <details><summary>+ Nova solicitação</summary>
      <p class="muted">Certidões, Batismo, Matrimônio e salão têm formulário próprio na aba Processos.</p>
      <label for="sol-tipo">Tipo</label><select id="sol-tipo">${TIPOS_SOL.map(t => `<option>${t}</option>`).join('')}</select>
      <label for="sol-titulo">Assunto</label><input type="text" id="sol-titulo" placeholder="Ex.: Pedido de informação">
      <label for="sol-unidade">Comunidade</label><select id="sol-unidade">${NOMES_UNIDADES.map(n => `<option>${esc(n)}</option>`).join('')}</select>
      <label for="sol-detalhe">Detalhes</label><textarea id="sol-detalhe" rows="3" placeholder="Descreva o pedido (não inclua confidências)"></textarea>
      <div class="actions"><button class="btn" data-acao="novaSol">Enviar solicitação</button></div>
    </details>` : '';
  return `
    <h2 class="title">Solicitações</h2>
    <div class="muted">${pode('verTodasSolicitacoes') ? 'Protocolos de todas as comunidades e pessoas.' : 'Seus pedidos, prazos e situação de cada um.'}</div>
    ${formNova}${filtros}
    <section class="card">
      ${lista.map(s => {
        const autor = pessoaPorId(s.origem);
        return `<div class="item"><div><b>${esc(s.titulo)}</b>
          <div class="muted">${esc(s.protocolo)} · ${esc(s.unidade)} · ${esc(s.tipo)}${autor ? ' · ' + esc(autor.nome) : ''}${s.prazo ? ' · prazo ' + dataBR(s.prazo) : ''}</div>
          <span class="tag ${classeStatus(s.status)}">${esc(s.status)}</span></div>
          <button class="btn outline" data-acao="abrirSol" data-id="${s.id}">Abrir</button></div>`;
      }).join('') || '<p class="muted">Nenhuma solicitação.</p>'}
    </section>`;
}
function telaDetalheSol() {
  const s = dados.solicitacoes.find(x => x.id === estado.detalhe);
  if (!s) { estado.detalhe = null; return telaSolicitacoes(); }
  const autor = pessoaPorId(s.origem);
  const eu = pessoaAtual();
  let acoes = '';
  if (pode('encaminhar')) {
    if (s.status === 'Enviada') acoes += `<button class="btn blue" data-acao="solStatus" data-st="Recebida pela Secretaria">Marcar como recebida</button>`;
    if (s.status === 'Recebida pela Secretaria') acoes += `<button class="btn blue" data-acao="solStatus" data-st="Encaminhada ao pároco">Encaminhar ao pároco</button>
      <button class="btn outline" data-acao="solStatus" data-st="Concluída">Concluir (resolvido pela Secretaria)</button>`;
    if (s.status === 'Aprovada') acoes += `<button class="btn" data-acao="solStatus" data-st="Concluída">Concluir e arquivar</button>`;
  }
  let decisao = '';
  if (pode('decidir') && ['Enviada', 'Recebida pela Secretaria', 'Encaminhada ao pároco'].includes(s.status)) {
    decisao = `
      <label for="obs">Justificativa ou orientação (obrigatória para devolver, pedir esclarecimentos ou não aprovar)</label>
      <textarea id="obs" rows="3"></textarea>
      <div class="actions">
        <button class="btn" data-acao="solStatus" data-st="Aprovada">Aprovar</button>
        <button class="btn outline" data-acao="solStatus" data-st="Devolvida para correção">Devolver</button>
        <button class="btn blue" data-acao="solStatus" data-st="Aguardando esclarecimento">Pedir esclarecimentos</button>
        <button class="btn wine" data-acao="solStatus" data-st="Não aprovada">Não aprovar</button>
      </div>
      <p class="muted">A decisão registra autor, data, motivo e resultado.</p>`;
  }
  let resposta = '';
  if (eu && s.origem === eu.id && ['Aguardando esclarecimento', 'Devolvida para correção'].includes(s.status)) {
    resposta = `<label for="resp">Sua resposta / correção</label><textarea id="resp" rows="3"></textarea>
      <div class="actions"><button class="btn" data-acao="solResponder">Enviar resposta</button></div>`;
  }
  const podeWa = pode('encaminhar') && autor;
  return `
    <button class="btn outline" data-acao="voltar">← Voltar</button>
    <h2 class="title" style="margin-top:12px">Protocolo ${esc(s.protocolo)}</h2>
    <section class="card">
      <h3 style="font-size:19px;margin-top:0">${esc(s.titulo)}</h3>
      <span class="tag ${classeStatus(s.status)}">${esc(s.status)}</span>
      <p><b>Solicitante:</b> ${esc(autor ? autor.nome : '—')}<br><b>Comunidade:</b> ${esc(s.unidade)}<br><b>Tipo:</b> ${esc(s.tipo)}<br>
      <b>Prioridade:</b> ${esc(s.prioridade || 'Normal')} · <b>Prazo:</b> ${s.prazo ? dataBR(s.prazo) : 'a definir'}</p>
      <p>${esc(s.detalhe)}</p>
      ${pode('encaminhar') && !['Concluída', 'Não aprovada'].includes(s.status) ? `<div class="row2">
        <div><label for="sol-prio">Prioridade</label><select id="sol-prio" data-mudar="solPrio">${['Normal', 'Alta', 'Urgente'].map(x => `<option ${x === s.prioridade ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
        <div><label for="sol-prazo">Prazo</label><input type="date" id="sol-prazo" data-mudar="solPrazo" value="${esc(s.prazo || '')}"></div></div>` : ''}
    </section>
    ${acoes || decisao || resposta ? `<section class="card"><h3>Ações</h3><div class="actions">${acoes}</div>${decisao}${resposta}</section>` : ''}
    ${podeWa ? blocoWhats({ alvo: s, id: 'sol-' + s.id, tel: autor.telefone, consente: autor.consente,
      texto: `Olá, ${autor.nome}! Sua solicitação ${s.protocolo} (${s.titulo}) está agora: ${s.status}. Acompanhe pelo aplicativo. Paróquia São Sebastião.` }) : ''}
    <section class="card"><h3>Histórico</h3><ul class="hist">${(s.historico || []).slice().reverse().map(h =>
      `<li>${dataHoraBR(h.em)} · <b>${esc(h.acao)}</b> · ${esc(h.por)}${h.obs ? `<div class="muted">${esc(h.obs)}</div>` : ''}</li>`).join('')}</ul></section>`;
}

/* ================= PROCESSOS: certidões, Batismo, Matrimônio, salão (Módulos 04 e 13) ================= */
function formProcessoCampos(modelo) {
  const M = MODELOS[modelo];
  const eu = pessoaAtual();
  const base = eu ? { solicitante: eu.nome, telefone: eu.telefone, consente: eu.consente, comunidade: eu.comunidade } : {};
  const d = Object.assign(base, estado.rascunho);
  return `<p class="bloco muted">${esc(M.ajuda)}</p>${camposAtivos(M, d).map(c => campoHTML(c, d[c.k])).join('')}`;
}
function telaProcessos() {
  if (estado.proc !== null) return telaProcesso();
  if (estado.procNovo) {
    const M = MODELOS[estado.procNovo];
    return `<button class="btn outline" data-acao="procCancelar">← Voltar</button>
      <h2 class="title" style="margin-top:12px">${M.icone} ${esc(M.nome)}</h2>
      <section class="card">${formProcessoCampos(estado.procNovo)}
        <div class="actions"><button class="btn" data-acao="procEnviar" data-modelo="${estado.procNovo}">Enviar</button>
        <button class="btn outline" data-acao="procCancelar">Cancelar</button></div></section>`;
  }
  const lista = processosVisiveis().slice().sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    .filter(p => !estado.filtro.modelo || p.modelo === estado.filtro.modelo);
  return `
    <h2 class="title">${ehSecretaria() ? 'Processos' : 'Meus pedidos'}</h2>
    <div class="muted">${ehSecretaria() ? 'Certidões, Batismo, Matrimônio e reservas de salão de todas as comunidades.' : 'Acompanhe aqui o andamento dos seus pedidos de certidão, Batismo, Matrimônio ou salão.'}</div>
    ${pode('criarSolicitacao') ? `<div class="grid" style="margin-top:12px">${Object.entries(MODELOS).map(([k, M]) =>
      `<button class="escolha" style="margin:0" data-acao="procNovo" data-modelo="${k}"><b>${M.icone} ${esc(M.nome)}</b><small>Iniciar pedido</small></button>`).join('')}</div>` : ''}
    <label for="fil-modelo">Mostrar</label>
    <select id="fil-modelo" data-mudar="filtroModelo"><option value="">Todos os processos</option>${Object.entries(MODELOS).map(([k, M]) =>
      `<option value="${k}" ${estado.filtro.modelo === k ? 'selected' : ''}>${esc(M.nome)}</option>`).join('')}</select>
    <section class="card">
      ${lista.map(p => `<div class="item"><div style="flex:1;min-width:0"><b>${MODELOS[p.modelo].icone} ${esc(p.titulo)}</b>
        <div class="muted">${esc(p.protocolo)} · ${esc(p.unidade)}${p.prazo && !procEncerrado(p) ? ' · prazo ' + dataBR(p.prazo) : ''}</div>
        <span class="tag ${p.alt ? classeStatus(p.alt) : procEncerrado(p) ? 'ok' : 'pend'}">${esc(situacaoProc(p))}</span>
        ${reservaConfirmada(p) ? '<span class="tag ok">Reserva confirmada</span>' : p.modelo === 'salao' && !procEncerrado(p) ? '<span class="tag">Ainda não confirmada</span>' : ''}
        ${barraProgresso(p, true)}</div>
        <button class="btn outline" data-acao="abrirProc" data-id="${p.id}">Abrir</button></div>`).join('') || '<p class="muted">Nenhum processo.</p>'}
    </section>`;
}
const CAMPOS_RESTRITOS = ['cpf', 'rg', 'repCpf', 'repRg', 'cnpj'];
function telaProcesso() {
  const p = procPorId(estado.proc);
  if (!p || !processosVisiveis().includes(p)) { estado.proc = null; return telaProcessos(); }
  const M = MODELOS[p.modelo];
  const prox = M.etapas[p.etapa + 1];
  const sec = ehSecretaria() || ehPadre(pessoaAtual());
  const conflitos = conflitosSalao(p);
  const linhas = camposAtivos(M, p.dados).filter(c => p.dados[c.k] !== undefined && p.dados[c.k] !== '' && (sec || !CAMPOS_RESTRITOS.includes(c.k)))
    .map(c => `<div><span class="muted">${esc(c.rot)}:</span> ${c.tipo === 'check' ? (p.dados[c.k] ? 'Sim' : 'Não') : c.tipo === 'date' ? dataBR(p.dados[c.k]) : esc(p.dados[c.k])}</div>`).join('');
  const extras = M.etapas.flatMap(e => e.pede || []).filter(c => p.dados[c.k])
    .map(c => `<div><span class="muted">${esc(c.rot)}:</span> ${c.tipo === 'date' ? dataBR(p.dados[c.k]) : esc(p.dados[c.k])}</div>`).join('');

  let avancar = '';
  if (prox && !p.alt) {
    if (podeConduzir(p, p.etapa + 1)) {
      const bloqueioDocs = prox.gateDocs && docsPendentes(p).length;
      avancar = `<div class="bloco"><b>Próxima etapa: ${esc(prox.n)}</b>
        ${(prox.pede || []).map(c => campoHTML(c, p.dados[c.k], 'pede')).join('')}
        ${bloqueioDocs ? `<p class="alerta">Documentos ainda não conferidos: ${docsPendentes(p).map(d => esc(d.nome)).join('; ')}.</p>` : ''}
        ${prox.iniciaPrazo && !dadosCompletos(p) ? '<p class="alerta">Formulário incompleto: o prazo não começa a contar. Use “Aguardando complementação”.</p>' : ''}
        ${prox.checaConflito && conflitos.length ? '<p class="alerta">Há conflito de horário com outro pedido para o mesmo salão (veja acima).</p>' : ''}
        <label for="proc-obs">Observação (opcional)</label><input type="text" id="proc-obs">
        <div class="actions"><button class="btn" data-acao="procAvancar">Registrar: ${esc(prox.n)}</button></div></div>`;
    } else if (pessoaAtual() && (sec || temFuncao('lideranca'))) {
      avancar = `<p class="muted">Próxima etapa (“${esc(prox.n)}”) é de competência ${prox.quem === 'paroco' ? 'do pároco' : 'da Secretaria ou da coordenação da comunidade'}.</p>`;
    }
  }
  const podeAlt = !procEncerrado(p) && (podeConduzir(p, Math.max(1, p.etapa)) || podeConduzir(p, p.etapa + 1));
  const alt = !podeAlt ? '' : p.alt ? `<div class="actions"><button class="btn blue" data-acao="procRetomar">Retomar processo na etapa “${esc(M.etapas[p.etapa].n)}”</button></div>` : `
    <details><summary>Registrar situação alternativa</summary>
      <label for="alt-sel">Situação</label><select id="alt-sel">${M.alt.map(a => `<option>${esc(a)}</option>`).join('')}</select>
      <label for="alt-obs">Motivo / itens pendentes (vai para a mensagem de pendência)</label><textarea id="alt-obs" rows="2"></textarea>
      <div class="actions"><button class="btn wine" data-acao="procAlt">Registrar situação</button></div>
    </details>`;
  const docs = p.docs.length ? `<section class="card"><h3>Documentos</h3>
      <p class="muted">Cada documento tem situação própria. “Dispensado/alternativo” exige justificativa.</p>
      ${p.docs.map((d, i) => `<div class="item"><div><b>${esc(d.nome)}</b>${d.nota ? `<div class="muted">${esc(d.nota)}</div>` : ''}${d.obs ? `<div class="muted">Justificativa: ${esc(d.obs)}</div>` : ''}
        ${d.naoBloqueia ? '<span class="tag">não bloqueia o processo</span>' : ''}</div>
        ${sec ? `<select aria-label="Situação de ${esc(d.nome)}" data-mudar="doc" data-i="${i}" style="max-width:220px">${['pendente', 'recebido', 'em análise', 'conferido', 'dispensado/alternativo', 'requer orientação'].map(s =>
          `<option ${s === d.status ? 'selected' : ''}>${s}</option>`).join('')}</select>` : `<span class="tag ${d.status === 'conferido' ? 'ok' : 'pend'}">${esc(d.status)}</span>`}
      </div>`).join('')}</section>` : '';
  const chave = estado.msgAberta && M.msgs[estado.msgAberta] ? estado.msgAberta : (p.alt ? M.altMsg[p.alt] : M.etapas[p.etapa].msg) || Object.keys(M.msgs)[0];
  const seletor = `<label for="wa-modelo">Modelo de mensagem</label><select id="wa-modelo" data-mudar="waModelo">${Object.keys(M.msgs).map(k =>
    `<option value="${k}" ${k === chave ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select>`;
  return `
    <button class="btn outline" data-acao="voltar">← Voltar</button>
    <h2 class="title" style="margin-top:12px">${M.icone} ${esc(M.nome)}</h2>
    <div class="muted">Protocolo ${esc(p.protocolo)} · aberto em ${dataHoraBR(p.criadoEm)}</div>
    <section class="card">
      <h3 style="margin-top:0">${esc(p.titulo)}</h3>
      ${p.modelo === 'certidao' && p.dados.finalidade === 'Sim' ? '<p class="alerta">Finalidade: casamento — usar modelo específico e conferência especial. Sem download automático.</p>' : ''}
      ${p.prazo && !procEncerrado(p) ? `<p><b>Prazo:</b> ${dataBR(p.prazo)} (${CONFIG.prazoCertidaoDiasUteis} dias úteis após dados completos; feriados não descontados)</p>` : ''}
      ${p.modelo === 'salao' ? `<p><b>${reservaConfirmada(p) ? '✅ Reserva confirmada' : procEncerrado(p) && !p.alt ? 'Contrato encerrado' : '⏳ Ainda NÃO é reserva confirmada'}</b></p>` : ''}
      ${conflitos.length ? `<div class="alerta"><b>Conflito de horário</b> com: ${conflitos.map(o => `${esc(o.protocolo)} (${esc(o.dados.inicio)}–${esc(o.dados.fim)}, ${esc(situacaoProc(o))})`).join('; ')}</div>` : ''}
      ${barraProgresso(p)}
    </section>
    ${avancar || alt ? `<section class="card"><h3>Conduzir processo</h3>${avancar}${alt}</section>` : ''}
    ${docs}
    <section class="card"><h3>Dados do pedido</h3>${linhas}${extras}
      ${p.modelo === 'salao' && sec && p.etapa >= 2 ? '<div class="actions"><button class="btn outline" data-acao="procImprimir">Imprimir dados para o contrato</button></div><p class="muted">Contrato físico, no modelo oficial da Paróquia. Não há assinatura eletrônica.</p>' : ''}
    </section>
    ${sec && (p.comunicar || p.alt) ? `<section class="card"><p class="alerta">Há decisão ou pendência a comunicar ao solicitante.</p><div class="actions"><button class="btn small outline" data-acao="marcarComunicado">Comunicado por telefone/presencialmente</button></div></section>` : ''}
    ${sec ? blocoWhats({ alvo: p, id: 'proc-' + p.id, tel: p.dados.telefone, consente: p.dados.consente, texto: mensagemProc(p, chave), seletor }) : ''}
    <section class="card"><h3>Histórico</h3><ul class="hist">${p.historico.slice().reverse().map(h => {
      const obs = h.obs && (sec || h.acao.startsWith('Situação:')) ? h.obs : '';
      return `<li>${dataHoraBR(h.em)} · <b>${esc(h.acao)}</b>${sec ? ' · ' + esc(h.por) : ''}${obs ? `<div class="muted">${esc(obs)}</div>` : ''}</li>`; }).join('')}</ul>
      ${sec ? '' : '<p class="muted">Observações internas da Secretaria não aparecem aqui.</p>'}</section>`;
}

/* ================= CATEQUESE — IVC (Módulo 13) ================= */
const MESES = { JAN: 1, FEV: 2, MAR: 3, ABR: 4, MAI: 5, JUN: 6, JUL: 7, AGO: 8, SET: 9, OUT: 10, NOV: 11, DEZ: 12 };
const turmaPorId = id => dados.turmas.find(t => t.id === id);
const anoCorrente = t => Math.min(Math.max(new Date().getFullYear(), t.anoInicio), t.anoInicio + 4);
const encontrosAno = (t, ano) => ((window.IVC_CALENDARIO || {})[String(2026 + (ano - t.anoInicio))] || []);
const regEnc = (t, ano, n) => t.encontros[`${ano}-${n}`];
const ehFamilias = e => e.tipo === 'Famílias';
const ativos = t => t.catequizandos.filter(c => c.situacao === 'Cursando');
function turmasVisiveis() {
  const eu = pessoaAtual();
  if (!eu) return [];
  if (pode('catequeseTodas')) return dados.turmas;
  return dados.turmas.filter(t => t.catequistas.includes(eu.id));
}
const podeEditarTurma = t => { const eu = pessoaAtual(); return !!eu && (pode('catequeseTodas') || t.catequistas.includes(eu.id)); };
function estatAluno(t, ano, c) {
  const s = { P: 0, F: 0, J: 0, paisP: 0, paisTot: 0, seq: [] };
  encontrosAno(t, ano).forEach(e => {
    const r = regEnc(t, ano, e.n);
    if (!r) return;
    if (ehFamilias(e)) { if (r.pais[c.id]) { s.paisTot++; if (r.pais[c.id] === 'P') s.paisP++; } return; }
    const v = r.presencas[c.id];
    if (!v) return;
    s[v]++; s.seq.push({ v, data: r.data });
  });
  return s;
}
// Regra: alerta após 2 faltas consecutivas OU 3 acumuladas no ano. Justificadas (J) ficam separadas e não contam.
function alertasTurma(t, ano) {
  const out = [];
  ativos(t).forEach(c => {
    const s = estatAluno(t, ano, c);
    let cur = 0, max = 0, ultimaF = '';
    s.seq.forEach(x => { if (x.v === 'F') { cur++; max = Math.max(max, cur); ultimaF = x.data; } else if (x.v === 'P') cur = 0; });
    const motivos = [];
    if (max >= 2) motivos.push(cur >= 2 ? `${cur} faltas seguidas (em curso)` : '2 faltas seguidas no ano');
    if (s.F >= 3) motivos.push(`${s.F} faltas no ano`);
    if (!motivos.length) return;
    const ac = (t.acompanhamentos || []).filter(a => a.cat === c.id && a.ano === ano && a.em.slice(0, 10) >= ultimaF).pop();
    out.push({ c, motivo: motivos.join(' · ') + (s.J ? ` · ${s.J} justificada(s)` : '') + (ac ? ` · acompanhado em ${dataBR(ac.em)}` : ''), acompanhado: !!ac });
  });
  return out.filter(a => !a.acompanhado);
}
function chamadasAtrasadas(t) {
  const hoje = new Date(); const ano = hoje.getFullYear();
  if (ano < t.anoInicio || ano > t.anoInicio + 4) return [];
  return encontrosAno(t, ano).filter(e => {
    const m = MESES[String(e.ref).slice(0, 3)];
    return m && m < hoje.getMonth() + 1 && !regEnc(t, ano, e.n);
  });
}
function proximoEncontro(t, ano) { return encontrosAno(t, ano).find(e => !regEnc(t, ano, e.n)); }

function telaCatequese() {
  const turmas = turmasVisiveis();
  if (estado.turma === null && turmas.length === 1) estado.turma = turmas[0].id;
  const t = turmaPorId(estado.turma);
  if (!t || !turmas.includes(t)) {
    estado.turma = null;
    return `<h2 class="title">Catequese</h2><div class="muted">Iniciação à Vida Cristã — cinco anos litúrgicos, quatro volumes.</div>
      <section class="card">${turmas.map(x => `<div class="item"><div><b>${esc(x.nome)}</b><div class="muted">${esc(x.comunidade)} · ${ativos(x).length} catequizandos</div></div>
        <button class="btn outline" data-acao="abrirTurma" data-id="${x.id}">Abrir</button></div>`).join('') || '<p class="muted">Você não está vinculado a nenhuma turma.</p>'}</section>`;
  }
  if (estado.ano === null) estado.ano = anoCorrente(t);
  if (estado.chamada !== null) return telaChamada(t);
  if (estado.catEdit !== null) return telaCatequizando(t);
  return telaTurma(t);
}
function telaTurma(t) {
  const ano = estado.ano;
  const encs = encontrosAno(t, ano);
  const feitos = encs.filter(e => regEnc(t, ano, e.n));
  const prox = proximoEncontro(t, ano);
  const alertas = alertasTurma(t, ano);
  const atrasadas = ano === new Date().getFullYear() ? chamadasAtrasadas(t) : [];
  let pTot = 0, rTot = 0;
  ativos(t).forEach(c => { const s = estatAluno(t, ano, c); pTot += s.P; rTot += s.P + s.F + s.J; });
  const freq = rTot ? Math.round(pTot / rTot * 100) : 0;
  const nomesCat = t.catequistas.map(id => (pessoaPorId(id) || {}).nome || '—').join(', ');
  const editar = podeEditarTurma(t);
  return `
    ${turmasVisiveis().length > 1 ? '<button class="btn outline" data-acao="fecharTurma">← Turmas</button>' : ''}
    <h2 class="title" style="margin-top:8px">${esc(t.nome)}</h2>
    <div class="muted">${esc(t.comunidade)} · ${esc(t.etapa)} · ${esc(t.material)} · Catequista(s): ${esc(nomesCat)}</div>
    <div class="row2" style="margin-top:8px">
      <div><label for="cat-ano">Ano do itinerário</label><select id="cat-ano" data-mudar="catAno">${[0, 1, 2, 3, 4].map(i => t.anoInicio + i).map(a =>
        `<option ${a === ano ? 'selected' : ''}>${a}</option>`).join('')}</select></div>
      <div><label for="cat-dia">Dia e horário dos encontros</label><input type="text" id="cat-dia" value="${esc(t.diaHorario)}" placeholder="A definir — ex.: sábados, 9h" ${editar ? 'data-mudar="catDia"' : 'disabled'}></div>
    </div>
    <div class="grid3" style="margin-top:12px">
      <div class="stat"><span class="muted">Encontros com chamada</span><strong>${feitos.length}/${encs.length}</strong>
        <div class="barra" style="margin-top:6px"><span style="width:${encs.length ? Math.round(feitos.length / encs.length * 100) : 0}%"></span></div></div>
      <div class="stat"><span class="muted">Frequência das crianças</span><strong>${freq}%</strong></div>
      <div class="stat"><span class="muted">Catequizandos</span><strong>${ativos(t).length}</strong></div>
    </div>
    ${atrasadas.length ? `<div class="alerta"><b>${atrasadas.length} encontro(s) de meses anteriores sem chamada:</b> ${atrasadas.map(e => `${esc(e.ref)} — ${esc(e.titulo)}`).join('; ')}.</div>` : ''}
    ${alertas.length ? `<section class="card"><h3>Acompanhar (faltas)</h3>
      <p class="muted">Alerta após 2 faltas seguidas ou 3 no ano. Justificadas são contadas à parte. Não há exclusão automática: o objetivo é cuidar e acolher.</p>
      ${alertas.map(a => `<div class="item"><div><b>${esc(a.c.nome)}</b><div class="muted">${esc(a.motivo)} · resp.: ${esc(a.c.responsavel)}</div></div>
        <button class="btn outline" data-acao="abrirCat" data-id="${a.c.id}">Acompanhar</button></div>`).join('')}</section>` : ''}
    ${prox ? `<section class="card banner"><div class="muted">Próximo encontro (${esc(prox.ref)} · ${esc(prox.tipo)})</div><b style="font-size:18px">${esc(prox.titulo)}</b>
      ${prox.prev ? `<div class="muted">Data prevista: ${esc(prox.prev)}</div>` : ''}
      ${editar ? `<div class="actions"><button class="btn" data-acao="chamada" data-n="${prox.n}">Fazer chamada</button></div>` : ''}</section>` : ''}
    <section class="card"><h3>Itinerário ${ano} (${encs.length} encontros e celebrações)</h3>
      ${encs.map(e => {
        const r = regEnc(t, ano, e.n);
        let resumo = '';
        if (r) {
          const vals = Object.values(ehFamilias(e) ? r.pais : r.presencas);
          resumo = `${dataBR(r.data)} · P ${vals.filter(v => v === 'P').length} · F ${vals.filter(v => v === 'F').length} · J ${vals.filter(v => v === 'J').length}${ehFamilias(e) ? ' (responsáveis)' : ''}`;
        }
        return `<div class="item"><div><b>${e.n}. ${esc(e.titulo)}</b><div class="muted">${esc(e.ref)} · ${esc(e.tipo)}${e.prev ? ' · previsto: ' + esc(e.prev) : ''}</div>
          ${r ? `<span class="tag ok">${resumo}</span>` : '<span class="tag">sem chamada</span>'}</div>
          ${editar ? `<button class="btn small ${r ? 'outline' : ''}" data-acao="chamada" data-n="${e.n}">${r ? 'Revisar' : 'Chamada'}</button>` : ''}</div>`;
      }).join('')}
    </section>
    <section class="card"><h3>Catequizandos (${ativos(t).length})</h3>
      <div class="tabela-wrap"><table class="tabela"><thead><tr><th>Nome</th><th>P</th><th>F</th><th>J</th><th>Pais</th><th></th></tr></thead><tbody>
      ${t.catequizandos.map(c => { const s = estatAluno(t, ano, c); return `<tr><td>${esc(c.nome)}${c.situacao !== 'Cursando' ? ` <span class="tag">${esc(c.situacao)}</span>` : ''}</td>
        <td>${s.P}</td><td>${s.F}</td><td>${s.J}</td><td>${s.paisP}/${s.paisTot}</td>
        <td><button class="btn small outline" data-acao="abrirCat" data-id="${c.id}">Ver</button></td></tr>`; }).join('')}
      </tbody></table></div>
      ${editar ? `<div class="actions">
        <button class="btn small" data-acao="novoCat">+ Catequizando</button>
        <button class="btn small outline" data-acao="exportarCsv">Exportar chamada ${ano} (CSV/Excel)</button>
        <label class="btn small outline" style="margin:0;display:inline-flex;align-items:center">Importar lista (CSV)<input type="file" id="cat-import" accept=".csv,.txt" data-mudar="importar" style="display:none"></label>
      </div>
      <p class="muted">Importação: uma criança por linha — <code>nome;responsável;telefone</code>. Os dados importados ficam só neste aparelho (não vão para o GitHub).</p>` : ''}
    </section>`;
}
function telaChamada(t) {
  const ano = estado.ano;
  const e = encontrosAno(t, ano).find(x => x.n === estado.chamada);
  if (!e) { estado.chamada = null; return telaTurma(t); }
  const r = regEnc(t, ano, e.n);
  const fam = ehFamilias(e);
  if (!estado.rc) estado.rc = Object.assign({}, r ? (fam ? r.pais : r.presencas) : {});
  const botoes = c => ['P', 'F', 'J'].map(v => `<button type="button" class="${estado.rc[c.id] === v ? 'on-' + v : ''}" data-acao="marcar" data-c="${c.id}" data-v="${v}"
      aria-pressed="${estado.rc[c.id] === v}" aria-label="${v === 'P' ? 'Presente' : v === 'F' ? 'Falta' : 'Falta justificada'}: ${esc(c.nome)}">${v}</button>`).join('');
  return `
    <button class="btn outline" data-acao="fecharChamada">← Voltar à turma</button>
    <h2 class="title" style="margin-top:12px">Chamada</h2>
    <section class="card"><div class="muted">${esc(t.nome)} · ${ano} · ${esc(e.ref)} · ${esc(e.tipo)}</div><b style="font-size:18px">${e.n}. ${esc(e.titulo)}</b>
      ${fam ? '<p class="alerta">Encontro de famílias: marque a presença do <b>responsável</b> de cada catequizando.</p>' : ''}
      <label for="ch-data">Data realizada</label><input type="date" id="ch-data" value="${esc(r ? r.data : (estado.rcData || hojeISO()))}">
      ${r ? `<p class="muted">Registrada por ${esc(r.por)} em ${dataHoraBR(r.em)}. Ao salvar, a alteração fica no histórico.</p>` : ''}
      <div class="actions"><button class="btn small outline" data-acao="todosP">Marcar todos como presentes</button></div>
    </section>
    <section class="card">
      ${ativos(t).map(c => `<div class="item chamada-linha"><div><b>${esc(fam ? c.responsavel : c.nome)}</b>${fam ? `<div class="muted">responsável por ${esc(c.nome)}</div>` : ''}</div>
        <div class="pfj" role="group" aria-label="Presença de ${esc(c.nome)}">${botoes(c)}</div></div>`).join('')}
      <p class="muted">P = presente · F = falta · J = falta justificada</p>
      <div class="actions"><button class="btn" data-acao="salvarChamada">Salvar chamada</button><button class="btn outline" data-acao="fecharChamada">Cancelar</button></div>
    </section>`;
}
function telaCatequizando(t) {
  const novo = estado.catEdit === 'novo';
  const c = novo ? { nome: '', responsavel: '', telefone: '', consente: false, situacao: 'Cursando', comunic: [] } : t.catequizandos.find(x => x.id === estado.catEdit);
  if (!c) { estado.catEdit = null; return telaTurma(t); }
  const editar = podeEditarTurma(t);
  const anos = [0, 1, 2, 3, 4].map(i => t.anoInicio + i);
  const acomp = (t.acompanhamentos || []).filter(a => a.cat === c.id);
  return `
    <button class="btn outline" data-acao="fecharCat">← Voltar à turma</button>
    <h2 class="title" style="margin-top:12px">${novo ? 'Novo catequizando' : esc(c.nome)}</h2>
    <section class="card">
      <label for="c-nome">Nome da criança</label><input type="text" id="c-nome" value="${esc(c.nome)}" ${editar ? '' : 'disabled'}>
      <label for="c-resp">Responsável</label><input type="text" id="c-resp" value="${esc(c.responsavel)}" ${editar ? '' : 'disabled'}>
      <div class="row2"><div><label for="c-tel">Telefone do responsável</label><input type="text" id="c-tel" value="${esc(c.telefone)}" ${editar ? '' : 'disabled'}></div>
      <div><label for="c-sit">Situação</label><select id="c-sit" ${editar ? '' : 'disabled'}>${['Cursando', 'Aprovado(a)', 'Transferido(a)', 'Afastado(a)'].map(s => `<option ${s === c.situacao ? 'selected' : ''}>${s}</option>`).join('')}</select></div></div>
      <label class="check"><input type="checkbox" id="c-cons" ${c.consente ? 'checked' : ''} ${editar ? '' : 'disabled'}> Responsável autorizou contato por WhatsApp</label>
      ${editar ? `<div class="actions"><button class="btn" data-acao="salvarCat">Salvar</button></div>` : ''}
    </section>
    ${novo ? '' : `
    <section class="card"><h3>Frequência</h3>
      ${anos.map(a => { const s = estatAluno(t, a, c); return s.P + s.F + s.J + s.paisTot ? `<div class="item"><b>${a}</b><span class="muted">P ${s.P} · F ${s.F} · J ${s.J} · responsável presente ${s.paisP}/${s.paisTot}</span></div>` : ''; }).join('') || '<p class="muted">Sem registros.</p>'}
    </section>
    ${editar ? `<section class="card"><h3>Registrar acompanhamento</h3>
      <p class="muted">Registre apenas o necessário (ex.: “conversa com a família, retorna no próximo encontro”). Não registre informações íntimas.</p>
      <textarea id="ac-obs" rows="2"></textarea><div class="actions"><button class="btn small" data-acao="acompanhar">Registrar</button></div>
      ${acomp.length ? `<ul class="hist">${acomp.slice().reverse().map(a => `<li>${dataHoraBR(a.em)} · ${esc(a.por)}<div class="muted">${esc(a.obs)}</div></li>`).join('')}</ul>` : ''}
    </section>
    ${blocoWhats({ alvo: c, id: `cat-${t.id}-${c.id}`, tel: c.telefone, consente: c.consente,
      texto: `Olá, ${c.responsavel}! Sentimos falta de ${c.nome} nos encontros da catequese. Está tudo bem? Contamos com vocês! Catequese — Paróquia São Sebastião.` })}` : ''}`}`;
}
function exportarCsv(t, ano) {
  const cs = t.catequizandos;
  const linhas = [['Nº', 'Mês / referência', 'Tipo', 'Encontro ou celebração', 'Data realizada', ...cs.map(c => c.nome)]];
  encontrosAno(t, ano).forEach(e => {
    const r = regEnc(t, ano, e.n);
    linhas.push([e.n, e.ref, e.tipo, e.titulo, r ? dataBR(r.data) : (e.prev || ''), ...cs.map(c => r ? ((ehFamilias(e) ? r.pais : r.presencas)[c.id] || '') : '')]);
  });
  linhas.push(['Legenda: P = Presença | F = Falta | J = Falta justificada | encontros de Famílias = presença do responsável']);
  const csv = '﻿' + linhas.map(l => l.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `chamada_${t.nome.replace(/\W+/g, '_')}_${ano}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
}
function importarCsv(t, texto) {
  const linhas = texto.replace(/^﻿/, '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const sep = linhas[0] && linhas[0].includes(';') ? ';' : ',';
  let reg = linhas.map(l => l.split(sep).map(x => x.replace(/^"|"$/g, '').trim()));
  if (reg[0] && /nome/i.test(reg[0][0])) reg = reg.slice(1);
  reg = reg.filter(r => r[0]);
  if (!reg.length) return 0;
  t.catequizandos = reg.map((r, i) => ({ id: i + 1, nome: r[0], responsavel: r[1] || '', telefone: r[2] || '', consente: false, situacao: 'Cursando' }));
  t.encontros = {}; t.acompanhamentos = [];
  return reg.length;
}

/* ================= CADASTRO E ADMINISTRADORES (Módulos 01, 02, 19) ================= */
function pessoasDoCadastro() {
  if (pode('cadastrarFieis')) return dados.pessoas;
  if (pode('cadastrarGrupo')) return dados.pessoas.filter(p => p.comunidade === pessoaAtual().comunidade);
  return [];
}
const normaliza = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\(.*?\)/g, '').trim();
function formCadastro() {
  const novo = estado.editPessoa === 'novo';
  const p = novo ? { nome: '', telefone: '', comunidade: pessoaAtual().comunidade, consente: false } : pessoaPorId(estado.editPessoa);
  const trava = !pode('cadastrarFieis');
  return `
    <section class="card">
      <h3>${novo ? 'Novo cadastro de fiel (fictício)' : 'Editar cadastro'}</h3>
      <label for="p-nome">Nome</label><input type="text" id="p-nome" value="${esc(p.nome)}" placeholder="Ex.: Pessoa de Teste">
      <div class="row2">
        <div><label for="p-tel">Telefone</label><input type="text" id="p-tel" value="${esc(p.telefone || '')}" placeholder="(48) 90000-0000"></div>
        <div><label for="p-com">Comunidade</label>
          <select id="p-com" ${trava ? 'disabled' : ''}>${NOMES_UNIDADES.map(n => `<option ${n === p.comunidade ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
          ${trava ? '<div class="muted">Você cadastra apenas na sua comunidade.</div>' : ''}</div>
      </div>
      <label class="check"><input type="checkbox" id="p-cons" ${p.consente ? 'checked' : ''}> Autorizou contato por WhatsApp</label>
      <p class="muted">${novo && trava ? 'O cadastro fica “aguardando conferência” até a Secretaria confirmar.' : 'Permissões são definidas na área Administradores.'}</p>
      <div class="actions"><button class="btn" data-acao="salvarCadastro">Salvar</button><button class="btn outline" data-acao="cancelarCadastro">Cancelar</button></div>
    </section>`;
}
function telaCadastro() {
  const lista = pessoasDoCadastro();
  const total = pode('cadastrarFieis');
  const escopo = total ? 'Todas as comunidades' : `Somente ${esc(pessoaAtual().comunidade)} · contatos e dados pessoais ficam com a Secretaria`;
  return `
    <h2 class="title">Cadastro de fiéis</h2>
    <div class="muted">${escopo}. O sistema avisa sobre possíveis duplicidades, sem fundir cadastros automaticamente.</div>
    ${estado.editPessoa !== null ? formCadastro() : `<div class="actions"><button class="btn" data-acao="novoCadastro">${total ? '+ Cadastrar fiel' : '+ Indicar novo cadastro'}</button></div>`}
    <section class="card"><h3>Cadastros (${lista.length})</h3>
      ${lista.map(p => `
        <div class="item"><div><b>${esc(p.nome)}</b><div class="muted">${esc(p.comunidade)}${total ? ' · ' + esc(p.telefone || '-') : ''}</div>
          <span class="tag ${p.situacao === 'ativo' ? 'ok' : 'pend'}">${esc(p.situacao)}</span><span class="tag">${esc(nomeFuncoes(p))}</span></div>
        ${total ? `<button class="btn small outline" data-acao="editarCadastro" data-id="${p.id}">Editar</button>` : ''}</div>`).join('') || '<p class="muted">Nenhum cadastro para mostrar.</p>'}
    </section>`;
}
function podeConcederPerm(k, alvo) {
  if (!pode('administrar')) return false;
  if (SO_PADRE.includes(k) && !ehPadre(pessoaAtual())) return false;
  if (ehPadre(alvo) && !ehPadre(pessoaAtual())) return false;
  return true;
}
function telaAdmin() {
  return `
    <h2 class="title">Administradores</h2>
    <div class="muted">A Secretaria e o pároco confirmam cadastros e dão permissões. Permissões em cinza só o pároco pode alterar.</div>
    <section class="card"><h3>Pessoas (${dados.pessoas.length})</h3>
      ${dados.pessoas.map(p => {
        const pode_ = !ehPadre(p) || ehPadre(pessoaAtual());
        return `
        <details>
          <summary>${esc(p.nome)} <span class="muted" style="font-weight:400">· ${esc(p.comunidade)}</span></summary>
          <div class="muted" style="margin-top:6px">Situação: <b>${esc(p.situacao)}</b></div>
          ${p.situacao !== 'ativo' && pode('cadastrarFieis') ? `<div class="actions"><button class="btn small" data-acao="confirmarCadastro" data-id="${p.id}">Confirmar cadastro</button></div>` : ''}
          <div class="bloco"><b>Funções</b><div class="muted">Marque e aplique para sugerir as permissões abaixo.</div>
            ${Object.entries(FUNCOES).map(([k, f]) => `<label class="check"><input type="checkbox" id="a${p.id}-f-${k}" ${p.funcoes.includes(k) ? 'checked' : ''} ${pode_ ? '' : 'disabled'}> ${esc(f.nome)}</label>`).join('')}
            <div class="actions"><button class="btn small outline" data-acao="aplicarAdmin" data-id="${p.id}" ${pode_ ? '' : 'disabled'}>Aplicar funções às permissões</button></div>
          </div>
          <div class="bloco"><b>Permissões</b>
            ${PERMISSOES.map(([k, rot]) => { const lib = podeConcederPerm(k, p);
              return `<label class="check ${lib ? '' : 'off'}"><input type="checkbox" id="a${p.id}-p-${k}" ${p.perms[k] ? 'checked' : ''} ${lib ? '' : 'disabled'}> ${esc(rot)}${lib ? '' : ' (somente pároco)'}</label>`; }).join('')}
          </div>
          <div class="actions"><button class="btn" data-acao="salvarAdmin" data-id="${p.id}" ${pode_ ? '' : 'disabled'}>Salvar permissões</button></div>
        </details>`;
      }).join('')}
    </section>
    <section class="card"><h3>Trilha de auditoria (últimos registros)</h3>
      <ul class="hist">${dados.auditoria.slice(0, 60).map(a => `<li>${dataHoraBR(a.em)} · <b>${esc(a.por)}</b><div class="muted">${esc(a.acao)}</div></li>`).join('') || '<li class="muted">Nenhuma ação registrada ainda.</li>'}</ul>
    </section>`;
}
function telaComunidades() {
  return `
    <h2 class="title">Comunidades</h2>
    <div class="muted">${UNIDADES.length} comunidades oficiais da Paróquia</div>
    <div class="grid" style="margin-top:12px">
      ${UNIDADES.map(u => `<div class="card" style="margin:0"><div style="color:var(--green);font-size:22px" aria-hidden="true">✝</div><b>${esc(u.nome)}</b><div class="muted">${esc(u.bairro)}</div></div>`).join('')}
    </div>
    <section class="card"><h3>Outros locais (não contam como comunidade)</h3>
      ${OUTROS_LOCAIS.map(u => `<div class="item"><div><b>${esc(u.nome)}</b><div class="muted">${esc(u.bairro)} · ${esc(u.obs)}</div></div><span class="pill">A confirmar</span></div>`).join('')}
    </section>`;
}

/* ================= AGENDA (Módulo 04) ================= */
const TIPOS_AGENDA = [
  ['Atividade ou reunião', null, 'institucional'],
  ['Missa ou celebração', 60, 'pública'],
  ['Confissão', 15, 'reservada'],
  ['Entrevista matrimonial', 30, 'reservada'],
  ['Direção espiritual', 30, 'reservada'],
  ['Visita, bênção ou unção domiciliar (45 min + 30 min de deslocamento)', 75, 'reservada'],
  ['Unção hospitalar', 30, 'reservada']
];
const verReservada = () => ehPadre(pessoaAtual()) || ehSecretaria();
function eventosAgenda(soPublica) {
  const l = dados.eventos.filter(e => e.tipo === 'pública' || (!soPublica && (e.tipo === 'institucional' && pessoaAtual() || verReservada())));
  if (!soPublica && pessoaAtual()) {
    dados.processos.forEach(p => {
      if (reservaConfirmada(p) && procEncerrado(p) === false && (verReservada() || temFuncao('lideranca')))
        l.push({ data: p.dados.data, hora: p.dados.inicio, fim: p.dados.fim, nome: 'Salão reservado: ' + p.dados.evento, unidade: p.dados.salao, tipo: 'reserva confirmada' });
      if (p.modelo === 'batismo' && p.etapa >= 6 && !p.alt && p.dados.celData)
        l.push({ data: p.dados.celData, hora: p.dados.celHora, nome: 'Batismo (celebração confirmada)', unidade: p.dados.igreja, tipo: 'institucional' });
      if (p.modelo === 'matrimonio' && p.etapa >= 3 && !p.alt && p.dados.entData && verReservada())
        l.push({ data: p.dados.entData, hora: p.dados.entHora, fim: horaDe(minutos(p.dados.entHora) + 30), nome: 'Entrevista matrimonial', unidade: p.dados.entLocal, tipo: 'reservada' });
    });
  }
  return l.sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
}
const linhaEvento = e => `<div class="item"><div style="display:flex;gap:11px;align-items:center"><span class="datebox">${dataCurta(e.data)}</span>
  <div><b>${esc(e.nome)}</b><div class="muted">${esc(e.unidade)} · ${esc(e.hora)}${e.fim ? '–' + esc(e.fim) : ''}</div></div></div>
  ${e.tipo !== 'pública' ? `<span class="tag ${e.tipo === 'reserva confirmada' ? 'ok' : ''}">${esc(e.tipo)}</span>` : ''}</div>`;
function telaAgenda() {
  const futuros = eventosAgenda(!pessoaAtual()).filter(e => e.data >= hojeISO());
  const pendentesSalao = pessoaAtual() && verReservada() ? dados.processos.filter(p => p.modelo === 'salao' && !p.alt && p.etapa < 5) : [];
  const tipos = TIPOS_AGENDA.filter(t => t[2] !== 'reservada' || verReservada());
  return `
    <h2 class="title">Agenda Paroquial</h2>
    <div class="muted">${pessoaAtual() ? (verReservada() ? 'Agenda pública, institucional e reservada' : 'Agenda pública e institucional') : 'Agenda pública de celebrações'} · fictícia</div>
    <section class="card">${futuros.map(linhaEvento).join('') || '<p class="muted">Nenhum compromisso futuro.</p>'}</section>
    ${pendentesSalao.length ? `<section class="card"><h3>Pedidos de salão ainda NÃO confirmados</h3>
      ${pendentesSalao.map(p => `<div class="item"><div><b>${esc(p.dados.salao)}</b><div class="muted">${dataBR(p.dados.data)} · ${esc(p.dados.inicio)}–${esc(p.dados.fim)} · ${esc(situacaoProc(p))}</div></div>
        <button class="btn small outline" data-acao="abrirProc" data-id="${p.id}">Abrir</button></div>`).join('')}</section>` : ''}
    ${pode('agendar') ? `
    <section class="card"><h3>Novo compromisso</h3>
      <label for="ev-tipo">Tipo</label><select id="ev-tipo">${tipos.map(([n, d]) => `<option>${esc(n)}${d && !n.includes('min') ? ` (${d} min)` : ''}</option>`).join('')}</select>
      <label for="ev-nome">Descrição</label><input type="text" id="ev-nome" placeholder="Para atendimentos reservados, não escreva nomes nem assuntos">
      <div class="row2"><div><label for="ev-data">Data</label><input type="date" id="ev-data"></div><div><label for="ev-hora">Horário</label><input type="time" id="ev-hora"></div></div>
      <label for="ev-unidade">Local</label><select id="ev-unidade">${NOMES_UNIDADES.map(n => `<option>${esc(n)}</option>`).join('')}</select>
      <div class="actions"><button class="btn" data-acao="addEvento">Adicionar à agenda</button></div>
      <p class="muted">Durações padrão: confissão 15 min; entrevista matrimonial e direção espiritual 30 min; visita/bênção/unção domiciliar 45 min + 30 min de deslocamento; unção hospitalar 30 min. O sistema bloqueia sobreposição na agenda reservada.</p>
    </section>` : ''}`;
}

/* ================= TAREFAS (Módulo 11) ================= */
function tarefasVisiveis() {
  const eu = pessoaAtual();
  if (!eu) return [];
  if (ehPadre(eu) || pode('encaminhar')) return dados.tarefas;
  return dados.tarefas.filter(t => t.responsavel === eu.id || (pode('tarefas') && t.unidade === eu.comunidade));
}
function telaTarefas() {
  const eu = pessoaAtual();
  const geral = ehPadre(eu) || pode('encaminhar');
  const lista = tarefasVisiveis().slice().sort((a, b) => ({ aberta: 0, 'concluída': 1, encerrada: 2 }[a.estado] - { aberta: 0, 'concluída': 1, encerrada: 2 }[b.estado]) || String(a.prazo).localeCompare(String(b.prazo)));
  return `
    <h2 class="title">Tarefas</h2>
    <div class="muted">${geral ? 'Todas as tarefas da Paróquia.' : `Tarefas de ${esc(eu.comunidade)} e as atribuídas a você.`} O responsável conclui; a coordenação encerra. Prorrogação exige justificativa.</div>
    <section class="card">
      ${lista.map(t => {
        const resp = pessoaPorId(t.responsavel);
        const atrasada = t.estado === 'aberta' && t.prazo && t.prazo < hojeISO();
        const souResp = eu && t.responsavel === eu.id;
        return `<div class="item"><div><b style="${t.estado === 'encerrada' ? 'text-decoration:line-through;opacity:.55' : ''}">${esc(t.nome)}</b>
          <div class="muted">${esc(t.unidade)} · resp.: ${esc(resp ? resp.nome : '—')} · prazo ${dataBR(t.prazo)}</div>
          <span class="tag ${t.estado === 'encerrada' ? 'ok' : atrasada ? 'nao' : 'pend'}">${atrasada ? 'atrasada' : esc(t.estado)}</span></div>
          <div class="actions" style="margin:0">
            ${t.estado === 'aberta' && (souResp || pode('tarefas')) ? `<button class="btn small" data-acao="tarefaConcluir" data-id="${t.id}">Concluir</button>
              <button class="btn small outline" data-acao="tarefaProrrogar" data-id="${t.id}">Prorrogar</button>` : ''}
            ${t.estado === 'concluída' && pode('tarefas') ? `<button class="btn small blue" data-acao="tarefaEncerrar" data-id="${t.id}">Encerrar</button>
              <button class="btn small outline" data-acao="tarefaReabrir" data-id="${t.id}">Reabrir</button>` : ''}
          </div></div>`;
      }).join('')}
    </section>
    ${pode('tarefas') ? `<section class="card"><h3>Nova tarefa</h3>
      <label for="tarefa-nome">Descrição</label><input type="text" id="tarefa-nome" placeholder="O que precisa ser feito?">
      <div class="row2">
        <div><label for="tarefa-resp">Responsável</label><select id="tarefa-resp">${dados.pessoas.filter(p => p.situacao === 'ativo' && (geral || p.comunidade === eu.comunidade)).map(p => `<option value="${p.id}">${esc(p.nome)}</option>`).join('')}</select></div>
        <div><label for="tarefa-prazo">Prazo</label><input type="date" id="tarefa-prazo"></div>
      </div>
      <label for="tarefa-unidade">Unidade</label><select id="tarefa-unidade">${geral ? `<option>Paróquia</option><option>Secretaria</option>${NOMES_UNIDADES.map(n => `<option>${esc(n)}</option>`).join('')}` : `<option>${esc(eu.comunidade)}</option>`}</select>
      <div class="actions"><button class="btn" data-acao="addTarefa">Criar tarefa</button></div>
    </section>` : ''}`;
}

/* ================= FINANCEIRO (Módulo 07) ================= */
function telaFinanceiro() {
  return `
    <h2 class="title">Visão Financeira</h2>
    <div class="muted">Exemplo ilustrativo · valores fictícios</div>
    <section class="card"><h3>Caixas institucionais independentes</h3>
      <p class="muted">A Paróquia (administração central), a Matriz e cada comunidade têm registros próprios. Transferências internas não podem ser contadas duas vezes no consolidado. Fluxo: Secretaria importa até o dia 10 → CAE confere → pároco autoriza a publicação.</p></section>
    ${dados.financeiro.map(f => `
      <section class="card"><b>${esc(f.unidade)}</b><div class="muted">${esc(f.mes)}</div>
        <div class="grid3" style="margin-top:10px">
          <div class="stat"><span class="muted">Entradas</span><strong style="font-size:19px">${reais(f.entradas)}</strong></div>
          <div class="stat"><span class="muted">Saídas</span><strong style="font-size:19px">${reais(f.saidas)}</strong></div>
          <div class="stat"><span class="muted">Saldo</span><strong style="font-size:19px">${reais(f.entradas - f.saidas)}</strong></div>
        </div></section>`).join('')}`;
}

/* ================= MAPA DOS 20 MÓDULOS ================= */
const MAPA = [
  ['01', 'Cadastro único de pessoas e famílias', 'parcial', 'Cadastro, conferência e aviso de duplicidade. Falta: família/dependentes e histórico de vínculos.'],
  ['02', 'Comunidades, organismos e lideranças', 'parcial', '15 comunidades oficiais. Falta: pastorais/movimentos e mandatos.'],
  ['03', 'Secretaria e atendimento', 'demo', 'Painel da Secretaria, protocolo, prazo, prioridade, histórico, filtros e WhatsApp.'],
  ['04', 'Agenda, atendimentos e reservas', 'demo', 'Agenda pública/institucional/reservada, durações padrão, conflitos e salão.'],
  ['05', 'Planejamento Estratégico Pastoral Integrado', 'previsto', ''],
  ['06', 'Conselhos paroquiais — CPP, CPC e CAE', 'previsto', ''],
  ['07', 'Gestão financeira e prestação de contas', 'parcial', 'Somente visão ilustrativa por caixa.'],
  ['08', 'PASCOM e comunicação', 'previsto', ''],
  ['09', 'Painel e decisões do pároco', 'demo', 'Fila de decisões, alertas e botão Analisar funcional.'],
  ['10', 'Documentos, atas e arquivo', 'previsto', ''],
  ['11', 'Tarefas, voluntariado e formação', 'parcial', 'Tarefas com prazo, conclusão ≠ encerramento e prorrogação.'],
  ['12', 'Celebrações, liturgia e sacristia', 'previsto', ''],
  ['13', 'Catequese, Batismo, Matrimônio e certidões', 'demo', 'IVC 2026–2030, chamada, alertas; certidões, Batismo e Matrimônio com barra.'],
  ['14', 'Participação, visitas e vida comunitária', 'parcial', 'Agendamento de visitas/bênçãos via agenda e solicitações.'],
  ['15', 'Eventos, patrimônio, obras e contratos', 'parcial', 'Contrato de locação do salão (Anexo D.1).'],
  ['16', 'Funcionários e colaboradores', 'previsto', ''],
  ['17', 'Relatórios e indicadores', 'parcial', 'Indicadores no painel e exportação da chamada.'],
  ['18', 'Experiência, PWA e identidade visual', 'demo', 'Mobile-first, cores oficiais, instalável (PWA).'],
  ['19', 'Segurança, dados e integrações', 'parcial', 'Permissões e auditoria simuladas. Falta: login real, banco e backups.'],
  ['20', 'Implantação, testes e continuidade', 'parcial', 'Protótipo navegável com testes automatizados.']
];
function telaModulos() {
  const rot = { demo: ['ok', 'Nesta demonstração'], parcial: ['pend', 'Parcial'], previsto: ['', 'Previsto'] };
  return `
    <h2 class="title">Módulos do projeto</h2>
    <div class="muted">Situação de cada módulo do Caderno Mestre nesta demonstração. Protótipo não é sistema de produção.</div>
    <section class="card">${MAPA.map(([n, nome, st, obs]) => `<div class="item"><div><b>${n} — ${esc(nome)}</b>${obs ? `<div class="muted">${esc(obs)}</div>` : ''}</div>
      <span class="tag ${rot[st][0]}">${rot[st][1]}</span></div>`).join('')}</section>`;
}

/* ================= PAINEL DA SECRETARIA (Módulo 03) ================= */
const diasAte = iso => Math.round((new Date(iso + 'T12:00:00') - new Date(hojeISO() + 'T12:00:00')) / 86400000);
function telaSecretaria() {
  const abertos = dados.processos.filter(p => !procEncerrado(p));
  const novos = [
    ...dados.solicitacoes.filter(s => s.status === 'Enviada').map(s => ({ t: s.titulo, sub: `${s.protocolo} · solicitação`, a: 'abrirSol', id: s.id })),
    ...abertos.filter(p => p.etapa === 0 && !p.alt).map(p => ({ t: p.titulo, sub: `${p.protocolo} · ${MODELOS[p.modelo].nome}`, a: 'abrirProc', id: p.id }))
  ];
  const prazos = [
    ...abertos.filter(p => p.prazo && !p.alt).map(p => ({ t: p.titulo, prazo: p.prazo, sub: p.protocolo, a: 'abrirProc', id: p.id })),
    ...dados.solicitacoes.filter(s => s.prazo && !['Concluída', 'Não aprovada'].includes(s.status)).map(s => ({ t: s.titulo, prazo: s.prazo, sub: s.protocolo, a: 'abrirSol', id: s.id }))
  ].filter(x => diasAte(x.prazo) <= 2).sort((a, b) => a.prazo.localeCompare(b.prazo));
  const comunicar = abertos.filter(p => p.comunicar || (p.alt && !(p.comunic || []).some(c => c.em >= (p.historico.slice(-1)[0] || {}).em)));
  const docs = abertos.filter(p => p.docs.some(d => ['recebido', 'em análise'].includes(d.status)));
  const retirada = abertos.filter(p => p.modelo === 'certidao' && p.etapa === 4 && !p.alt);
  const semConfirmar = [...dados.processos, ...dados.solicitacoes].filter(o => (o.comunic || []).length && o.comunic.slice(-1)[0].situacao === 'WhatsApp aberto');
  const cadastros = dados.pessoas.filter(p => p.situacao !== 'ativo');
  const chamadas = dados.turmas.flatMap(t => chamadasAtrasadas(t).length ? [{ t, n: chamadasAtrasadas(t).length }] : []);
  const bloco = (titulo, itens, vazio) => `<section class="card"><h3>${titulo} <span class="pill">${itens.length}</span></h3>${itens.join('') || `<p class="muted">${vazio}</p>`}</section>`;
  const linha = (t, sub, acao, id, extra = '') => `<div class="item"><div><b>${esc(t)}</b><div class="muted">${sub}</div>${extra}</div><button class="btn small outline" data-acao="${acao}" data-id="${id}">Abrir</button></div>`;
  return `
    <h2 class="title">Secretaria</h2>
    <div class="muted">Fila de trabalho do dia · ${dataBR(hojeISO())} · horário de atendimento: ${esc(CONFIG.horarioSecretaria)}</div>
    <div class="grid3" style="margin-top:12px">
      <div class="stat"><span class="muted">Novos pedidos</span><strong>${novos.length}</strong></div>
      <div class="stat"><span class="muted">Prazos em até 2 dias</span><strong>${prazos.length}</strong></div>
      <div class="stat"><span class="muted">Comunicar ao solicitante</span><strong>${comunicar.length}</strong></div>
    </div>
    ${bloco('Novos pedidos para receber', novos.map(x => linha(x.t, esc(x.sub), x.a, x.id)), 'Nenhum pedido novo.')}
    ${bloco('Prazos vencendo ou vencidos', prazos.map(x => { const d = diasAte(x.prazo);
      return linha(x.t, `${esc(x.sub)} · prazo ${dataBR(x.prazo)}`, x.a, x.id, `<span class="tag ${d < 0 ? 'nao' : 'pend'}">${d < 0 ? `vencido há ${-d} dia(s)` : d === 0 ? 'vence hoje' : `vence em ${d} dia(s)`}</span>`); }), 'Nenhum prazo próximo.')}
    ${bloco('Decisões e pendências a comunicar', comunicar.map(p => linha(p.titulo, `${esc(p.protocolo)} · ${esc(situacaoProc(p))}`, 'abrirProc', p.id)), 'Nada a comunicar.')}
    ${bloco('Documentos recebidos aguardando conferência', docs.map(p => linha(p.titulo, `${esc(p.protocolo)} · ${p.docs.filter(d => ['recebido', 'em análise'].includes(d.status)).length} documento(s)`, 'abrirProc', p.id)), 'Nenhum documento a conferir.')}
    ${bloco('Certidões prontas para retirada', retirada.map(p => linha(p.titulo, `${esc(p.protocolo)} · a partir de ${dataBR(p.dados.dataRetirada)}`, 'abrirProc', p.id)), 'Nenhuma certidão aguardando retirada.')}
    ${bloco('WhatsApp aberto sem confirmação de envio', semConfirmar.map(o => linha(o.titulo, esc(o.protocolo), o.modelo ? 'abrirProc' : 'abrirSol', o.id)), 'Tudo confirmado.')}
    ${cadastros.length ? bloco('Cadastros a conferir', cadastros.map(p => `<div class="item"><div><b>${esc(p.nome)}</b><div class="muted">${esc(p.comunidade)}${p.possivelDuplicidade ? ' · <b>possível duplicidade</b>' : ''}</div></div><button class="btn small outline" data-aba="admin">Conferir</button></div>`), '') : ''}
    ${chamadas.length ? bloco('Catequese: chamadas não registradas', chamadas.map(x => `<div class="item"><div><b>${esc(x.t.nome)}</b><div class="muted">${x.n} encontro(s) de meses anteriores</div></div><button class="btn small outline" data-acao="abrirTurma" data-id="${x.t.id}">Abrir</button></div>`), '') : ''}`;
}

/* ================= USO DO SALÃO — visão da coordenação (sem dados pessoais) ================= */
function salaoDaComunidade() {
  const eu = pessoaAtual();
  return dados.processos.filter(p => p.modelo === 'salao' && p.unidade === eu.comunidade);
}
function telaSalao() {
  const lista = salaoDaComunidade().sort((a, b) => (a.dados.data + a.dados.inicio).localeCompare(b.dados.data + b.dados.inicio));
  const card = (p, acoes) => {
    const c = conflitosSalao(p);
    return `<div class="item"><div style="flex:1"><b>${dataBR(p.dados.data)} · ${esc(p.dados.inicio)}–${esc(p.dados.fim)}</b>
      <div class="muted">${esc(p.dados.salao)} · ${esc(p.dados.evento)}${p.dados.publico ? ` · ${esc(p.dados.publico)} pessoas` : ''}</div>
      <span class="tag ${p.alt ? 'nao' : reservaConfirmada(p) ? 'ok' : 'pend'}">${esc(situacaoProc(p))}</span>
      ${c.length ? '<span class="tag nao">conflito de horário</span>' : ''}
      ${acoes ? `<label for="sal-obs-${p.id}">Observação ou motivo (obrigatório para indisponível)</label><input type="text" id="sal-obs-${p.id}">
      <div class="actions"><button class="btn small" data-acao="salaoAprovar" data-id="${p.id}">Aprovar uso do espaço</button>
      <button class="btn small wine" data-acao="salaoIndisp" data-id="${p.id}">Data indisponível</button></div>` : ''}</div></div>`;
  };
  const analise = lista.filter(p => !p.alt && p.etapa <= 1);
  const aprovados = lista.filter(p => !p.alt && p.etapa >= 2 && p.etapa < 5);
  const confirmadas = lista.filter(p => reservaConfirmada(p) && !procEncerrado(p));
  return `
    <h2 class="title">Uso do salão</h2>
    <div class="muted">${esc(pessoaAtual().comunidade)} · A coordenação decide sobre o uso do espaço. Nome, telefone, documentos e contrato ficam só com a Secretaria.</div>
    <section class="card"><h3>Aguardando análise da coordenação</h3>${analise.map(p => card(p, true)).join('') || '<p class="muted">Nenhum pedido aguardando.</p>'}</section>
    <section class="card"><h3>Aprovados, aguardando contrato na Secretaria</h3>${aprovados.map(p => card(p)).join('') || '<p class="muted">Nenhum.</p>'}</section>
    <section class="card"><h3>Reservas confirmadas</h3>${confirmadas.map(p => card(p)).join('') || '<p class="muted">Nenhuma.</p>'}</section>`;
}

/* ================= NAVEGAÇÃO E RENDERIZAÇÃO ================= */
const ROTULOS = { paroco: 'Painel', secretaria: 'Secretaria', salao: 'Uso do salão', solicitacoes: 'Solicitações', processos: 'Processos', catequese: 'Catequese', cadastro: 'Cadastro',
  admin: 'Administradores', comunidades: 'Comunidades', agenda: 'Agenda', tarefas: 'Tarefas', financeiro: 'Financeiro', modulos: 'Módulos' };
const TELAS = { paroco: telaPainel, secretaria: telaSecretaria, salao: telaSalao, solicitacoes: telaSolicitacoes, processos: telaProcessos, catequese: telaCatequese, cadastro: telaCadastro,
  admin: telaAdmin, comunidades: telaComunidades, agenda: telaAgenda, tarefas: telaTarefas, financeiro: telaFinanceiro, modulos: telaModulos };
function abasDisponiveis() {
  if (estado.visitante) return ['comunidades', 'agenda'];
  const eu = pessoaAtual();
  const abas = [];
  if (pode('verPainel')) abas.push('paroco');
  if (pode('encaminhar')) abas.push('secretaria');
  abas.push('solicitacoes');
  if (pode('processos') || temFuncao('fiel') || dados.processos.some(p => p.origem === eu.id)) abas.push('processos');
  if (temFuncao('lideranca')) abas.push('salao');
  if (turmasVisiveis().length) abas.push('catequese');
  if (pode('cadastrarFieis') || pode('cadastrarGrupo')) abas.push('cadastro');
  if (pode('administrar')) abas.push('admin');
  abas.push('comunidades', 'agenda');
  if (pode('tarefas') || tarefasVisiveis().length) abas.push('tarefas');
  if (pode('financeiro')) abas.push('financeiro');
  abas.push('modulos');
  return abas;
}
function limparNavegacao() {
  Object.assign(estado, { detalhe: null, proc: null, procNovo: null, rascunho: {}, editPessoa: null, chamada: null, catEdit: null, msgAberta: null, rc: null, rcData: null });
}
function render() {
  const app = document.getElementById('app');
  const tabs = document.getElementById('tabs');
  const topo = document.getElementById('topo');
  const toast = estado.aviso ? `<div class="toast" role="status">${esc(estado.aviso)}</div>` : '';
  estado.aviso = '';
  if (!pessoaAtual() && !estado.visitante) {
    topo.innerHTML = ''; tabs.innerHTML = '';
    const telas = { 'boas-vindas': telaBoasVindas, entrar: telaEntrar, cadastro: telaCadastroProprio, certidao: telaCertidaoPublica };
    app.innerHTML = toast + (telas[estado.tela] || telaBoasVindas)();
    window.scrollTo(0, 0);
    return;
  }
  const abas = abasDisponiveis();
  if (!abas.includes(estado.aba)) estado.aba = abas[0];
  const p = pessoaAtual();
  topo.innerHTML = `<div class="topbar"><span>Entrou como ${p ? `<b>${esc(p.nome)}</b> · ${esc(nomeFuncoes(p))}` : '<b>Visitante</b>'}</span>
    <button class="btn outline small" data-acao="sair">Sair</button>
    <button class="btn outline small" data-acao="reset">Restaurar dados de exemplo</button></div>`;
  tabs.innerHTML = abas.map(a => `<button data-aba="${a}" class="${a === estado.aba ? 'active' : ''}" ${a === estado.aba ? 'aria-current="page"' : ''}>${(a === 'processos' && !ehSecretaria() ? 'Meus pedidos' : ROTULOS[a])}</button>`).join('');
  app.innerHTML = toast + TELAS[estado.aba]();
  const ativa = tabs.querySelector('.active');
  if (ativa && ativa.scrollIntoView) ativa.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  window.scrollTo(0, 0);
}
const ir = (aviso = '') => { estado.aviso = aviso; salvar(); render(); };

/* ================= AÇÕES ================= */
function valor(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
function marcado(id) { const el = document.getElementById(id); return !!(el && el.checked); }
function sairDaSessao() { estado.pessoaId = null; estado.visitante = false; estado.tela = 'boas-vindas'; estado.turma = null; estado.ano = null; limparNavegacao(); }

const ACOES = {
  entrar() {
    estado.pessoaId = Number(valor('login-pessoa')); estado.visitante = false; limparNavegacao(); estado.turma = null; estado.ano = null;
    estado.aba = pode('verPainel') ? 'paroco' : pode('encaminhar') ? 'secretaria' : temFuncao('catequista') ? 'catequese' : temFuncao('lideranca') ? 'salao' : 'solicitacoes';
    registrar('Entrou no aplicativo'); ir();
  },
  sair() { sairDaSessao(); render(); },
  reset() { if (confirm('Restaurar os dados fictícios da demonstração? Tudo o que foi registrado neste aparelho será apagado.')) { dados = seed(); limparNavegacao(); estado.turma = null; estado.ano = null; ir('Dados de exemplo restaurados.'); } },
  cadastroProprio() {
    const nome = valor('auto-nome');
    if (!nome) return alert('Informe seu nome.');
    if (!marcado('auto-lgpd')) return alert('Para enviar, é preciso concordar com o uso dos dados para a vida paroquial.');
    const dup = dados.pessoas.find(p => normaliza(p.nome) === normaliza(nome));
    dados.pessoas.push({ id: proximoId(dados.pessoas), nome, telefone: valor('auto-tel') || '-', comunidade: valor('auto-com'), funcoes: ['fiel'],
      perms: permsDe(['fiel']), situacao: 'aguardando conferência', consente: marcado('auto-cons'), possivelDuplicidade: dup ? dup.id : null });
    registrar(`Cadastro próprio enviado: ${nome}${dup ? ' (possível duplicidade)' : ''}`);
    estado.tela = 'boas-vindas'; ir('Cadastro enviado. A Secretaria ou o coordenador da sua comunidade vai conferir e liberar o acesso.');
  },
  consultar() { estado.consulta = valor('cons-prot') || null; render(); },

  // Solicitações
  abrirSol(d) { limparNavegacao(); estado.detalhe = Number(d.id); estado.aba = 'solicitacoes'; render(); },
  voltar() { limparNavegacao(); render(); },
  novaSol() {
    const titulo = valor('sol-titulo');
    if (!titulo) return alert('Informe o assunto.');
    const s = { id: proximoId(dados.solicitacoes), protocolo: novoProtocolo(), titulo, unidade: valor('sol-unidade'), tipo: valor('sol-tipo'),
      detalhe: valor('sol-detalhe') || '-', status: 'Enviada', origem: estado.pessoaId, prioridade: 'Normal', prazo: '', criadoEm: agoraISO(), historico: [] };
    dados.solicitacoes.push(s); historico(s, 'Enviada');
    ir(`Solicitação enviada. Protocolo ${s.protocolo}. Acompanhe a situação aqui.`);
  },
  solStatus(d) {
    const s = dados.solicitacoes.find(x => x.id === estado.detalhe);
    const obs = valor('obs');
    if (['Devolvida para correção', 'Aguardando esclarecimento', 'Não aprovada'].includes(d.st) && !obs) return alert('Informe a justificativa ou orientação.');
    s.status = d.st; historico(s, d.st, obs);
    ir(`Registrado: ${d.st}.`);
  },
  solResponder() {
    const s = dados.solicitacoes.find(x => x.id === estado.detalhe);
    const r = valor('resp'); if (!r) return alert('Escreva a resposta.');
    s.status = 'Recebida pela Secretaria'; historico(s, 'Resposta do solicitante', r);
    ir('Resposta enviada à Secretaria.');
  },

  // Processos
  procNovo(d) { limparNavegacao(); estado.procNovo = d.modelo; estado.aba = 'processos'; render(); },
  procCancelar() { limparNavegacao(); render(); },
  abrirProc(d) { limparNavegacao(); estado.proc = Number(d.id); estado.aba = 'processos'; render(); },
  procEnviar(d) {
    const M = MODELOS[d.modelo];
    const rasc = Object.assign({}, estado.rascunho, lerCampos(M.campos));
    const campos = camposAtivos(M, rasc);
    const falta = campos.filter(c => c.obrig && !rasc[c.k]);
    if (falta.length) return alert('Preencha: ' + falta.map(c => c.rot).join(', ') + '.');
    if (d.modelo === 'salao' && minutos(rasc.fim) <= minutos(rasc.inicio)) return alert('O término deve ser depois do início.');
    if (rasc.telefone && !telefoneWa(rasc.telefone) && !confirm('O telefone parece inválido para WhatsApp. Enviar assim mesmo?')) return;
    const dadosP = {}; campos.forEach(c => { dadosP[c.k] = rasc[c.k]; });
    const p = { id: proximoId(dados.processos), protocolo: novoProtocolo(), modelo: d.modelo, origem: pessoaAtual() ? pessoaAtual().id : null,
      dados: dadosP, etapa: 0, alt: null, pendencias: '', titulo: M.titulo(dadosP),
      unidade: dadosP.comunidade || (dadosP.salao ? comunidadeDoSalao(dadosP.salao) : dadosP.local && dadosP.local !== 'Não sei' ? dadosP.local : MATRIZ),
      docs: M.docs().map(x => Object.assign({ status: 'pendente', obs: '' }, x)), historico: [], comunic: [], criadoEm: agoraISO() };
    dados.processos.push(p); historico(p, M.etapas[0].n);
    limparNavegacao();
    if (!pessoaAtual()) { estado.consulta = p.protocolo; return ir(`Pedido enviado. Guarde seu protocolo: ${p.protocolo}.`); }
    estado.proc = p.id;
    const conf = conflitosSalao(p);
    ir(`Enviado. Protocolo ${p.protocolo}.${conf.length ? ' Atenção: já existe pedido para este salão no mesmo horário; a Secretaria vai analisar.' : ''}`);
  },
  procAvancar() {
    const p = procPorId(estado.proc); const M = MODELOS[p.modelo]; const E = M.etapas[p.etapa + 1];
    if (!E || p.alt || !podeConduzir(p, p.etapa + 1)) return alert('Você não tem competência para esta etapa.');
    const pede = lerCampos(E.pede || [], 'pede');
    const falta = (E.pede || []).filter(c => c.obrig && !pede[c.k]);
    if (falta.length) return alert('Preencha: ' + falta.map(c => c.rot).join(', ') + '.');
    if (E.gateDocs && docsPendentes(p).length) return alert('Ainda há documentos não conferidos:\n- ' + docsPendentes(p).map(x => x.nome).join('\n- '));
    if (E.iniciaPrazo && !dadosCompletos(p)) return alert('O formulário está incompleto. O prazo não começa a contar: registre “Aguardando complementação” e peça os dados que faltam.');
    if (E.checaConflito) {
      const c = conflitosSalao(p);
      if (c.some(reservaConfirmada)) return alert('Já existe reserva CONFIRMADA para este salão neste horário (' + c.filter(reservaConfirmada).map(o => o.protocolo).join(', ') + '). Registre “Data indisponível”.');
      if (c.length && !confirm('Há outro pedido em análise para o mesmo salão e horário (' + c.map(o => o.protocolo).join(', ') + '). Aprovar mesmo assim?')) return;
    }
    Object.assign(p.dados, pede);
    p.etapa++;
    if (E.iniciaPrazo) p.prazo = addDiasUteis(hojeISO(), CONFIG.prazoCertidaoDiasUteis);
    historico(p, E.n, valor('proc-obs'));
    if (E.msg && p.dados.consente) { p.comunic.push({ em: agoraISO(), por: nomeAtual(), situacao: 'mensagem preparada (' + E.msg + ')' }); estado.msgAberta = E.msg; }
    ir(`Etapa registrada: ${E.n}.${E.msg && p.dados.consente ? ' Mensagem de WhatsApp preparada abaixo.' : ''}`);
  },
  procAlt() {
    const p = procPorId(estado.proc); const M = MODELOS[p.modelo];
    const alt = valor('alt-sel'), obs = valor('alt-obs');
    if (!obs) return alert('Informe o motivo ou os itens pendentes.');
    p.alt = alt; p.pendencias = obs; historico(p, 'Situação: ' + alt, obs);
    estado.msgAberta = M.altMsg[alt] || null;
    ir(`Situação registrada: ${alt}.`);
  },
  procRetomar() { const p = procPorId(estado.proc); historico(p, 'Processo retomado', 'Saiu de: ' + p.alt); p.alt = null; p.pendencias = ''; estado.msgAberta = null; ir('Processo retomado.'); },
  procImprimir() {
    const p = procPorId(estado.proc); const M = MODELOS[p.modelo];
    const w = window.open('', '_blank');
    if (!w) return alert('Permita janelas pop-up para imprimir.');
    w.document.write(`<!doctype html><meta charset="utf-8"><title>Dados para contrato ${esc(p.protocolo)}</title><body style="font:14px Georgia,serif;padding:24px">
      <h2>Paróquia São Sebastião — dados para contrato de locação</h2><p>Protocolo ${esc(p.protocolo)} · preencher no modelo oficial · assinatura presencial</p>
      <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%">${camposAtivos(M, p.dados).filter(c => c.tipo !== 'check')
        .map(c => `<tr><th align="left" style="width:40%">${esc(c.rot)}</th><td>${c.tipo === 'date' ? dataBR(p.dados[c.k]) : esc(p.dados[c.k] || '')}</td></tr>`).join('')}</table>
      <p>Luz consumida: ________ &nbsp; Gás consumido: ________</p><script>print()<\/script></body>`);
    w.document.close();
    historico(p, 'Dados para contrato impressos'); salvar();
  },

  // Uso do salão (coordenação)
  salaoAprovar(d) {
    const p = procPorId(Number(d.id));
    if (!p || !podeConduzir(p, 2)) return alert('Sem competência para esta decisão.');
    const c = conflitosSalao(p);
    if (c.some(reservaConfirmada)) return alert('Já existe reserva CONFIRMADA neste horário. Marque “Data indisponível”.');
    if (c.length && !confirm('Há outro pedido em análise para o mesmo horário. Aprovar mesmo assim?')) return;
    const obs = valor('sal-obs-' + p.id);
    if (p.etapa === 0) { p.etapa = 1; historico(p, MODELOS.salao.etapas[1].n); }
    p.etapa = 2; historico(p, MODELOS.salao.etapas[2].n, obs); p.comunicar = true;
    ir('Uso aprovado. A Secretaria segue com o contrato e comunica o solicitante.');
  },
  salaoIndisp(d) {
    const p = procPorId(Number(d.id));
    if (!p || !podeConduzir(p, 2)) return alert('Sem competência para esta decisão.');
    const obs = valor('sal-obs-' + p.id);
    if (!obs) return alert('Informe o motivo.');
    p.alt = 'Data indisponível'; p.pendencias = obs; historico(p, 'Situação: Data indisponível', obs); p.comunicar = true;
    ir('Registrado. A Secretaria vai comunicar o solicitante.');
  },
  marcarComunicado() { const p = procPorId(estado.proc); p.comunicar = false; historico(p, 'Solicitante comunicado (por telefone ou presencialmente)'); ir('Registrado como comunicado.'); },

  // WhatsApp
  waAbrir(d) {
    const a = alvoComunicacao(d.alvo); if (!a) return;
    const texto = valor('wa-txt');
    const num = telefoneFicticio(a.tel) ? '' : telefoneWa(a.tel);
    window.open(`https://wa.me/${num || ''}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
    a.obj.comunic = a.obj.comunic || [];
    a.obj.comunic.push({ em: agoraISO(), por: nomeAtual(), situacao: 'WhatsApp aberto' });
    a.obj.comunicar = false;
    registrar(`${a.obj.protocolo || a.obj.nome}: WhatsApp aberto (envio não confirmado)`);
    ir('WhatsApp aberto. Depois de enviar, marque “envio confirmado manualmente”.');
  },
  waConfirmar(d) {
    const a = alvoComunicacao(d.alvo); if (!a) return;
    a.obj.comunic.push({ em: agoraISO(), por: nomeAtual(), situacao: 'envio confirmado manualmente' });
    registrar(`${a.obj.protocolo || a.obj.nome}: envio por WhatsApp confirmado manualmente`);
    ir('Envio confirmado manualmente.');
  },

  // Catequese
  abrirTurma(d) { limparNavegacao(); estado.turma = Number(d.id); estado.ano = null; estado.aba = 'catequese'; render(); },
  fecharTurma() { limparNavegacao(); estado.turma = null; estado.ano = null; render(); },
  chamada(d) { limparNavegacao(); estado.chamada = Number(d.n); render(); },
  fecharChamada() { limparNavegacao(); render(); },
  marcar(d, b) {
    estado.rc[d.c] = d.v;
    b.parentElement.querySelectorAll('button').forEach(x => { const on = x.dataset.v === d.v; x.className = on ? 'on-' + x.dataset.v : ''; x.setAttribute('aria-pressed', on); });
  },
  todosP() { const t = turmaPorId(estado.turma); estado.rcData = valor('ch-data'); ativos(t).forEach(c => { estado.rc[c.id] = 'P'; }); render(); },
  salvarChamada() {
    const t = turmaPorId(estado.turma); const ano = estado.ano;
    const e = encontrosAno(t, ano).find(x => x.n === estado.chamada);
    const data = valor('ch-data');
    if (!data) return alert('Informe a data realizada.');
    const faltando = ativos(t).filter(c => !estado.rc[c.id]);
    if (faltando.length && !confirm(`${faltando.length} catequizando(s) sem marcação. Salvar assim mesmo?`)) return;
    const chave = `${ano}-${e.n}`;
    const antigo = t.encontros[chave];
    const reg = antigo || { presencas: {}, pais: {} };
    reg.data = data; reg.por = nomeAtual(); reg.em = agoraISO();
    if (ehFamilias(e)) reg.pais = Object.assign({}, estado.rc); else reg.presencas = Object.assign({}, estado.rc);
    t.encontros[chave] = reg;
    registrar(`Catequese ${t.nome} · ${ano} · encontro ${e.n}: chamada ${antigo ? 'alterada' : 'registrada'}`);
    limparNavegacao();
    const novos = alertasTurma(t, ano);
    ir(`Chamada salva.${novos.length ? ` ${novos.length} catequizando(s) precisam de acompanhamento.` : ''}`);
  },
  abrirCat(d) { const id = Number(d.id); if (estado.aba !== 'catequese') { limparNavegacao(); estado.aba = 'catequese'; } else limparNavegacao(); estado.catEdit = id; render(); },
  novoCat() { limparNavegacao(); estado.catEdit = 'novo'; render(); },
  fecharCat() { limparNavegacao(); render(); },
  salvarCat() {
    const t = turmaPorId(estado.turma);
    const nome = valor('c-nome'); if (!nome) return alert('Informe o nome.');
    const campos = { nome, responsavel: valor('c-resp'), telefone: valor('c-tel'), situacao: valor('c-sit'), consente: marcado('c-cons') };
    if (estado.catEdit === 'novo') { t.catequizandos.push(Object.assign({ id: proximoId(t.catequizandos) }, campos)); registrar(`Catequese ${t.nome}: catequizando incluído`); }
    else { Object.assign(t.catequizandos.find(x => x.id === estado.catEdit), campos); registrar(`Catequese ${t.nome}: cadastro de catequizando atualizado`); }
    limparNavegacao(); ir('Catequizando salvo.');
  },
  acompanhar() {
    const t = turmaPorId(estado.turma); const obs = valor('ac-obs');
    if (!obs) return alert('Descreva brevemente o acompanhamento.');
    t.acompanhamentos = t.acompanhamentos || [];
    t.acompanhamentos.push({ cat: estado.catEdit, ano: estado.ano, em: agoraISO(), por: nomeAtual(), obs });
    registrar(`Catequese ${t.nome}: acompanhamento registrado`);
    ir('Acompanhamento registrado. O alerta sai do painel até uma nova falta.');
  },
  exportarCsv() { exportarCsv(turmaPorId(estado.turma), estado.ano); },

  // Cadastro e administração
  novoCadastro() { estado.editPessoa = 'novo'; render(); },
  editarCadastro(d) { if (!pode('cadastrarFieis')) return; estado.editPessoa = Number(d.id); render(); },
  cancelarCadastro() { estado.editPessoa = null; render(); },
  salvarCadastro() {
    const nome = valor('p-nome'); if (!nome) return alert('Informe o nome (fictício).');
    const novo = estado.editPessoa === 'novo';
    const comunidade = pode('cadastrarFieis') ? valor('p-com') : pessoaAtual().comunidade;
    const dup = dados.pessoas.find(p => p.id !== estado.editPessoa && normaliza(p.nome) === normaliza(nome));
    if (dup && !confirm(`Possível duplicidade com “${dup.nome}” (${dup.comunidade}). Os cadastros não serão fundidos automaticamente. Salvar mesmo assim?`)) return;
    if (novo) {
      const pendente = !pode('cadastrarFieis');
      dados.pessoas.push({ id: proximoId(dados.pessoas), nome, telefone: valor('p-tel') || '-', comunidade, funcoes: ['fiel'], perms: permsDe(['fiel']),
        situacao: pendente ? 'aguardando conferência' : 'ativo', consente: marcado('p-cons') });
      registrar(`Cadastro criado: ${nome}`);
      estado.aviso = pendente ? 'Cadastro criado e aguardando conferência da Secretaria.' : 'Fiel cadastrado.';
    } else {
      Object.assign(pessoaPorId(estado.editPessoa), { nome, telefone: valor('p-tel') || '-', comunidade, consente: marcado('p-cons') });
      registrar(`Cadastro alterado: ${nome}`);
      estado.aviso = 'Cadastro atualizado.';
    }
    estado.editPessoa = null; ir(estado.aviso);
  },
  confirmarCadastro(d) { const p = pessoaPorId(Number(d.id)); p.situacao = 'ativo'; registrar(`Cadastro confirmado: ${p.nome}`); ir(p.nome + ': cadastro confirmado.'); },
  aplicarAdmin(d) {
    const id = Number(d.id);
    const perms = permsDe(Object.keys(FUNCOES).filter(k => marcado(`a${id}-f-${k}`)));
    PERMISSOES.forEach(([k]) => { const el = document.getElementById(`a${id}-p-${k}`); if (el && !el.disabled) el.checked = perms[k]; });
  },
  salvarAdmin(d) {
    const id = Number(d.id); const p = pessoaPorId(id);
    const novas = Object.keys(FUNCOES).filter(k => marcado(`a${id}-f-${k}`));
    if (!ehPadre(pessoaAtual()) && ['padre', 'secretaria'].some(f => novas.includes(f) !== p.funcoes.includes(f)))
      return alert('Somente o pároco pode alterar as funções de Pároco e Secretaria.');
    p.funcoes = novas;
    PERMISSOES.forEach(([k]) => { const el = document.getElementById(`a${id}-p-${k}`); if (el && !el.disabled) p.perms[k] = el.checked; });
    registrar(`Permissões alteradas: ${p.nome} (${novas.join(', ') || 'sem função'})`);
    ir('Permissões de ' + p.nome + ' salvas. Valem no próximo acesso.');
  },

  // Agenda
  addEvento() {
    const tipoTxt = valor('ev-tipo');
    const tipo = TIPOS_AGENDA.find(t => tipoTxt.startsWith(t[0]));
    const data = valor('ev-data'), hora = valor('ev-hora');
    let nome = valor('ev-nome');
    if (!data || !hora) return alert('Preencha data e horário.');
    if (tipo[2] === 'reservada') nome = 'Atendimento reservado — ' + tipo[0].split(' (')[0];
    else if (!nome) return alert('Preencha a descrição.');
    const dur = tipo[1] || 60;
    const fim = horaDe(minutos(hora) + dur);
    const ev = { id: proximoId(dados.eventos), data, hora, fim, nome, unidade: valor('ev-unidade'), tipo: tipo[2] };
    const choques = eventosAgenda(false).filter(e => e.data === data && sobrepoe(minutos(hora), minutos(fim), minutos(e.hora), minutos(e.fim || horaDe(minutos(e.hora) + 60))));
    if (tipo[2] === 'reservada') {
      const c = choques.filter(e => e.tipo === 'reservada');
      if (c.length) return alert(`Conflito na agenda reservada do pároco: ${c.map(e => e.hora + ' ' + e.nome).join('; ')}.`);
    } else if (choques.some(e => e.unidade === ev.unidade) && !confirm('Já existe compromisso no mesmo local e horário. Incluir mesmo assim?')) return;
    dados.eventos.push(ev); registrar(`Agenda: ${nome} em ${dataBR(data)} ${hora}`);
    ir(`Compromisso incluído (${hora}–${fim}).`);
  },

  // Tarefas
  addTarefa() {
    const nome = valor('tarefa-nome'); if (!nome) return alert('Informe a descrição.');
    const prazo = valor('tarefa-prazo'); if (!prazo) return alert('Informe o prazo.');
    const t = { id: proximoId(dados.tarefas), nome, unidade: valor('tarefa-unidade'), responsavel: Number(valor('tarefa-resp')), prazo, estado: 'aberta', historico: [] };
    dados.tarefas.push(t); historico(t, 'Tarefa criada');
    ir('Tarefa criada e atribuída.');
  },
  tarefaConcluir(d) { const t = dados.tarefas.find(x => x.id === Number(d.id)); t.estado = 'concluída'; historico(t, 'Concluída pelo responsável'); ir('Tarefa concluída. Aguarda encerramento da coordenação.'); },
  tarefaEncerrar(d) { const t = dados.tarefas.find(x => x.id === Number(d.id)); t.estado = 'encerrada'; historico(t, 'Encerrada pela coordenação'); ir('Tarefa encerrada.'); },
  tarefaReabrir(d) { const t = dados.tarefas.find(x => x.id === Number(d.id)); t.estado = 'aberta'; historico(t, 'Reaberta'); ir('Tarefa reaberta.'); },
  tarefaProrrogar(d) {
    const t = dados.tarefas.find(x => x.id === Number(d.id));
    const just = prompt('Justificativa da prorrogação:'); if (!just) return;
    const novo = prompt('Novo prazo (AAAA-MM-DD):', t.prazo); if (!novo || !/^\d{4}-\d{2}-\d{2}$/.test(novo)) return alert('Prazo inválido.');
    historico(t, `Prorrogada de ${dataBR(t.prazo)} para ${dataBR(novo)}`, just); t.prazo = novo;
    ir('Prazo prorrogado com justificativa.');
  }
};

document.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const d = b.dataset;
  if (d.tela) { estado.tela = d.tela; estado.rascunho = {}; if (d.tela !== 'certidao') estado.consulta = null; render(); return; }
  if ('visitante' in d) { sairDaSessao(); estado.visitante = true; estado.aba = 'comunidades'; render(); return; }
  if (d.aba) { limparNavegacao(); estado.aba = d.aba; render(); return; }
  if (d.acao && ACOES[d.acao]) ACOES[d.acao](d, b);
});
document.addEventListener('change', e => {
  const el = e.target; const m = el.dataset && el.dataset.mudar;
  if (!m) return;
  if (m === 'filtro') { estado.filtro.status = valor('fil-status'); estado.filtro.tipo = valor('fil-tipo'); render(); }
  else if (m === 'filtroModelo') { estado.filtro.modelo = el.value; render(); }
  else if (m === 'rascunho') {
    const modelo = estado.procNovo || (estado.tela === 'certidao' ? 'certidao' : null);
    if (modelo) { Object.assign(estado.rascunho, lerCampos(MODELOS[modelo].campos)); render(); }
  }
  else if (m === 'waModelo') { estado.msgAberta = el.value; render(); }
  else if (m === 'doc') {
    const p = procPorId(estado.proc); const doc = p.docs[Number(el.dataset.i)];
    let obs = '';
    if (el.value === 'dispensado/alternativo') { obs = prompt('Justificativa para dispensa ou documento alternativo:') || ''; if (!obs) { render(); return; } }
    doc.status = el.value; doc.obs = obs || doc.obs;
    historico(p, `Documento “${doc.nome}”: ${el.value}`, obs); ir();
  }
  else if (m === 'solPrio' || m === 'solPrazo') {
    const s = dados.solicitacoes.find(x => x.id === estado.detalhe);
    if (m === 'solPrio') { s.prioridade = el.value; historico(s, 'Prioridade: ' + el.value); } else { s.prazo = el.value; historico(s, 'Prazo definido: ' + dataBR(el.value)); }
    ir();
  }
  else if (m === 'catAno') { estado.ano = Number(el.value); render(); }
  else if (m === 'catDia') { const t = turmaPorId(estado.turma); t.diaHorario = el.value.trim(); registrar(`Catequese ${t.nome}: dia/horário alterado`); ir('Dia e horário salvos.'); }
  else if (m === 'importar') {
    const f = el.files && el.files[0]; if (!f) return;
    const t = turmaPorId(estado.turma);
    if (!confirm('Importar substitui a lista desta turma e apaga as chamadas já registradas neste aparelho. Continuar?')) { el.value = ''; return; }
    const r = new FileReader();
    r.onload = () => { const n = importarCsv(t, String(r.result)); registrar(`Catequese ${t.nome}: lista importada (${n})`); ir(n ? `${n} catequizandos importados (somente neste aparelho).` : 'Nenhum nome encontrado no arquivo.'); };
    r.readAsText(f, 'utf-8');
  }
});

// Expor estado apenas para testes automatizados
window.__mp = { get dados() { return dados; }, estado, render, CONFIG, MODELOS, alertasTurma, telefoneWa, addDiasUteis };

if ('serviceWorker' in navigator && /^https:|localhost|127\.0\.0\.1/.test(location.href)) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
render();
})();
