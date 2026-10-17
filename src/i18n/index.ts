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
  millimeters: string;
  livePreview: string;
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

export interface LabelSizeCopy {
  small: string;
  medium: string;
  large: string;
  smallHint: string;
  mediumHint: string;
  largeHint: string;
  unavailable: string;
  unavailableReason: (shorterSide: number, maximum: number) => string;
  selected: string;
  verificationTitle: string;
  verificationHint: string;
  databaseItem: string;
  customItem: string;
  noDatabaseItems: string;
  noStaff: string;
  fitPassed: string;
  fitTruncated: string;
  languageEnglish: string;
  languagePortuguese: string;
  customItemValue: string;
  openVerification: string;
  closeVerification: string;
  longestStaff: string;
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
  printingDebug: string;
  advancedPrinterSettings: string;
  printerHardwareNote: string;
  printerProfile58: string;
  printerProfile80: string;
  printerProfileName: string;
  printerDpi: string;
  printerHeadWidth: string;
  rasterChunkHeight: string;
  prePrintBytes: string;
  postPrintBytes: string;
  endOfLabelAction: string;
  noEndAction: string;
  lineFeed: string;
  formFeed: string;
  labelFeed: string;
  endFeedDots: string;
  threshold: string;
  defaultCopies: string;
  exportBytes: string;
  imageSizeDots: string;
  totalBytes: string;
  first64Bytes: string;
  exportError: string;
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
  labelSizes: LabelSizeCopy;
  optionNames: Record<string, string>;
  appTagline: string;
  navNewLabel: string;
  navToday: string;
  navStaff: string;
  offlineDatabase: string;
  changeLanguage: string;
  sampleLabelBadge: string;
  made: string;
  openedOn: string;
  useBy: string;
  notConfigured: string;
  madeBy: (name: string) => string;
  shelfLife: (duration: string) => string;
  placeholderWarning: string;
  searchPlaceholder: string;
  noItemMatches: (query: string) => string;
  back: string;
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
  preparingPrintImage: string;
  retry: string;
  printFailed: string;
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
  foodSafety: FoodSafetyCopy;
}

