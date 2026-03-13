
let currentLanguage = 'en';
let injectLibrary = [];
let filteredInjects = [];
let selectedInjectId = null;
let currentScenario = null;
let releasedInjects = [];
let actionLog = [];

const scenarioTemplates = [
  {
    name: 'Northern Corridor Crisis',
    overview: 'A fictional regional crisis is unfolding around a contested maritime corridor where spoofing, cyber disruption, and coordinated narratives are increasing pressure below the threshold of open war.',
    level: 'operational',
    conflict_mode: 'grey_zone',
    domains: ['maritime','cyber','information','logistics'],
    initial_blue_situation: 'Blue naval and coast guard forces are increasing patrols in territorial waters while national authorities assess attribution for spoofing, cyber disruption, and malign media activity.',
    turns: 8,
    red_commander_profile: 'grey_zone_opportunist'
  },
  {
    name: 'Forward Shield Air-Sea Standoff',
    overview: 'A peer competitor is probing air and maritime defenses through electronic attack, ambiguous military signaling, and pressure on alliance cohesion.',
    level: 'strategic',
    conflict_mode: 'peer',
    domains: ['air','maritime','space','information','logistics'],
    initial_blue_situation: 'Blue coalition leaders are considering force posture adjustments while frontline commanders report radar irregularities, media pressure, and maritime congestion.',
    turns: 10,
    red_commander_profile: 'peer_competitor'
  },
  {
    name: 'Interior Stability Campaign',
    overview: 'A counterinsurgency campaign faces mounting legitimacy pressure, supply friction, and information manipulation around local population centers.',
    level: 'tactical',
    conflict_mode: 'coin',
    domains: ['land','information','logistics','cyber'],
    initial_blue_situation: 'Blue forces support local authorities while managing patrol security, civilian contact, and contested online narratives.',
    turns: 6,
    red_commander_profile: 'insurgent_network'
  }
];

const doctrineProfiles = {
  grey_zone_opportunist: {
    displayKey: 'profile_grey_zone_opportunist',
    objective: {
      en: 'Delay Blue decisions, create ambiguity, and remain below open-war thresholds.',
      nl: 'Vertraag Blauwe besluitvorming, creëer ambiguïteit en blijf onder de drempel van open oorlog.'
    },
    emphasis: ['maritime','information','cyber','logistics']
  },
  peer_competitor: {
    displayKey: 'profile_peer_competitor',
    objective: {
      en: 'Shape the battlespace by degrading awareness, logistics, and coalition timing.',
      nl: 'Vorm het gevechtsveld door awareness, logistiek en coalitietiming te verstoren.'
    },
    emphasis: ['air','space','cyber','maritime','logistics']
  },
  insurgent_network: {
    displayKey: 'profile_insurgent_network',
    objective: {
      en: 'Erode legitimacy, provoke overreaction, and stress local command relationships.',
      nl: 'Ondergraven legitimiteit, lok overreactie uit en zet lokale commandorelaties onder druk.'
    },
    emphasis: ['land','information','logistics','cyber']
  },
  regional_coercer: {
    displayKey: 'profile_regional_coercer',
    objective: {
      en: 'Apply coercive regional pressure through military signaling, disruption, and brinkmanship.',
      nl: 'Oefen regionale dwang uit met militaire signalering, verstoring en brinkmanship.'
    },
    emphasis: ['maritime','air','land','information']
  }
};

const el = (id) => document.getElementById(id);

function t(key) {
  const dict = currentLanguage === 'nl' ? window.i18n_nl : window.i18n_en;
  return dict?.[key] || key;
}

function profileLabel(profileKey) {
  return t(doctrineProfiles[profileKey]?.displayKey || profileKey);
}

async function init() {
  attachEvents();
  applyTranslations();
  await loadInjects();
  populateFilters();
  renderInjects();
  loadSampleScenario();
}

