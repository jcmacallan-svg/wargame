const state = {
  injects: [],
  filtered: [],
  selected: [],
  released: [],
  turn: 1,
  stage: 1,
  scenario: null,
};

const filters = {
  level: document.getElementById('levelFilter'),
  conflict: document.getElementById('conflictFilter'),
  domain: document.getElementById('domainFilter'),
  phase: document.getElementById('phaseFilter'),
  severity: document.getElementById('severityFilter'),
};

function uniq(values) { return [...new Set(values)].sort(); }
function tag(text, cls = '') { const span = document.createElement('span'); span.className = `tag ${cls}`.trim(); span.textContent = text; return span; }
function severityClass(sev) { return `sev-${String(sev).toLowerCase()}`; }

function populateFilter(select, values) {
  [...values].forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function ensureFilterValue(select, value) {
  const exists = [...select.options].some(option => option.value === value);
  if (!exists) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }
  select.value = value;
}

function applyFilters() {
  const values = {
    level: filters.level.value,
    conflict_mode: filters.conflict.value,
    domain: filters.domain.value,
    phase: filters.phase.value,
    severity: filters.severity.value,
  };

  state.filtered = state.injects.filter(inj =>
    (values.level === 'all' || inj.level === values.level) &&
    (values.conflict_mode === 'all' || inj.conflict_mode === values.conflict_mode) &&
    (values.domain === 'all' || inj.domain === values.domain) &&
    (values.phase === 'all' || inj.phase === values.phase) &&
    (values.severity === 'all' || inj.severity === values.severity)
  );

  document.getElementById('injectCount').textContent = `${state.filtered.length} inject(s)`;
  renderInjects();
}

function makeCard(inj) {
  const template = document.getElementById('cardTemplate').content.cloneNode(true);
  const tagRow = template.querySelector('.tag-row');
  [inj.id, inj.level, inj.conflict_mode, inj.domain].forEach(item => tagRow.appendChild(tag(item)));
  tagRow.appendChild(tag(inj.severity, severityClass(inj.severity)));
  template.querySelector('.title').textContent = inj.title;
  template.querySelector('.phase').textContent = inj.phase;
  template.querySelector('.situation').textContent = inj.situation;
  template.querySelector('.decision').textContent = inj.decision_required;
  template.querySelector('.white').textContent = inj.white_cell_notes;
  template.querySelector('.select-btn').onclick = () => selectInject(inj.id);
  template.querySelector('.release-btn').onclick = () => releaseInject(inj.id);
  return template;
}

function renderInjects() {
  const grid = document.getElementById('injectGrid');
  grid.innerHTML = '';
  state.filtered.forEach(inj => grid.appendChild(makeCard(inj)));
}

function selectInject(id) {
  const inj = state.injects.find(item => item.id === id);
  if (!inj || state.selected.some(item => item.id === id)) return;
  state.selected.push(inj);
  renderSelected();
}

function releaseInject(id) {
  const inj = state.injects.find(item => item.id === id);
  if (!inj) return;
  state.released.push({ turn: state.turn, inject: inj });
  logEntry(`Released inject ${inj.id} - ${inj.title}`);
  document.getElementById('releasedCount').textContent = state.released.length;
}

function renderSelected() {
  const target = document.getElementById('selectedCards');
  target.innerHTML = '';
  if (!state.selected.length) {
    target.innerHTML = '<div class="selected-card">No selected cards yet.</div>';
    return;
  }
  state.selected.forEach(inj => {
    const wrapper = document.createElement('div');
    wrapper.className = 'selected-card';
    [inj.id, inj.level, inj.conflict_mode, inj.domain].forEach(v => wrapper.appendChild(tag(v)));
    wrapper.appendChild(tag(inj.severity, severityClass(inj.severity)));
    wrapper.innerHTML += `<h3 class="title">${inj.title}</h3><div class="phase">${inj.phase}</div>`;
    wrapper.innerHTML += `<div class="label">Situation</div><p>${inj.situation}</p>`;
    wrapper.innerHTML += `<div class="label">Decision required</div><p>${inj.decision_required}</p>`;
    wrapper.innerHTML += `<div class="label">White cell notes</div><p>${inj.white_cell_notes}</p>`;
    target.appendChild(wrapper);
  });
}

function logEntry(text) {
  const log = document.getElementById('actionLog');
  const div = document.createElement('div');
  div.className = 'log-entry';
  const stamp = new Date().toLocaleTimeString();
  div.innerHTML = `<small>Turn ${state.turn} · ${stamp}</small><div>${text}</div>`;
  log.prepend(div);
}

