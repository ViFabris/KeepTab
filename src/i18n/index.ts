import type { Language, StorageType } from '../types';

export interface AppCopy {
  appTagline: string;
  navNewLabel: string;
  navToday: string;
  navStaff: string;
  offlineDatabase: string;
  changeLanguage: string;
  safetyTitle: string;
  safetyBody: string;
  sampleLabelBadge: string;
  made: string;
  useBy: string;
  notConfigured: string;
  madeBy: (name: string) => string;
  shelfLife: (duration: string) => string;
  placeholderWarning: string;
  searchPlaceholder: string;
  noItemMatches: (query: string) => string;
  back: string;
  confirmChoice: (choice: string) => string;
  loadingItems: string;
  itemQuestion: string;
  itemHint: string;
  storageQuestion: string;
  likelyOptionHint: (item: string) => string;
  formQuestion: string;
  staffQuestion: string;
  noStaffTitle: string;
  noStaffBody: string;
  openStaff: string;
  chooseItem: string;
  previewTitle: string;
  previewHint: string;
  missingShelfTitle: string;
  missingShelfBody: (item: string, form: string, storage: string) => string;
  printing: string;
  printLabel: string;
  mockPrintComplete: string;
  savedLabel: (id: number) => string;
  mockPrinterNotice: string;
  makeAnother: string;
  unableStep: string;
  genericError: string;
  todayTitle: string;
  todayHint: string;
  refresh: string;
  loadingLabels: string;
  overdueSection: string;
  todaySection: string;
  nextThreeDaysSection: string;
  nothingHere: string;
  useByValue: (date: string) => string;
  used: string;
  thrownAway: string;
  labelsLoadError: string;
  labelUpdateError: string;
  staffTitle: string;
  staffHint: string;
  staffInputPlaceholder: string;
  saving: string;
  addStaff: string;
  remove: string;
  removeStaffTitle: (name: string) => string;
  removeStaffHint: string;
  cancel: string;
  noStaffList: string;
  enterStaffName: string;
  duplicateStaff: string;
  staffLoadError: string;
  staffAddError: string;
  staffRemoveError: string;
  startingDatabase: string;
}