function attachEvents() {
  el('languageSelect').addEventListener('change', (e) => {
    currentLanguage = e.target.value;
    localStorage.setItem('owge_lang', currentLanguage);
    applyTranslations();
    renderInjects();
    renderReleased();
    renderActionLog();
    renderScenarioOverview();
    refreshRedOutputHeader();
  });

  const savedLang = localStorage.getItem('owge_lang');
  if (savedLang) {
    currentLanguage = savedLang;
    el('languageSelect').value = savedLang;
  }

  el('filterLevel').addEventListener('change', renderInjects);
  el('filterConflict').addEventListener('change', renderInjects);
  el('filterDomain').addEventListener('change', renderInjects);

  el('createScenarioBtn').addEventListener('click', buildScenarioFromForm);
  el('randomScenarioBtn').addEventListener('click', generateRandomScenario);
  el('downloadScenarioBtn').addEventListener('click', downloadScenario);
  el('uploadScenarioFile').addEventListener('change', uploadScenario);

  el('generateRedBtn').addEventListener('click', handleGenerateRedResponse);
  el('nextTurnBtn').addEventListener('click', nextTurn);
  el('releaseSelectedBtn').addEventListener('click', releaseSelectedInject);
  el('printCardsBtn').addEventListener('click', () => window.print());
}

async function loadInjects() {
  const resp = await fetch('./data/injects.json');
  injectLibrary = await resp.json();
}

function populateFilters() {
  const fill = (selectId, values, translator = (v) => v) => {
    const select = el(selectId);
    select.innerHTML = '';
    const optAll = document.createElement('option');
    optAll.value = '';
    optAll.textContent = t('all');
    select.appendChild(optAll);
    values.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = translator(v);
      select.appendChild(opt);
    });
  };
  fill('filterLevel', ['strategic','operational','tactical'], v => t(v));
  fill('filterConflict', ['hybrid','peer','grey_zone','coin'], v => t(v));
  fill('filterDomain', ['land','air','maritime','cyber','space','information','logistics'], v => t(v));
}

function applyTranslations() {
  document.documentElement.lang = currentLanguage;
  el('appTitle').textContent = t('app_title');
  el('tagline').textContent = t('tagline');
  el('languageLabel').textContent = t('language');
  el('controlPanelTitle').textContent = t('control_panel');
  el('scenarioEditorTitle').textContent = t('scenario_editor');
  el('scenarioNameLabel').textContent = t('scenario_name');
  el('scenarioLevelLabel').textContent = t('level');
  el('scenarioConflictLabel').textContent = t('conflict_mode');
  el('scenarioDomainsLabel').textContent = t('domains');
  el('scenarioOverviewLabel').textContent = t('overview');
  el('scenarioBlueLabel').textContent = t('blue_situation');
  el('scenarioTurnsLabel').textContent = t('turns');
  el('scenarioRedProfileLabel').textContent = t('red_profile');
  el('createScenarioBtn').textContent = t('create_scenario');
  el('randomScenarioBtn').textContent = t('random_scenario');
  el('downloadScenarioBtn').textContent = t('download_scenario');
  el('uploadScenarioLabel').textContent = t('upload_scenario');
  el('scenarioOverviewTitle').textContent = t('scenario_overview');
  el('currentTurnLabel').textContent = `${t('current_turn')}:`;
  el('escalationStageLabel').textContent = `${t('escalation_stage')}:`;
  el('releasedInjectsLabel').textContent = `${t('released_injects')}:`;
  el('blueActionLabel').textContent = t('blue_action');
  el('generateRedBtn').textContent = t('generate_red');
  el('nextTurnBtn').textContent = t('next_turn');
  el('releaseSelectedBtn').textContent = t('release_selected');
  el('printCardsBtn').textContent = t('print_cards');
  el('injectBrowserTitle').textContent = t('inject_browser');
  el('selectedInjectsTitle').textContent = t('selected_injects');
  el('redOutputTitle').textContent = t('red_output');
  el('actionLogTitle').textContent = t('action_log');
  document.querySelectorAll('[data-domain]').forEach(node => node.textContent = t(node.dataset.domain));
  updateRedProfileOptions();
  populateFilters();
}

function updateRedProfileOptions() {
  ['grey_zone_opportunist','peer_competitor','insurgent_network','regional_coercer'].forEach(value => {
    const opt = el('scenarioRedProfile').querySelector(`option[value="${value}"]`);
    if (opt) opt.textContent = profileLabel(value);
  });
}

function severityClass(sev) {
  return `sev-${sev}`;
}

function renderInjects() {
  const level = el('filterLevel').value;
  const conflict = el('filterConflict').value;
  const domain = el('filterDomain').value;

  filteredInjects = injectLibrary.filter(inj =>
    (!level || inj.level === level) &&
    (!conflict || inj.conflict_mode === conflict) &&
    (!domain || inj.domain === domain)
  );

  const list = el('injectList');
  list.innerHTML = '';
  filteredInjects.forEach(inj => list.appendChild(injectCard(inj)));
}