function updateTurn(delta) {
  const maxTurns = Number(document.getElementById('scenarioTurns').value || 8);
  state.turn = Math.max(1, Math.min(maxTurns, state.turn + delta));
  state.stage = Math.min(4, Math.max(1, Math.ceil(state.turn / Math.max(1, Math.ceil(maxTurns / 4)))));
  document.getElementById('currentTurn').textContent = state.turn;
  document.getElementById('currentStage').textContent = state.stage;
  logEntry(`Moved to turn ${state.turn}, escalation stage ${state.stage}.`);
}

function scenarioFromForm() {
  const level = filters.level.value === 'all' ? 'operational' : filters.level.value;
  const conflict = filters.conflict.value === 'all' ? 'hybrid' : filters.conflict.value;
  const chosenDomain = filters.domain.value === 'all' ? null : filters.domain.value;
  const domains = chosenDomain ? [chosenDomain] : ['land','air','maritime','cyber','space','information','logistics'].slice(0, 4);
  return {
    name: document.getElementById('scenarioName').value.trim() || 'Untitled Scenario',
    overview: document.getElementById('scenarioOverview').value.trim(),
    level,
    conflict_mode: conflict,
    geography: document.getElementById('scenarioGeography').value.trim(),
    domains,
    turns: Number(document.getElementById('scenarioTurns').value || 8),
    objectives: ['command_and_control', 'multi_domain_coordination', 'crisis_management', 'decision_making'],
    starting_phase: state.stage,
    red_commander_profile: document.getElementById('redProfile').value,
    initial_blue_situation: document.getElementById('initialBlueSituation').value.trim(),
    seed_events: state.selected.slice(0, 3).map(inj => inj.title),
    facilitator_notes: 'Use selected injects as the opening pack, then force follow-on decisions under time pressure.'
  };
}

function applyScenarioToForm(scenario, shouldLog = true) {
  state.scenario = scenario;
  document.getElementById('scenarioName').value = scenario.name || '';
  document.getElementById('scenarioOverview').value = scenario.overview || '';
  document.getElementById('scenarioGeography').value = scenario.geography || '';
  document.getElementById('scenarioTurns').value = scenario.turns || 8;
  document.getElementById('initialBlueSituation').value = scenario.initial_blue_situation || '';
  document.getElementById('redProfile').value = scenario.red_commander_profile || 'grey_zone_opportunist';
  ensureFilterValue(filters.level, scenario.level || 'operational');
  ensureFilterValue(filters.conflict, scenario.conflict_mode || 'hybrid');
  if (scenario.domains && scenario.domains.length === 1) ensureFilterValue(filters.domain, scenario.domains[0]);
  else filters.domain.value = 'all';
  state.turn = 1;
  state.stage = scenario.starting_phase || 1;
  document.getElementById('currentTurn').textContent = state.turn;
  document.getElementById('currentStage').textContent = state.stage;
  renderScenarioSummary();
  applyFilters();
  if (shouldLog) logEntry(`Scenario loaded: ${scenario.name}`);
}

function renderScenarioSummary() {
  const scenario = state.scenario || scenarioFromForm();
  const meta = document.getElementById('scenarioMeta');
  const summary = document.getElementById('scenarioSummary');
  meta.innerHTML = '';
  [scenario.level, scenario.conflict_mode, ...(scenario.domains || []), scenario.red_commander_profile].forEach(item => meta.appendChild(tag(item)));
  const seeds = (scenario.seed_events || []).map(item => `<li>${item}</li>`).join('');
  const objectives = (scenario.objectives || []).map(item => `<li>${item}</li>`).join('');
  summary.innerHTML = `
    <p><strong>Geography:</strong> ${scenario.geography || 'not set'}</p>
    <p>${scenario.overview || ''}</p>
    <p><strong>Initial Blue situation:</strong> ${scenario.initial_blue_situation || ''}</p>
    <p><strong>Facilitator notes:</strong> ${scenario.facilitator_notes || 'No facilitator notes yet.'}</p>
    <div class="label">Objectives</div>
    <ul>${objectives}</ul>
    <div class="label">Seed events</div>
    <ul>${seeds || '<li>No seed events yet.</li>'}</ul>`;
}