const COPY: Record<Language, AppCopy> = {
  'pt-BR': {
    appTagline: 'Etiquetas de cozinha',
    navNewLabel: 'Nova etiqueta',
    navToday: 'Hoje',
    navStaff: 'Equipe',
    offlineDatabase: '● Banco de dados offline',
    changeLanguage: 'Idioma',
    safetyTitle: 'DADOS DE EXEMPLO',
    safetyBody: 'Os prazos de validade são provisórios e não foram verificados para segurança dos alimentos.',
    sampleLabelBadge: 'ETIQUETA SIMULADA',
    made: 'PREPARADO EM',
    useBy: 'USAR ATÉ',
    notConfigured: 'NÃO CONFIGURADO',
    madeBy: (name) => `Preparado por ${name}`,
    shelfLife: (duration) => `Validade: ${duration}`,
    placeholderWarning: 'DADOS PROVISÓRIOS DE EXEMPLO — NÃO VERIFICADOS PARA SEGURANÇA DOS ALIMENTOS',
    searchPlaceholder: 'Buscar itens, ex.: pepino',
    noItemMatches: (query) => `Nenhum item corresponde a “${query}”.`,
    back: 'Voltar',
    confirmChoice: (choice) => `Usar ${choice}`,
    loadingItems: 'Carregando itens da cozinha…',
    itemQuestion: 'O que você vai etiquetar?',
    itemHint: 'Busque ou toque em um item.',
    storageQuestion: 'Como está armazenado?',
    likelyOptionHint: (item) => `${item} · A opção mais provável já está selecionada.`,
    formQuestion: 'Qual é o estado ou preparo?',
    staffQuestion: 'Quem está preparando?',
    noStaffTitle: 'Nenhum nome cadastrado',
    noStaffBody: 'Adicione pelo menos uma pessoa antes de criar uma etiqueta.',
    openStaff: 'Abrir Equipe',
    chooseItem: 'Escolha um item para continuar.',
    previewTitle: 'Confira a etiqueta',
    previewHint: 'Confirme os dados antes de imprimir.',
    missingShelfTitle: 'Validade não configurada',
    missingShelfBody: (item, form, storage) =>
      `Não há um prazo para ${item} + ${form} + ${storage}. Nenhum valor foi estimado e a impressão está desativada.`,
    printing: 'Imprimindo…',
    printLabel: 'Imprimir etiqueta',
    mockPrintComplete: 'Impressão simulada concluída',
    savedLabel: (id) => `Salva como etiqueta nº ${id}.`,
    mockPrinterNotice: 'Nenhuma impressora física está conectada. A etiqueta foi salva no banco de dados local.',
    makeAnother: 'Criar outra etiqueta',
    unableStep: 'Não foi possível mostrar esta etapa.',
    genericError: 'Algo deu errado. Tente novamente.',
    todayTitle: 'Hoje',
    todayHint: 'Etiquetas ativas vencidas ou com vencimento nos próximos 3 dias. Itens usados ou descartados saem desta lista.',
    refresh: 'Atualizar',
    loadingLabels: 'Carregando etiquetas…',
    overdueSection: 'Vencidas — descartar',
    todaySection: 'Vencem hoje',
    nextThreeDaysSection: 'Próximos 3 dias',
    nothingHere: 'Nenhum item.',
    useByValue: (date) => `Usar até ${date}`,
    used: 'Usado',
    thrownAway: 'Descartado',
    labelsLoadError: 'Não foi possível carregar as etiquetas salvas.',
    labelUpdateError: 'Não foi possível atualizar esta etiqueta.',
    staffTitle: 'Equipe',
    staffHint: 'Os nomes aparecem como botões grandes durante a criação da etiqueta.',
    staffInputPlaceholder: 'Digite o nome da pessoa',
    saving: 'Salvando…',
    addStaff: 'Adicionar',
    remove: 'Remover',
    removeStaffTitle: (name) => `Remover ${name}?`,
    removeStaffHint: 'As etiquetas existentes continuarão mostrando esse nome.',
    cancel: 'Cancelar',
    noStaffList: 'Nenhuma pessoa cadastrada. Adicione o primeiro nome acima.',
    enterStaffName: 'Digite um nome.',
    duplicateStaff: 'Esse nome já está cadastrado.',
    staffLoadError: 'Não foi possível carregar a equipe.',
    staffAddError: 'Não foi possível adicionar esse nome.',
    staffRemoveError: 'Não foi possível remover esse nome.',
    startingDatabase: 'Iniciando banco de dados offline…',
  },
  en: {
    appTagline: 'Kitchen labels',
    navNewLabel: 'New label',
    navToday: 'Today',
    navStaff: 'Staff',
    offlineDatabase: '● Offline database',
    changeLanguage: 'Language',
    safetyTitle: 'SAMPLE DATA',
    safetyBody: 'Shelf lives are placeholders and are not verified for food safety.',
    sampleLabelBadge: 'MOCK LABEL',
    made: 'MADE',
    useBy: 'USE BY',
    notConfigured: 'NOT CONFIGURED',
    madeBy: (name) => `Made by ${name}`,
    shelfLife: (duration) => `Shelf life: ${duration}`,
    placeholderWarning: 'PLACEHOLDER SAMPLE DATA — NOT FOOD-SAFETY VERIFIED',
    searchPlaceholder: 'Search items, e.g. cucumber',
    noItemMatches: (query) => `No items match “${query}”.`,
    back: 'Back',
    confirmChoice: (choice) => `Use ${choice}`,
    loadingItems: 'Loading kitchen items…',
    itemQuestion: 'What are you labeling?',
    itemHint: 'Search or tap an item.',
    storageQuestion: 'How is it stored?',
    likelyOptionHint: (item) => `${item} · The most likely option is already selected.`,
    formQuestion: 'What form is it in?',
    staffQuestion: 'Who is making it?',
    noStaffTitle: 'No staff names yet',
    noStaffBody: 'Add at least one person before making a label.',
    openStaff: 'Open Staff',
    chooseItem: 'Choose an item to continue.',
    previewTitle: 'Check the label',
    previewHint: 'Confirm the details before printing.',
    missingShelfTitle: 'No shelf life configured',
    missingShelfBody: (item, form, storage) =>
      `There is no value for ${item} + ${form} + ${storage}. Nothing was guessed, and printing is disabled.`,
    printing: 'Printing…',
    printLabel: 'Print label',
    mockPrintComplete: 'Mock print complete',
    savedLabel: (id) => `Saved as label #${id}.`,
    mockPrinterNotice: 'No physical printer is connected. This label was saved to the local database.',
    makeAnother: 'Make another label',
    unableStep: 'Unable to show this label step.',
    genericError: 'Something went wrong. Please try again.',
    todayTitle: 'Today',
    todayHint: 'Active labels due now or in the next 3 days. Used and discarded labels leave this list.',
    refresh: 'Refresh',
    loadingLabels: 'Loading labels…',
    overdueSection: 'Overdue — throw away',
    todaySection: 'Expiring today',
    nextThreeDaysSection: 'Next 3 days',
    nothingHere: 'Nothing here.',
    useByValue: (date) => `Use by ${date}`,
    used: 'Used',
    thrownAway: 'Thrown away',
    labelsLoadError: 'Could not load saved labels.',
    labelUpdateError: 'Could not update this label.',
    staffTitle: 'Staff',
    staffHint: 'Names appear as large buttons during label creation.',
    staffInputPlaceholder: 'Enter a staff name',
    saving: 'Saving…',
    addStaff: 'Add staff',
    remove: 'Remove',
    removeStaffTitle: (name) => `Remove ${name}?`,
    removeStaffHint: 'Existing labels will keep the name as a snapshot.',
    cancel: 'Cancel',
    noStaffList: 'No staff yet. Add the first name above.',
    enterStaffName: 'Enter a staff name.',
    duplicateStaff: 'That staff name already exists.',
    staffLoadError: 'Could not load staff.',
    staffAddError: 'Could not add that name.',
    staffRemoveError: 'Could not remove that name.',
    startingDatabase: 'Starting offline database…',
  },
};