function injectCard(inj, released = false) {
  const card = document.createElement('div');
  card.className = 'inject-card' + (selectedInjectId === inj.id ? ' selected' : '');
  const releaseButton = released ? '' : `<button data-action="select">${t('selected')}</button>`;
  const secondaryButton = released ? `<button data-action="print">${t('print')}</button>` : `<button data-action="release">${t('released')}</button>`;
  card.innerHTML = `
    <div class="inject-head">
      <div>
        <div class="inject-id">${inj.id}</div>
        <strong>${inj.title}</strong>
      </div>
      <span class="tag ${severityClass(inj.severity)}">${t('severity')}: ${inj.severity}</span>
    </div>
    <div class="tags">
      <span class="tag">${t(inj.level)}</span>
      <span class="tag">${t(inj.conflict_mode)}</span>
      <span class="tag">${t(inj.domain)}</span>
      <span class="tag">${t('phase')}: ${inj.phase}</span>
    </div>
    <div class="inject-meta">${inj.situation}</div>
    <div><strong>${t('decision_required')}:</strong> ${inj.decision_required}</div>
    <div class="inject-meta"><strong>${t('notes')}:</strong> ${inj.white_cell_notes}</div>
    <div class="inject-actions">
      ${releaseButton}
      ${secondaryButton}
    </div>
  `;
  const buttons = card.querySelectorAll('button');
  buttons.forEach(btn => btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    if (action === 'select') {
      selectInject(inj.id);
    } else if (action === 'release') {
      releaseInject(inj.id);
    } else if (action === 'print') {
      window.print();
    }
  }));
  return card;
}

function selectInject(id) {
  selectedInjectId = id;
  renderInjects();
}

function releaseInject(id) {
  const inj = injectLibrary.find(i => i.id === id);
  if (!inj) return;
  if (!releasedInjects.some(i => i.id === inj.id)) {
    releasedInjects.push(inj);
    logAction(`${inj.id} released to facilitator deck.`);
    el('releasedInjectsValue').textContent = String(releasedInjects.length);
    renderReleased();
  }
  selectedInjectId = inj.id;
  renderInjects();
}

function releaseSelectedInject() {
  if (!selectedInjectId) return;
  releaseInject(selectedInjectId);
}

function renderReleased() {
  const container = el('releasedList');
  container.innerHTML = '';
  releasedInjects.forEach(inj => container.appendChild(injectCard(inj, true)));
}

function buildScenarioFromForm() {
  const domains = Array.from(document.querySelectorAll('#domainCheckboxes input:checked')).map(x => x.value);
  currentScenario = {
    name: el('scenarioName').value || 'Unnamed Scenario',
    level: el('scenarioLevel').value,
    conflict_mode: el('scenarioConflict').value,
    domains: domains.length ? domains : ['maritime'],
    overview: el('scenarioOverviewInput').value || '',
    initial_blue_situation: el('scenarioBlue').value || '',
    turns: Number(el('scenarioTurns').value) || 8,
    turn: 1,
    escalation_stage: 1,
    red_commander_profile: el('scenarioRedProfile').value,
    objectives: ['command_and_control','multi_domain_coordination','crisis_management','decision_making'],
    seed_events: []
  };
  syncScenarioToForm();
  renderScenarioOverview();
  logAction(`Scenario created: ${currentScenario.name}`);
}

function generateRandomScenario() {
  const pick = scenarioTemplates[Math.floor(Math.random() * scenarioTemplates.length)];
  currentScenario = {
    ...pick,
    domains: [...pick.domains],
    turn: 1,
    escalation_stage: 1,
    objectives: ['command_and_control','multi_domain_coordination','crisis_management','decision_making'],
    seed_events: []
  };
  syncScenarioToForm();
  renderScenarioOverview();
  logAction(`Random scenario generated: ${currentScenario.name}`);
}

