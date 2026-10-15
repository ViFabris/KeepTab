import type { LabelOption, Language } from '../types';

export interface SetupCopy {
  title: string;
  step: (current: number, total: number) => string;
  next: string;
  continue: string;
  languageDateTitle: string;
  languageDateHint: string;
  language: string;
  dateOrder: string;
  timeFormat: string;
  twelveHour: string;
  twentyFourHour: string;
  spellMonth: string;
  spellMonthHint: string;
  on: string;
  off: string;
  clockTitle: string;
  clockHint: string;
  currentDate: string;
  currentTime: string;
  timeZone: string;
  datePlaceholder: (dateOrder: string) => string;
  timePlaceholder: (timeFormat: string) => string;
  selectTimeZone: string;
  searchTimeZones: string;
  noTimeZones: string;
  liveClock: (value: string, timeZone: string) => string;
  clockPin: string;
  applyClock: string;
  clockValidation: string;
  clockApplied: string;
  clockPendingPin: string;
  sizeTitle: string;
  sizeHint: string;
  width: string;
  height: string;
  millimeters: string;
  sizeValidation: string;
  livePreview: string;
  printerWidthWarning: (maximum: number) => string;
  peopleTitle: string;
  peopleHint: string;
  personRequired: string;
  pinTitle: string;
  pinHint: string;
  pin: string;
  confirmPin: string;
  pinLengthError: string;
  pinMismatchError: string;
  optionsTitle: string;
  optionsHint: string;
  storageOptions: string;
  formOptions: string;
  optionRequired: string;
  testTitle: string;
  testHint: string;
  looksGood: string;
  changeSize: string;
  sampleItem: string;
  samplePerson: string;
  finishError: string;
}

export interface SettingsCopy {
  title: string;
  open: string;
  unlockTitle: string;
  unlockHint: string;
  unlock: string;
  wrongPin: string;
  preferences: string;
  labelSize: string;
  people: string;
  options: string;
  security: string;
  testPrint: string;
  close: string;
  save: string;
  saved: string;
  changePin: string;
  currentPin: string;
  newPin: string;
  confirmNewPin: string;
  currentPinWrong: string;
  pinChanged: string;
  addOption: string;
  optionPlaceholder: string;
  moveUp: string;
  moveDown: string;
  atLeastOneOption: string;
  optionNameRequired: string;
  removeOptionTitle: (name: string) => string;
  removeOptionHint: string;
  settingsError: string;
}