const PORTUGUESE_ITEM_NAMES: Record<string, string> = {
  cucumber: 'Pepino',
  tomato: 'Tomate',
  lettuce: 'Alface',
  onion: 'Cebola',
  'bell-pepper': 'Pimentão',
  carrot: 'Cenoura',
  celery: 'Aipo',
  broccoli: 'Brócolis',
  'chicken-breast': 'Peito de frango',
  'ground-beef': 'Carne moída',
  'cooked-rice': 'Arroz',
  'hard-boiled-egg': 'Ovo cozido',
  'deli-turkey': 'Peito de peru fatiado',
  cheese: 'Queijo',
  soup: 'Sopa',
};

const PORTUGUESE_FORMS: Record<string, string> = {
  Whole: 'Inteiro',
  Cut: 'Cortado',
  Cooked: 'Cozido',
  Raw: 'Cru',
  'In shell': 'Com casca',
  Peeled: 'Descascado',
  Opened: 'Aberto',
  Unopened: 'Fechado',
  Shredded: 'Ralado',
};

export function getCopy(language: Language): AppCopy {
  return COPY[language];
}

export function getItemName(
  itemId: string,
  englishName: string,
  language: Language,
): string {
  return language === 'pt-BR' ? (PORTUGUESE_ITEM_NAMES[itemId] ?? englishName) : englishName;
}

export function getStorageLabel(storage: StorageType, language: Language): string {
  if (language === 'en') return storage;
  return storage === 'Refrigerated' ? 'Refrigerado' : 'Congelado';
}

export function getFormLabel(form: string, language: Language): string {
  return language === 'pt-BR' ? (PORTUGUESE_FORMS[form] ?? form) : form;
}

export function getLocale(language: Language): string {
  return language === 'pt-BR' ? 'pt-BR' : 'en-US';
}

export function getLanguageName(language: Language): string {
  return language === 'pt-BR' ? 'Português (Brasil)' : 'English';
}