function downloadScenario() {
  const scenario = scenarioFromForm();
  state.scenario = scenario;
  renderScenarioSummary();
  const blob = new Blob([JSON.stringify(scenario, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'scenario.json';
  a.click();
  URL.revokeObjectURL(url);
}

function randomFrom(list) { return list[Math.floor(Math.random() * list.length)]; }

function generateScenario() {
  const levels = ['strategic','operational','tactical'];
  const conflicts = ['hybrid','peer','coin','grey_zone'];
  const geographies = [
    'Fictional northern littoral region',
    'Mountain border zone with major transit routes',
    'Urban coastal capital and offshore energy corridor',
    'Desert theatre with exposed logistics hubs'
  ];
  const overviews = {
    hybrid: 'A layered coercion campaign blends cyber disruption, disinformation, and irregular pressure below the threshold of open war.',
    peer: 'A near-peer confrontation is contesting access, information advantage, and operational tempo across multiple domains.',
    coin: 'An entrenched armed network is exploiting population grievances, fragmented governance, and selective violence.',
    grey_zone: 'Ambiguous actors are using deniable maritime, cyber, and information activity to reshape the security environment.'
  };
  const starters = {
    strategic: 'National leaders and coalition headquarters are under pressure to attribute events, maintain cohesion, and set escalation boundaries.',
    operational: 'Joint force planners must protect tempo, sustainment, and domain integration while the threat picture remains incomplete.',
    tactical: 'Forward units are operating under time pressure, local ambiguity, and communications friction near the point of contact.'
  };
  const domainBundles = [
    ['maritime','cyber','information','logistics'],
    ['land','air','cyber','space'],
    ['land','information','logistics'],
    ['air','maritime','space','cyber']
  ];
  const level = filters.level.value === 'all' ? randomFrom(levels) : filters.level.value;
  const conflict = filters.conflict.value === 'all' ? randomFrom(conflicts) : filters.conflict.value;
  const domains = filters.domain.value === 'all' ? randomFrom(domainBundles) : [filters.domain.value];
  const scenario = {
    name: `${randomFrom(['Northern','Eastern','Coastal','Frontier'])} ${randomFrom(['Corridor','Shield','Horizon','Sentinel'])} Crisis`,
    overview: overviews[conflict],
    level,
    conflict_mode: conflict,
    geography: randomFrom(geographies),
    domains,
    turns: Number(document.getElementById('scenarioTurns').value || 8),
    objectives: ['command_and_control', 'multi_domain_coordination', 'crisis_management', 'decision_making'],
    starting_phase: 1,
    red_commander_profile: document.getElementById('redProfile').value,
    initial_blue_situation: starters[level],
    seed_events: [
      `Early warning shows anomalies in the ${domains[0]} domain.`,
      `Media narratives are increasing pressure on Blue decision-makers.`,
      `Facilitators should force a trade-off between attribution and tempo.`
    ],
    facilitator_notes: 'Open with ambiguity, then release one cross-domain inject by turn 2 and a second-order consequence by turn 3.'
  };
  applyScenarioToForm(scenario);
}

function keywordDomainMap() {
  return [
    { domain: 'maritime', words: ['ship','ships','naval','sea','fleet','port','harbor','harbour','territorial waters','ais','vessel','coast guard','chokepoint'] },
    { domain: 'air', words: ['air','aircraft','fighter','sortie','awacs','drone','uav','patrols','patrol','adiz'] },
    { domain: 'cyber', words: ['cyber','network','malware','server','phishing','intrusion','ransomware','system','platform'] },
    { domain: 'space', words: ['space','satellite','orbital','gps','isr','telemetry'] },
    { domain: 'information', words: ['media','narrative','press','deepfake','influence','social','propaganda','messaging'] },
    { domain: 'land', words: ['land','brigade','battalion','border','checkpoint','convoy','patrol base','troops'] },
    { domain: 'logistics', words: ['logistics','fuel','ammo','sustainment','supply','warehouse','transport'] }
  ];
}

function inferDomain(text) {
  const lower = String(text || '').toLowerCase();
  for (const entry of keywordDomainMap()) {
    if (entry.words.some(word => lower.includes(word))) return entry.domain;
  }
  if (state.scenario && state.scenario.domains && state.scenario.domains.length) return state.scenario.domains[0];
  return filters.domain.value !== 'all' ? filters.domain.value : 'information';
}

function chooseMatchingInject({ level, conflict, domain, stage }) {
  const preferred = state.injects.filter(inj =>
    inj.level === level && inj.conflict_mode === conflict && inj.domain === domain && Number(inj.stage) >= stage
  );
  const fallbacks = [
    () => state.injects.filter(inj => inj.level === level && inj.conflict_mode === conflict && inj.domain === domain),
    () => state.injects.filter(inj => inj.conflict_mode === conflict && inj.domain === domain),
    () => state.injects.filter(inj => inj.domain === domain),
    () => state.injects
  ];
  const pool = preferred.length ? preferred : (fallbacks.map(fn => fn()).find(items => items.length) || []);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function synthesiseRedResponse(profile, domain, blueAction) {
  const responseMap = {
    grey_zone_opportunist: {
      maritime: 'Red uses deniable commercial traffic disruption, spoofed vessel signatures, and ambiguous signaling to slow coalition freedom of movement.',
      cyber: 'Red intensifies low-visibility malware activity to create uncertainty without crossing declared conflict thresholds.',
      information: 'Red amplifies divisive narratives and manipulated media through proxy channels to erode confidence in Blue decision-makers.',
      default: 'Red chooses deniable pressure designed to delay decision-making and strain alliance cohesion.'
    },
    peer_competitor: {
      air: 'Red layers EW and air-defense pressure to contest access while avoiding a predictable escalation pattern.',
      space: 'Red interferes with ISR and timing dependencies to widen uncertainty before committing mass.',
      logistics: 'Red targets sustainment rhythm and mobility bottlenecks to break campaign tempo.',
      maritime: 'Red contests maritime access with coordinated ISR denial, distributed maritime pressure, and legal ambiguity.',
      default: 'Red shapes the battlespace by combining ISR denial, long-range pressure, and logistics disruption.'
    },
    insurgent_network: {
      land: 'Red-linked cells blend into civilian patterns and seek an overreaction at local checkpoints or during route security operations.',
      information: 'Red circulates grievance narratives to undermine legitimacy and complicate security operations.',
      default: 'Red pursues local legitimacy erosion, deniable harassment, and selective violence.'
    }
  };
  const map = responseMap[profile] || responseMap.grey_zone_opportunist;
  const core = map[domain] || map.default;
  return {
    id: `RED-SYN-${Date.now().toString().slice(-6)}`,
    title: `Red Countermove in ${domain}`,
    text: `${core}

Observed Blue action: ${blueAction || 'No action entered.'}
Recommended facilitator move: force a follow-up decision under time pressure on the next turn.`
  };
}

function generateRedResponse() {
  const blueAction = document.getElementById('blueAction').value.trim();
  const domain = inferDomain(blueAction);
  const level = filters.level.value === 'all' ? (state.scenario?.level || 'operational') : filters.level.value;
  const conflict = filters.conflict.value === 'all' ? (state.scenario?.conflict_mode || 'hybrid') : filters.conflict.value;
  const profile = document.getElementById('redProfile').value;

  const matched = chooseMatchingInject({ level, conflict, domain, stage: state.stage });
  const synth = synthesiseRedResponse(profile, domain, blueAction);
  const output = document.getElementById('redOutput');
  const blocks = [
    `Profile: ${profile}`,
    `Inferred domain: ${domain}`,
    `Turn ${state.turn} · Stage ${state.stage}`
  ];
  if (matched) {
    blocks.push(`
Recommended library inject
${matched.id} · ${matched.title}
${matched.situation}
Decision required: ${matched.decision_required}`);
    selectInject(matched.id);
  } else {
    blocks.push('
No matching library inject found.');
  }
  blocks.push(`
Synthesised Red response
${synth.title}
${synth.text}`);
  output.textContent = blocks.join('
');

  if (blueAction) logEntry(`Blue action entered: ${blueAction}`);
  logEntry(`Red Commander generated a response in the ${domain} domain.`);
}

async function uploadScenarioFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const scenario = JSON.parse(text);
    applyScenarioToForm(scenario);
  } catch (error) {
    alert('Could not load scenario JSON. Check that the file matches schema/scenario.schema.json.');
    console.error(error);
  } finally {
    event.target.value = '';
  }
}

async function init() {
  const response = await fetch('./data/injects.json');
  state.injects = await response.json();
  populateFilter(filters.level, uniq(state.injects.map(i => i.level)));
  populateFilter(filters.conflict, uniq(state.injects.map(i => i.conflict_mode)));
  populateFilter(filters.domain, uniq(state.injects.map(i => i.domain)));
  populateFilter(filters.phase, uniq(state.injects.map(i => i.phase)));
  populateFilter(filters.severity, uniq(state.injects.map(i => i.severity)));
  Object.values(filters).forEach(select => select.addEventListener('change', () => {
    applyFilters();
    state.scenario = scenarioFromForm();
    renderScenarioSummary();
  }));
  document.getElementById('prevTurn').onclick = () => updateTurn(-1);
  document.getElementById('nextTurn').onclick = () => updateTurn(1);
  document.getElementById('generateRed').onclick = generateRedResponse;
  document.getElementById('downloadScenario').onclick = downloadScenario;
  document.getElementById('generateScenario').onclick = generateScenario;
  document.getElementById('uploadScenario').addEventListener('change', uploadScenarioFile);
  document.getElementById('printView').onclick = () => window.print();
  ['scenarioName','scenarioGeography','scenarioOverview','initialBlueSituation','scenarioTurns','redProfile'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      state.scenario = scenarioFromForm();
      renderScenarioSummary();
    });
  });
  applyFilters();
  renderSelected();
  applyScenarioToForm(await (await fetch('./scenarios/sample_scenario.json')).json(), false);
  logEntry('OWGE loaded. Start by generating or uploading a scenario, then enter a Blue action.');
}

init();