function loadSampleScenario() {
  currentScenario = {
    name: 'Northern Corridor Crisis',
    level: 'operational',
    conflict_mode: 'grey_zone',
    domains: ['maritime','cyber','information','logistics'],
    overview: 'A fictional regional crisis is unfolding around a contested maritime corridor where spoofing, cyber disruption, and coordinated narratives are increasing pressure below the threshold of open war.',
    initial_blue_situation: 'Blue naval and coast guard forces are increasing patrols in territorial waters while national authorities assess attribution for spoofing, cyber disruption, and malign media activity.',
    turns: 8,
    turn: 1,
    escalation_stage: 1,
    red_commander_profile: 'grey_zone_opportunist',
    objectives: ['command_and_control','multi_domain_coordination','crisis_management','decision_making'],
    seed_events: ['AIS anomalies reported near a chokepoint.','A logistics platform shows intermittent latency.','Manipulated social media clips question Blue rules of engagement.']
  };
  syncScenarioToForm();
  renderScenarioOverview();
}

function syncScenarioToForm() {
  if (!currentScenario) return;
  el('scenarioName').value = currentScenario.name || '';
  el('scenarioLevel').value = currentScenario.level || 'operational';
  el('scenarioConflict').value = currentScenario.conflict_mode || 'grey_zone';
  el('scenarioOverviewInput').value = currentScenario.overview || '';
  el('scenarioBlue').value = currentScenario.initial_blue_situation || '';
  el('scenarioTurns').value = currentScenario.turns || 8;
  el('scenarioRedProfile').value = currentScenario.red_commander_profile || 'grey_zone_opportunist';
  document.querySelectorAll('#domainCheckboxes input').forEach(box => {
    box.checked = (currentScenario.domains || []).includes(box.value);
  });
  el('currentTurnValue').textContent = currentScenario.turn || 1;
  el('escalationStageValue').textContent = currentScenario.escalation_stage || 1;
}

function renderScenarioOverview() {
  const panel = el('scenarioOverviewPanel');
  if (!currentScenario) {
    panel.textContent = 'No scenario loaded.';
    return;
  }
  const doctrine = doctrineProfiles[currentScenario.red_commander_profile];
  const doctrineText = doctrine ? doctrine.objective[currentLanguage] : currentScenario.red_commander_profile;
  panel.textContent =
`${currentScenario.name}

${t('level')}: ${t(currentScenario.level)}
${t('conflict_mode')}: ${t(currentScenario.conflict_mode)}
${t('domains')}: ${currentScenario.domains.map(d => t(d)).join(', ')}
${t('red_profile')}: ${profileLabel(currentScenario.red_commander_profile)}

${t('overview')}:
${currentScenario.overview}

${t('blue_situation')}:
${currentScenario.initial_blue_situation}

Red intent:
${doctrineText}`;
  el('currentTurnValue').textContent = currentScenario.turn || 1;
  el('escalationStageValue').textContent = currentScenario.escalation_stage || 1;
  el('releasedInjectsValue').textContent = String(releasedInjects.length);
}