export interface FoodSafetyCopy {
  state: string;
  rioGrandeDoSul: string;
  otherState: string;
  jurisdictionHint: string;
  otherStateNotice: string;
  municipalNotice: string;
  fridgeAssumption: string;
  fridgeAssumptionHint: string;
  reducedMaximumDays: string;
  verificationMode: string;
  verificationBasis: string;
  strictMode: string;
  testMode: string;
  strictModeHint: string;
  testModeHint: string;
  items: string;
  rules: string;
  auditExport: string;
  legalNotice: string;
  legalNoticeBody: string;
  acknowledgeNotice: string;
  verificationStatus: string;
  verified: string;
  unverified: string;
  reviewerName: string;
  reviewDate: string;
  markVerified: string;
  revertUnverified: string;
  plantBasedType: string;
  plantNone: string;
  plantDrink: string;
  plantFood: string;
  heatTreated: string;
  yes: string;
  no: string;
  manufacturerDays: string;
  packageExpiry: string;
  packageIntakeTitle: string;
  packageIntakeHint: string;
  scanPackage: string;
  cameraPermission: string;
  grantCameraPermission: string;
  noBarcodeYet: string;
  barcodeOnlyNotice: string;
  barcode: string;
  gtin: string;
  scanAgain: string;
  captureEvidence: string;
  retakePhoto: string;
  photoEvidence: string;
  lotCode: string;
  confirmPackage: string;
  packageSaved: string;
  packagePhotoRequired: string;
  packageExpiryRequired: string;
  packageDateInvalid: string;
  packageDetailsDetected: string;
  registerItem: string;
  emptyCatalog: string;
  itemRegistrationTitle: string;
  itemRegistrationHint: string;
  itemRegistrationForLabelHint: string;
  itemName: string;
  itemNamePlaceholder: string;
  chooseForms: string;
  chooseStorageTypes: string;
  chooseCurrentForm: string;
  chooseCurrentStorage: string;
  preparedClassification: string;
  preparedClassificationHint: string;
  preparedInKitchen: string;
  manufacturerControlled: string;
  registerAndUse: string;
  registrationIncomplete: string;
  itemAlreadyExists: string;
  removeRegisteredItemTitle: (name: string) => string;
  removeRegisteredItemHint: string;
  lawManagedNotice: string;
  source: string;
  importCsv: string;
  csvInputHint: string;
  importReport: (accepted: number, rejected: number) => string;
  rejectedRow: (row: number, reason: string) => string;
  importReasons: Record<string, string>;
  temperatureClass: string;
  refrigerated: string;
  frozen: string;
  ambient: string;
  temperatureRequired: string;
  notVerifiedBlock: string;
  testModeBanner: string;
  testPrintWarning: string;
  confirmPrint: string;
  ambientPlantBlock: string;
  missingManufacturerDays: string;
  ruleLimited: (days: number | null, law: string, item: string) => string;
  ruleSource: string;
  enforced: string;
  informational: string;
  enforcedIn: string;
  rulesVersion: string;
  reviewedBy: string;
  recordReview: string;
  federalOnly: string;
  exportStart: string;
  exportEnd: string;
  exportCsv: string;
  exportJson: string;
  exportComplete: string;
  invalidDateRange: string;
  cappedByRule: string;
  printerProfile: string;
  appVersion: string;
  events: string;
  recordId: string;
  phase1: string;
  phase2: string;
  phase3: string;
  storageRule: string;
  englishInformalNotice: string;
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
      sizeHint: 'Escolha um dos três tamanhos de etiqueta disponíveis.',
      millimeters: 'mm',
      livePreview: 'Prévia proporcional',
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
      printingDebug: 'Depuração de impressão',
      advancedPrinterSettings: 'Configurações avançadas da impressora',
      printerHardwareNote: 'Varia conforme a impressora de etiquetas; teste no equipamento real.',
      printerProfile58: '58 mm · 384 pontos',
      printerProfile80: '80 mm · 576 pontos',
      printerProfileName: 'Nome do perfil',
      printerDpi: 'Resolução (dpi)',
      printerHeadWidth: 'Largura da cabeça (pontos)',
      rasterChunkHeight: 'Linhas por bloco raster',
      prePrintBytes: 'Bytes antes da impressão (hex)',
      postPrintBytes: 'Bytes depois da impressão (hex)',
      endOfLabelAction: 'Ação no fim da etiqueta',
      noEndAction: 'Nenhuma',
      lineFeed: 'Avanço de linha',
      formFeed: 'Avanço de formulário',
      labelFeed: 'Avanço de etiqueta',
      endFeedDots: 'Avanço final (pontos)',
      threshold: 'Limiar preto/branco (%)',
      defaultCopies: 'Cópias padrão',
      exportBytes: 'Exportar bytes',
      imageSizeDots: 'Imagem (pontos)',
      totalBytes: 'Total de bytes',
      first64Bytes: 'Primeiros 64 bytes (hex)',
      exportError: 'Não foi possível exportar o arquivo de impressão.',
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
    labelSizes: {
      small: 'Pequena',
      medium: 'Média',
      large: 'Grande',
      smallHint: 'Molhos e potes pequenos',
      mediumHint: 'Potes de uso geral',
      largeHint: 'Recipientes grandes e cubas',
      unavailable: 'Indisponível',
      unavailableReason: (shorterSide, maximum) =>
        `O lado de ${shorterSide} mm excede a largura imprimível de ${maximum} mm.`,
      selected: 'Selecionada',
      verificationTitle: 'Verificação dos modelos',
      verificationHint: 'Piores casos em inglês e português, sem enviar nada à impressora.',
      databaseItem: 'Maior nome do banco de dados',
      customItem: 'Nome personalizado longo',
      noDatabaseItems: 'Nenhum item no banco de dados',
      noStaff: 'Nenhuma pessoa cadastrada',
      fitPassed: 'Cabe nas zonas definidas',
      fitTruncated: 'Ajustado com reticências na zona',
      languageEnglish: 'Inglês',
      languagePortuguese: 'Português (Brasil)',
      customItemValue: 'Molho artesanal de pimentões assados com ervas frescas',
      openVerification: 'Verificar todos os modelos',
      closeVerification: 'Fechar verificação',
      longestStaff: 'Maior nome da equipe',
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
    sampleLabelBadge: 'ETIQUETA SIMULADA',
    made: 'PREPARADO EM',
    openedOn: 'ABERTO EM',
    useBy: 'USAR ATÉ',
    notConfigured: 'NÃO CONFIGURADO',
    madeBy: (name) => `Preparado por ${name}`,
    shelfLife: (duration) => `Validade: ${duration}`,
    placeholderWarning: 'SEM REGRA APLICÁVEL OU DADOS CONFIRMADOS DA EMBALAGEM',
    searchPlaceholder: 'Buscar itens, ex.: pepino',
    noItemMatches: (query) => `Nenhum item corresponde a “${query}”.`,
    back: 'Voltar',
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
    preparingPrintImage: 'Preparando imagem para impressão…',
    retry: 'Tentar novamente',
    printFailed: 'A impressora não confirmou o envio. A etiqueta não foi salva.',
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
    foodSafety: {
      state: 'Estado',
      rioGrandeDoSul: 'Rio Grande do Sul',
      otherState: 'Outro estado',
      jurisdictionHint: 'As regras federais sempre se aplicam; as regras do RS são adicionadas quando selecionado.',
      otherStateNotice: 'Somente as regras federais estão carregadas. Consulte as regras estaduais e municipais com a vigilância sanitária local.',
      municipalNotice: 'Regras municipais não estão incluídas.',
      fridgeAssumption: 'A geladeira permanece a 4°C ou menos',
      fridgeAssumptionHint: 'Se desativado, use o prazo máximo reduzido definido abaixo.',
      reducedMaximumDays: 'Prazo máximo reduzido (dias)',
      verificationMode: 'Modo de verificação',
      verificationBasis: 'Base da verificação',
      strictMode: 'Estrito',
      testMode: 'Teste',
      strictModeHint: 'Imprime somente itens verificados com validade configurada.',
      testModeHint: 'Permite itens não verificados com aviso e registro de modo de teste.',
      items: 'Itens e verificação',
      rules: 'Regras',
      auditExport: 'Exportar auditoria',
      legalNotice: 'Aviso legal',
      legalNoticeBody: 'O KeepTab ajuda a seguir as regras, mas não substitui as responsabilidades legais do estabelecimento e do responsável. Os prazos de validade devem ser aprovados por profissional qualificado. As regras podem mudar. Regras municipais não estão incluídas.',
      acknowledgeNotice: 'Li e entendi',
      verificationStatus: 'Status da verificação',
      verified: 'Verificado',
      unverified: 'Não verificado',
      reviewerName: 'Nome do revisor',
      reviewDate: 'Data da revisão (AAAA-MM-DD)',
      markVerified: 'Marcar como verificado',
      revertUnverified: 'Voltar para não verificado',
      plantBasedType: 'Tipo de preparo com vegetais',
      plantNone: 'Nenhum',
      plantDrink: 'Bebida',
      plantFood: 'Alimento',
      heatTreated: 'Submetido a tratamento térmico pelo calor',
      yes: 'Sim',
      no: 'Não',
      manufacturerDays: 'Dias após abertura informados pelo fabricante',
      packageExpiry: 'Validade da embalagem (AAAA-MM-DD, opcional)',
      packageIntakeTitle: 'Ler embalagem do produto',
      packageIntakeHint: 'Leia o código, fotografe lote e validade e confirme exatamente o que está impresso. Um código comum identifica o produto, mas normalmente não contém lote ou validade.',
      scanPackage: 'Ler código e fotografar embalagem',
      cameraPermission: 'A câmera é necessária para ler o código e registrar a foto do lote e da validade.',
      grantCameraPermission: 'Permitir câmera',
      noBarcodeYet: 'Aponte a câmera para o código de barras ou QR/GS1 da embalagem.',
      barcodeOnlyNotice: 'Produto identificado. A validade e o lote não estão neste código; copie-os da embalagem e confirme abaixo.',
      barcode: 'Código lido',
      gtin: 'GTIN',
      scanAgain: 'Ler novamente',
      captureEvidence: 'Fotografar lote e validade',
      retakePhoto: 'Refazer foto',
      photoEvidence: 'Foto da embalagem',
      lotCode: 'Lote',
      confirmPackage: 'Confirmar dados da embalagem',
      packageSaved: 'Dados da embalagem confirmados e salvos somente neste dispositivo.',
      packagePhotoRequired: 'Fotografe a parte da embalagem que mostra lote e validade.',
      packageExpiryRequired: 'Digite a validade impressa na embalagem.',
      packageDateInvalid: 'Use uma data válida no formato AAAA-MM-DD.',
      packageDetailsDetected: 'Dados GS1 encontrados. Confira todos os campos com a embalagem antes de confirmar.',
      registerItem: 'Cadastrar alimento',
      emptyCatalog: 'Nenhum alimento cadastrado. Cadastre cada alimento uma vez para reutilizá-lo nas próximas etiquetas.',
      itemRegistrationTitle: 'Cadastrar alimento da cozinha',
      itemRegistrationHint: 'Escolha os estados e armazenamentos usados nesta cozinha. O prazo será limitado automaticamente pelas regras aplicáveis.',
      itemRegistrationForLabelHint: 'Escolha uma vez o estado atual e o armazenamento. Essas opções serão salvas com o alimento e não serão perguntadas novamente.',
      itemName: 'Nome do alimento',
      itemNamePlaceholder: 'Ex.: arroz cozido',
      chooseForms: 'Estados ou preparos disponíveis',
      chooseStorageTypes: 'Armazenamentos disponíveis',
      chooseCurrentForm: 'Estado ou preparo atual',
      chooseCurrentStorage: 'Armazenamento atual',
      preparedClassification: 'Classificação de cada estado',
      preparedClassificationHint: 'Marque como pré-preparado/preparado quando houver manipulação na cozinha, como cortar, descascar, ralar ou cozinhar.',
      preparedInKitchen: 'Pré-preparado ou preparado na cozinha',
      manufacturerControlled: 'Produto original / prazo do fabricante',
      registerAndUse: 'Cadastrar e usar',
      registrationIncomplete: 'Digite o nome e escolha pelo menos um estado e um armazenamento.',
      itemAlreadyExists: 'Já existe um alimento cadastrado com esse nome.',
      removeRegisteredItemTitle: (name) => `Remover ${name} do catálogo?`,
      removeRegisteredItemHint: 'As etiquetas e os registros anteriores serão preservados. O alimento poderá ser cadastrado novamente depois.',
      lawManagedNotice: 'O app usa o limite legal aplicável. Produtos originais ou abertos exigem os dados confirmados da embalagem.',
      source: 'Fonte',
      importCsv: 'Importar CSV',
      csvInputHint: 'Cole aqui o conteúdo do arquivo items_template.csv.',
      importReport: (accepted, rejected) => `${accepted} linha(s) importada(s); ${rejected} rejeitada(s).`,
      rejectedRow: (row, reason) => `Linha ${row}: ${reason}`,
      importReasons: {
        invalidCsv: 'CSV inválido.',
        missingRequiredValue: 'Falta um valor obrigatório ou cabeçalho.',
        invalidShelfLife: 'shelf_life_days deve ser inteiro maior que zero ou vazio.',
        invalidPreparedFood: 'prepared_food deve ser sim ou não.',
        invalidStatus: 'status deve ser unverified ou verified.',
        invalidTemperatureClass: 'Classe de temperatura inválida.',
        missingTemperatureClass: 'Informe a classe de temperatura do armazenamento.',
        invalidManufacturerDays: 'Dias após abertura devem ser inteiro maior que zero ou vazio.',
        invalidPlantBasedType: 'plant_based_type deve ser none, drink ou food.',
        invalidHeatTreated: 'heat_treated deve ser sim ou não.',
      },
      temperatureClass: 'Classe de temperatura',
      refrigerated: 'Refrigerado',
      frozen: 'Congelado',
      ambient: 'Ambiente',
      temperatureRequired: 'Escolha a classe de temperatura antes de adicionar.',
      notVerifiedBlock: 'Este item não foi verificado. O modo Estrito bloqueia a impressão.',
      testModeBanner: 'MODO DE TESTE — item não verificado',
      testPrintWarning: 'Este item não foi verificado. A etiqueta será registrada como modo de teste. Deseja imprimir?',
      confirmPrint: 'Confirmar impressão',
      ambientPlantBlock: 'Armazenamento em temperatura ambiente bloqueado por VEG-COLD — RDC 218/2005, item 4.3.11.',
      missingManufacturerDays: 'Informe os dias após abertura indicados pelo fabricante antes de imprimir.',
      ruleLimited: (days, law, item) => days === null ? `Limitado por ${law}, item ${item}.` : `Limitado a ${days} dia(s) por ${law}, item ${item}.`,
      ruleSource: 'Fonte e item',
      enforced: 'Aplicada',
      informational: 'Informativa',
      enforcedIn: 'Aplicação',
      rulesVersion: 'Versão das regras',
      reviewedBy: 'Revisado por',
      recordReview: 'Registrar revisão',
      federalOnly: 'Somente regras federais',
      exportStart: 'Data inicial (AAAA-MM-DD)',
      exportEnd: 'Data final (AAAA-MM-DD)',
      exportCsv: 'Exportar CSV',
      exportJson: 'Exportar JSON',
      exportComplete: 'Arquivo de auditoria compartilhado.',
      invalidDateRange: 'Informe um intervalo de datas válido.',
      cappedByRule: 'Regra limitadora',
      printerProfile: 'Perfil da impressora',
      appVersion: 'Versão do app',
      events: 'Eventos',
      recordId: 'ID da etiqueta',
      phase1: 'Fase 1',
      phase2: 'Fase 2',
      phase3: 'Fase 3',
      storageRule: 'regra de armazenamento',
      englishInformalNotice: 'O texto em inglês é uma tradução informal; consulte o texto legal em português.',
    },
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
      sizeHint: 'Choose one of the three available label sizes.',
      millimeters: 'mm',
      livePreview: 'Scaled preview',
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
      printingDebug: 'Printing debug',
      advancedPrinterSettings: 'Advanced printer settings',
      printerHardwareNote: 'Label printers vary; test this value on the real printer.',
      printerProfile58: '58 mm · 384 dots',
      printerProfile80: '80 mm · 576 dots',
      printerProfileName: 'Profile name',
      printerDpi: 'Resolution (dpi)',
      printerHeadWidth: 'Print head width (dots)',
      rasterChunkHeight: 'Raster rows per chunk',
      prePrintBytes: 'Pre-print bytes (hex)',
      postPrintBytes: 'Post-print bytes (hex)',
      endOfLabelAction: 'End-of-label action',
      noEndAction: 'None',
      lineFeed: 'Line feed',
      formFeed: 'Form feed',
      labelFeed: 'Label feed',
      endFeedDots: 'End feed (dots)',
      threshold: 'Black/white threshold (%)',
      defaultCopies: 'Default copies',
      exportBytes: 'Export bytes',
      imageSizeDots: 'Image (dots)',
      totalBytes: 'Total bytes',
      first64Bytes: 'First 64 bytes (hex)',
      exportError: 'Could not export the print file.',
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
    labelSizes: {
      small: 'Small',
      medium: 'Medium',
      large: 'Large',
      smallHint: 'Sauce cups and small bags',
      mediumHint: 'Everyday containers',
      largeHint: 'Large containers and hotel pans',
      unavailable: 'Unavailable',
      unavailableReason: (shorterSide, maximum) =>
        `The ${shorterSide} mm side exceeds the ${maximum} mm printable width.`,
      selected: 'Selected',
      verificationTitle: 'Template verification',
      verificationHint: 'Worst cases in English and Portuguese without sending anything to the printer.',
      databaseItem: 'Longest database item',
      customItem: 'Long custom item name',
      noDatabaseItems: 'No database items',
      noStaff: 'No staff members',
      fitPassed: 'Fits the defined zones',
      fitTruncated: 'Fitted with an ellipsis inside the zone',
      languageEnglish: 'English',
      languagePortuguese: 'Portuguese (Brazil)',
      customItemValue: 'House-roasted pepper sauce with fresh garden herbs',
      openVerification: 'Verify all templates',
      closeVerification: 'Close verification',
      longestStaff: 'Longest staff name',
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
    sampleLabelBadge: 'MOCK LABEL',
    made: 'MADE',
    openedOn: 'OPENED',
    useBy: 'USE BY',
    notConfigured: 'NOT CONFIGURED',
    madeBy: (name) => `Made by ${name}`,
    shelfLife: (duration) => `Shelf life: ${duration}`,
    placeholderWarning: 'NO APPLICABLE RULE OR CONFIRMED PACKAGE DETAILS',
    searchPlaceholder: 'Search items, e.g. cucumber',
    noItemMatches: (query) => `No items match “${query}”.`,
    back: 'Back',
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
    preparingPrintImage: 'Preparing print image…',
    retry: 'Retry',
    printFailed: 'The printer did not confirm sending. The label was not saved.',
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
    foodSafety: {
      state: 'State',
      rioGrandeDoSul: 'Rio Grande do Sul',
      otherState: 'Other state',
      jurisdictionHint: 'Federal rules always apply; RS rules are added when selected.',
      otherStateNotice: 'Only federal rules are loaded. Check state and city rules with the local health authority.',
      municipalNotice: 'Municipal rules are not included.',
      fridgeAssumption: 'The refrigerator stays at 4°C or below',
      fridgeAssumptionHint: 'When off, the reduced maximum below is used.',
      reducedMaximumDays: 'Reduced maximum (days)',
      verificationMode: 'Verification mode',
      verificationBasis: 'Verification basis',
      strictMode: 'Strict',
      testMode: 'Test',
      strictModeHint: 'Only verified items with a configured shelf life can print.',
      testModeHint: 'Allows unverified items with a warning and a test-mode audit record.',
      items: 'Items and verification',
      rules: 'Rules',
      auditExport: 'Audit export',
      legalNotice: 'Legal notice',
      legalNoticeBody: 'KeepTab helps follow the rules but does not replace the legal responsibilities of the establishment and its responsible person. Shelf lives must be approved by a qualified professional. Rules may change. Municipal rules are not included.',
      acknowledgeNotice: 'I understand',
      verificationStatus: 'Verification status',
      verified: 'Verified',
      unverified: 'Unverified',
      reviewerName: 'Reviewer name',
      reviewDate: 'Review date (YYYY-MM-DD)',
      markVerified: 'Mark verified',
      revertUnverified: 'Revert to unverified',
      plantBasedType: 'Plant-based preparation type',
      plantNone: 'None',
      plantDrink: 'Drink',
      plantFood: 'Food',
      heatTreated: 'Heat-treated by heat',
      yes: 'Yes',
      no: 'No',
      manufacturerDays: 'Manufacturer days after opening',
      packageExpiry: 'Package expiry (YYYY-MM-DD, optional)',
      packageIntakeTitle: 'Read product package',
      packageIntakeHint: 'Scan the code, photograph the lot and expiry, and confirm exactly what is printed. An ordinary barcode identifies the product but usually does not contain a lot or expiry.',
      scanPackage: 'Scan code and photograph package',
      cameraPermission: 'Camera access is needed to scan the code and record a photo of the lot and expiry.',
      grantCameraPermission: 'Allow camera',
      noBarcodeYet: 'Point the camera at the package barcode or QR/GS1 code.',
      barcodeOnlyNotice: 'Product identified. Expiry and lot are not encoded here; copy them from the package and confirm below.',
      barcode: 'Scanned code',
      gtin: 'GTIN',
      scanAgain: 'Scan again',
      captureEvidence: 'Photograph lot and expiry',
      retakePhoto: 'Retake photo',
      photoEvidence: 'Package photo',
      lotCode: 'Lot / batch',
      confirmPackage: 'Confirm package details',
      packageSaved: 'Package details confirmed and saved on this device only.',
      packagePhotoRequired: 'Photograph the package area showing the lot and expiry.',
      packageExpiryRequired: 'Enter the expiry printed on the package.',
      packageDateInvalid: 'Use a valid date in YYYY-MM-DD format.',
      packageDetailsDetected: 'GS1 details found. Check every field against the package before confirming.',
      registerItem: 'Register item',
      emptyCatalog: 'No items are registered. Register each item once and reuse it for future labels.',
      itemRegistrationTitle: 'Register a kitchen item',
      itemRegistrationHint: 'Choose the forms and storage methods used in this kitchen. Applicable legal rules will automatically limit the date.',
      itemRegistrationForLabelHint: 'Choose the current form and storage once. These choices will be saved with the item and will not be asked again.',
      itemName: 'Item name',
      itemNamePlaceholder: 'Example: cooked rice',
      chooseForms: 'Available forms or preparations',
      chooseStorageTypes: 'Available storage methods',
      chooseCurrentForm: 'Current form or preparation',
      chooseCurrentStorage: 'Current storage method',
      preparedClassification: 'Classification for each form',
      preparedClassificationHint: 'Mark pre-prepared/prepared when the kitchen handles the food, such as cutting, peeling, shredding, or cooking.',
      preparedInKitchen: 'Pre-prepared or prepared in the kitchen',
      manufacturerControlled: 'Original product / manufacturer-controlled',
      registerAndUse: 'Register and use',
      registrationIncomplete: 'Enter a name and choose at least one form and one storage method.',
      itemAlreadyExists: 'An item with this name is already registered.',
      removeRegisteredItemTitle: (name) => `Remove ${name} from the catalog?`,
      removeRegisteredItemHint: 'Existing labels and audit records will be preserved. The item can be registered again later.',
      lawManagedNotice: 'The app uses the applicable legal maximum. Original or opened products require confirmed package information.',
      source: 'Source',
      importCsv: 'Import CSV',
      csvInputHint: 'Paste the contents of items_template.csv here.',
      importReport: (accepted, rejected) => `${accepted} row(s) imported; ${rejected} rejected.`,
      rejectedRow: (row, reason) => `Row ${row}: ${reason}`,
      importReasons: {
        invalidCsv: 'Invalid CSV.',
        missingRequiredValue: 'A required value or header is missing.',
        invalidShelfLife: 'shelf_life_days must be a whole number above zero or blank.',
        invalidPreparedFood: 'prepared_food must be sim or não.',
        invalidStatus: 'status must be unverified or verified.',
        invalidTemperatureClass: 'Invalid temperature class.',
        missingTemperatureClass: 'Choose the storage temperature class.',
        invalidManufacturerDays: 'Days after opening must be a whole number above zero or blank.',
        invalidPlantBasedType: 'plant_based_type must be none, drink, or food.',
        invalidHeatTreated: 'heat_treated must be sim or não.',
      },
      temperatureClass: 'Temperature class',
      refrigerated: 'Refrigerated',
      frozen: 'Frozen',
      ambient: 'Ambient',
      temperatureRequired: 'Choose a temperature class before adding.',
      notVerifiedBlock: 'This item has not been verified. Strict mode blocks printing.',
      testModeBanner: 'TEST MODE — unverified item',
      testPrintWarning: 'This item is unverified. The label will be logged in test mode. Print it?',
      confirmPrint: 'Confirm print',
      ambientPlantBlock: 'Ambient storage is blocked by VEG-COLD — RDC 218/2005, item 4.3.11.',
      missingManufacturerDays: 'Enter the manufacturer’s days after opening before printing.',
      ruleLimited: (days, law, item) => days === null ? `Limited by ${law}, item ${item}.` : `Limited to ${days} day(s) by ${law}, item ${item}.`,
      ruleSource: 'Source and item',
      enforced: 'Enforced',
      informational: 'Informational',
      enforcedIn: 'Enforced in',
      rulesVersion: 'Rules version',
      reviewedBy: 'Reviewed by',
      recordReview: 'Record review',
      federalOnly: 'Federal rules only',
      exportStart: 'Start date (YYYY-MM-DD)',
      exportEnd: 'End date (YYYY-MM-DD)',
      exportCsv: 'Export CSV',
      exportJson: 'Export JSON',
      exportComplete: 'Audit file shared.',
      invalidDateRange: 'Enter a valid date range.',
      cappedByRule: 'Limiting rule',
      printerProfile: 'Printer profile',
      appVersion: 'App version',
      events: 'Events',
      recordId: 'Label ID',
      phase1: 'Phase 1',
      phase2: 'Phase 2',
      phase3: 'Phase 3',
      storageRule: 'storage rule',
      englishInformalNotice: 'English text is an informal translation; refer to the Portuguese legal text.',
    },
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

const COMPACT_STORAGE_NAMES: Record<Language, Record<string, string>> = {
  en: {
    Refrigerated: 'Chilled',
    Frozen: 'Frozen',
  },
  'pt-BR': {
    Refrigerated: 'Refrig.',
    Frozen: 'Congelado',
  },
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

export function getCompactStorageLabel(storage: string, language: Language): string {
  return COMPACT_STORAGE_NAMES[language][storage] ?? getStorageLabel(storage, language);
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