export interface AppCopy {
  setup: SetupCopy;
  settings: SettingsCopy;
  optionNames: Record<string, string>;
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
    setup: {
      title: 'Configuração inicial',
      step: (current, total) => `Etapa ${current} de ${total}`,
      next: 'Avançar',
      continue: 'Continuar',
      languageDateTitle: 'Idioma, data e hora',
      languageDateHint: 'Escolha como as datas e os horários aparecem no app e nas etiquetas.',
      language: 'Idioma',
      dateOrder: 'Formato da data',
      timeFormat: 'Formato da hora',
      twelveHour: '12 horas',
      twentyFourHour: '24 horas',
      spellMonth: 'Escrever o mês nas etiquetas',
      spellMonthHint: 'Exemplo: 20 OUT em vez de 20/10.',
      on: 'Ativado',
      off: 'Desativado',
      clockTitle: 'Data, hora e fuso do app',
      clockHint: 'Defina o relógio usado nas etiquetas e na lista de hoje. Depois de salvo, ele continua avançando normalmente.',
      currentDate: 'Data atual',
      currentTime: 'Hora atual',
      timeZone: 'Fuso horário',
      datePlaceholder: (dateOrder) => dateOrder.replace('YYYY', 'AAAA'),
      timePlaceholder: (timeFormat) => timeFormat === '12h' ? 'HH:MM AM/PM' : 'HH:MM',
      selectTimeZone: 'Selecionar fuso horário',
      searchTimeZones: 'Buscar cidade ou região',
      noTimeZones: 'Nenhum fuso corresponde à busca.',
      liveClock: (value, timeZone) => `Agora no app: ${value} · ${timeZone}`,
      clockPin: 'PIN do administrador para alterar o relógio',
      applyClock: 'Aplicar data e hora',
      clockValidation: 'Digite uma data, uma hora e um fuso IANA válidos.',
      clockApplied: 'Data, hora e fuso atualizados.',
      clockPendingPin: 'A alteração será aplicada somente depois que o PIN do administrador for criado.',
      sizeTitle: 'Tamanho da etiqueta',
      sizeHint: 'Digite a largura e a altura da etiqueta em milímetros.',
      width: 'Largura',
      height: 'Altura',
      millimeters: 'mm',
      sizeValidation: 'Digite um número entre 20 e 100 mm em cada campo.',
      livePreview: 'Prévia proporcional',
      printerWidthWarning: (maximum) => `Esta impressora aceita no máximo ${maximum} mm de largura.`,
      peopleTitle: 'Adicionar pessoas',
      peopleHint: 'Cadastre quem prepara os alimentos. É necessário ter pelo menos uma pessoa.',
      personRequired: 'Adicione pelo menos uma pessoa para continuar.',
      pinTitle: 'PIN do administrador',
      pinHint: 'Crie um PIN de 4 a 6 números para proteger as configurações.',
      pin: 'PIN',
      confirmPin: 'Confirmar PIN',
      pinLengthError: 'O PIN deve ter de 4 a 6 números.',
      pinMismatchError: 'Os PINs não são iguais.',
      optionsTitle: 'Opções de armazenamento e preparo',
      optionsHint: 'Organize as opções usadas ao criar uma etiqueta.',
      storageOptions: 'Armazenamento',
      formOptions: 'Estado ou preparo',
      optionRequired: 'Mantenha pelo menos uma opção em cada lista.',
      testTitle: 'Impressão de teste',
      testHint: 'Confira a proporção e a leitura da etiqueta antes de terminar.',
      looksGood: 'Parece bom',
      changeSize: 'Alterar tamanho',
      sampleItem: 'Alimento de teste',
      samplePerson: 'Teste',
      finishError: 'Não foi possível concluir a configuração. Tente novamente.',
    },
    settings: {
      title: 'Configurações',
      open: 'Abrir configurações',
      unlockTitle: 'Configurações protegidas',
      unlockHint: 'Digite o PIN do administrador para continuar.',
      unlock: 'Desbloquear',
      wrongPin: 'PIN incorreto. Tente novamente.',
      preferences: 'Idioma, data e hora',
      labelSize: 'Tamanho da etiqueta',
      people: 'Equipe',
      options: 'Opções',
      security: 'PIN do administrador',
      testPrint: 'Imprimir teste',
      close: 'Fechar',
      save: 'Salvar',
      saved: 'Alterações salvas.',
      changePin: 'Alterar PIN',
      currentPin: 'PIN atual',
      newPin: 'Novo PIN',
      confirmNewPin: 'Confirmar novo PIN',
      currentPinWrong: 'O PIN atual está incorreto.',
      pinChanged: 'PIN alterado.',
      addOption: 'Adicionar opção',
      optionPlaceholder: 'Digite o nome da opção',
      moveUp: 'Subir',
      moveDown: 'Descer',
      atLeastOneOption: 'Não é possível remover a última opção.',
      optionNameRequired: 'Digite um nome para a opção.',
      removeOptionTitle: (name) => `Remover ${name}?`,
      removeOptionHint: 'Etiquetas já salvas continuarão ligadas ao mesmo identificador.',
      settingsError: 'Não foi possível salvar esta alteração.',
    },
    optionNames: {
      'storage.refrigerated': 'Refrigerado',
      'storage.frozen': 'Congelado',
      'form.whole': 'Inteiro',
      'form.cut': 'Cortado',
      'form.other': 'Outro',
      'form.cooked': 'Cozido',
      'form.raw': 'Cru',
      'form.inShell': 'Com casca',
      'form.peeled': 'Descascado',
      'form.opened': 'Aberto',
      'form.unopened': 'Fechado',
      'form.shredded': 'Ralado',
    },
    appTagline: 'Label today. Keep tomorrow.',
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
    setup: {
      title: 'First-time setup',
      step: (current, total) => `Step ${current} of ${total}`,
      next: 'Next',
      continue: 'Continue',
      languageDateTitle: 'Language, date, and time',
      languageDateHint: 'Choose how dates and times appear in the app and on labels.',
      language: 'Language',
      dateOrder: 'Date format',
      timeFormat: 'Time format',
      twelveHour: '12-hour',
      twentyFourHour: '24-hour',
      spellMonth: 'Spell out month on labels',
      spellMonthHint: 'Example: OCT 20 instead of 10/20.',
      on: 'On',
      off: 'Off',
      clockTitle: 'App date, time, and time zone',
      clockHint: 'Set the clock used on labels and the Today list. After it is saved, time continues advancing normally.',
      currentDate: 'Current date',
      currentTime: 'Current time',
      timeZone: 'Time zone',
      datePlaceholder: (dateOrder) => dateOrder,
      timePlaceholder: (timeFormat) => timeFormat === '12h' ? 'HH:MM AM/PM' : 'HH:MM',
      selectTimeZone: 'Select time zone',
      searchTimeZones: 'Search city or region',
      noTimeZones: 'No time zones match your search.',
      liveClock: (value, timeZone) => `App time now: ${value} · ${timeZone}`,
      clockPin: 'Admin PIN to change the clock',
      applyClock: 'Apply date and time',
      clockValidation: 'Enter a valid date, time, and IANA time zone.',
      clockApplied: 'Date, time, and time zone updated.',
      clockPendingPin: 'The change will only be applied after the admin PIN is created.',
      sizeTitle: 'Label size',
      sizeHint: 'Enter the label width and height in millimeters.',
      width: 'Width',
      height: 'Height',
      millimeters: 'mm',
      sizeValidation: 'Enter a number from 20 to 100 mm in each field.',
      livePreview: 'Scaled preview',
      printerWidthWarning: (maximum) => `This printer supports a maximum width of ${maximum} mm.`,
      peopleTitle: 'Add people',
      peopleHint: 'Add the people who prepare food. At least one person is required.',
      personRequired: 'Add at least one person to continue.',
      pinTitle: 'Admin PIN',
      pinHint: 'Create a 4–6 digit PIN to protect settings.',
      pin: 'PIN',
      confirmPin: 'Confirm PIN',
      pinLengthError: 'The PIN must contain 4–6 digits.',
      pinMismatchError: 'The PINs do not match.',
      optionsTitle: 'Storage and form options',
      optionsHint: 'Organize the choices used when making a label.',
      storageOptions: 'Storage',
      formOptions: 'Form',
      optionRequired: 'Keep at least one option in each list.',
      testTitle: 'Test print',
      testHint: 'Check the label proportions and readability before finishing.',
      looksGood: 'Looks good',
      changeSize: 'Change size',
      sampleItem: 'Sample food',
      samplePerson: 'Test',
      finishError: 'Could not finish setup. Please try again.',
    },
    settings: {
      title: 'Settings',
      open: 'Open settings',
      unlockTitle: 'Protected settings',
      unlockHint: 'Enter the admin PIN to continue.',
      unlock: 'Unlock',
      wrongPin: 'Incorrect PIN. Try again.',
      preferences: 'Language, date, and time',
      labelSize: 'Label size',
      people: 'Staff',
      options: 'Options',
      security: 'Admin PIN',
      testPrint: 'Test print',
      close: 'Close',
      save: 'Save',
      saved: 'Changes saved.',
      changePin: 'Change PIN',
      currentPin: 'Current PIN',
      newPin: 'New PIN',
      confirmNewPin: 'Confirm new PIN',
      currentPinWrong: 'The current PIN is incorrect.',
      pinChanged: 'PIN changed.',
      addOption: 'Add option',
      optionPlaceholder: 'Enter an option name',
      moveUp: 'Move up',
      moveDown: 'Move down',
      atLeastOneOption: 'The last option cannot be removed.',
      optionNameRequired: 'Enter an option name.',
      removeOptionTitle: (name) => `Remove ${name}?`,
      removeOptionHint: 'Existing labels stay linked to the same stable identifier.',
      settingsError: 'Could not save this change.',
    },
    optionNames: {
      'storage.refrigerated': 'Refrigerated',
      'storage.frozen': 'Frozen',
      'form.whole': 'Whole',
      'form.cut': 'Cut',
      'form.other': 'Other',
      'form.cooked': 'Cooked',
      'form.raw': 'Raw',
      'form.inShell': 'In shell',
      'form.peeled': 'Peeled',
      'form.opened': 'Opened',
      'form.unopened': 'Unopened',
      'form.shredded': 'Shredded',
    },
    appTagline: 'Label today. Keep tomorrow.',
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

export function getStorageLabel(storage: string, language: Language): string {
  if (language === 'en') return storage;
  if (storage === 'Refrigerated') return 'Refrigerado';
  if (storage === 'Frozen') return 'Congelado';
  return storage;
}

export function getLabelOptionName(option: LabelOption, language: Language): string {
  if (option.customLabel) return option.customLabel;
  if (option.translationKey) {
    return COPY[language].optionNames[option.translationKey] ?? option.legacyValue;
  }
  return option.legacyValue;
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