function downloadScenario() {
  if (!currentScenario) return;
  const blob = new Blob([JSON.stringify(currentScenario, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${slugify(currentScenario.name)}.json`;
  a.click();
}

function uploadScenario(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      currentScenario = JSON.parse(reader.result);
      if (!currentScenario.turn) currentScenario.turn = 1;
      if (!currentScenario.escalation_stage) currentScenario.escalation_stage = 1;
      syncScenarioToForm();
      renderScenarioOverview();
      logAction(`Scenario loaded: ${currentScenario.name}`);
    } catch (err) {
      alert(`Scenario JSON error: ${err.message}`);
    }
  };
  reader.readAsText(file);
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function nextTurn() {
  if (!currentScenario) return;
  currentScenario.turn += 1;
  const stage = Math.min(4, Math.floor((currentScenario.turn - 1) / 3) + 1);
  currentScenario.escalation_stage = stage;
  renderScenarioOverview();
  logAction(`Turn advanced to ${currentScenario.turn}. Escalation stage ${currentScenario.escalation_stage}.`);
}

function detectDomain(text) {
  const t = (text || '').toLowerCase();
  const patterns = [
    ['maritime', /(ship|ships|fleet|naval|sea|port|harbor|harbour|coast|maritime|vessel|territorial waters|patrol boat|ais)/],
    ['air', /(air|aircraft|fighter|drone|sortie|radar|awacs|adiz|runway|helicopter|jet)/],
    ['cyber', /(cyber|network|server|malware|credential|latency|intrusion|system|phishing|ransomware|software)/],
    ['space', /(satellite|gps|space|orbit|telemetry|ground station|positioning)/],
    ['information', /(media|narrative|deepfake|social|propaganda|messaging|journalist|online|information)/],
    ['logistics', /(fuel|supply|supplies|logistics|warehouse|convoy|maintenance|medical|shipment)/],
    ['land', /(ground|border|patrol|checkpoint|brigade|battalion|artillery|infantry|vehicle|route)/]
  ];
  for (const [domain, pattern] of patterns) {
    if (pattern.test(t)) return domain;
  }
  return currentScenario?.domains?.[0] || 'maritime';
}

function chooseInjectForRed(domain) {
  if (!currentScenario) return null;
  const doctrine = doctrineProfiles[currentScenario.red_commander_profile];
  const emphasis = doctrine?.emphasis || [];
  const candidates = injectLibrary.filter(inj =>
    inj.level === currentScenario.level &&
    inj.conflict_mode === currentScenario.conflict_mode &&
    inj.escalation_stage <= currentScenario.escalation_stage + 1 &&
    (inj.domain === domain || emphasis.includes(inj.domain))
  );
  if (!candidates.length) return null;
  // prioritize exact domain, then doctrine fit
  candidates.sort((a,b) => {
    const score = (inj) => (inj.domain === domain ? 3 : 0) + (emphasis.includes(inj.domain) ? 2 : 0) + (inj.red_profile_fit === currentScenario.red_commander_profile ? 1 : 0);
    return score(b) - score(a);
  });
  return candidates[0];
}

function synthesizeResponse(blueAction, domain) {
  const doctrine = doctrineProfiles[currentScenario.red_commander_profile];
  const titleMap = {
    maritime: { en: 'Maritime pressure response', nl: 'Maritieme drukreactie' },
    air: { en: 'Air contest response', nl: 'Luchtrespons' },
    cyber: { en: 'Cyber disruption response', nl: 'Cyberverstoringsreactie' },
    space: { en: 'Space support degradation', nl: 'Ruimtesteunverstoring' },
    information: { en: 'Narrative manipulation response', nl: 'Narratiefmanipulatierespons' },
    logistics: { en: 'Logistics friction response', nl: 'Logistieke frictierespons' },
    land: { en: 'Ground pressure response', nl: 'Grondrespons' }
  };
  const text = {
    en: `Red assesses the Blue action "${blueAction}" as an opportunity to increase friction in the ${domain} domain while supporting ${doctrine.objective.en.toLowerCase()}`,
    nl: `Red beoordeelt de blauwe actie "${blueAction}" als een kans om frictie te vergroten in het domein ${t(domain)} en daarmee ${doctrine.objective.nl.toLowerCase()}`
  };
  return {
    title: titleMap[domain]?.[currentLanguage] || (currentLanguage === 'nl' ? 'Rode reactie' : 'Red response'),
    text: text[currentLanguage]
  };
}

function handleGenerateRedResponse() {
  if (!currentScenario) {
    alert(t('create_or_load'));
    return;
  }
  const blueAction = el('blueActionInput').value.trim();
  if (!blueAction) return;
  const domain = detectDomain(blueAction);
  const matched = chooseInjectForRed(domain);
  const synth = synthesizeResponse(blueAction, domain);

  const blocks = [];
  if (matched) {
    blocks.push(`${t('recommended_inject')}
${matched.id} · ${matched.title}
${matched.situation}
${t('decision_required')}: ${matched.decision_required}`);
    selectInject(matched.id);
  } else {
    blocks.push(t('no_inject_found'));
  }

  blocks.push(`${t('red_response')}
${synth.title}
${synth.text}`);

  el('redOutput').textContent = blocks.join('\n\n');
  logAction(`Blue action captured: ${blueAction}\nRecommended red domain: ${domain}${matched ? `\nMatched inject: ${matched.id}` : ''}`);
}

function refreshRedOutputHeader() {
  const text = el('redOutput').textContent;
  if (!text) return;
  // leave generated output as-is to avoid awkward mixed-language regeneration
}

function logAction(text) {
  actionLog.unshift({ time: new Date().toLocaleTimeString(), text });
  actionLog = actionLog.slice(0, 25);
  renderActionLog();
}

function renderActionLog() {
  const container = el('actionLog');
  container.innerHTML = '';
  actionLog.forEach(item => {
    const node = document.createElement('div');
    node.className = 'log-item';
    node.textContent = `[${item.time}] ${item.text}`;
    container.appendChild(node);
  });
}

window.addEventListener('DOMContentLoaded', init);
