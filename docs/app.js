const state = {
  injects: [],
  filtered: [],
  selected: [],
  released: [],
  turn: 1,
  stage: 1,
};

const filters = {
  level: document.getElementById('levelFilter'),
  conflict: document.getElementById('conflictFilter'),
  domain: document.getElementById('domainFilter'),
  phase: document.getElementById('phaseFilter'),
  severity: document.getElementById('severityFilter'),
};

function uniq(values) {
  return [...new Set(values)].sort();
}

function tag(text, cls = '') {
  const span = document.createElement('span');
  span.className = `tag ${cls}`.trim();
  span.textContent = text;
  return span;
}

function severityClass(sev) {
  return `sev-${sev.toLowerCase()}`;
}

function populateFilter(select, values) {
  values.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
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
  const card = template.querySelector('.card');
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
    wrapper.appendChild(tag(inj.id));
    wrapper.appendChild(tag(inj.level));
    wrapper.appendChild(tag(inj.conflict_mode));
    wrapper.appendChild(tag(inj.domain));
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

function buildScenarioObject() {
  return {
    name: document.getElementById('scenarioName').value,
    level: filters.level.value === 'all' ? 'operational' : filters.level.value,
    conflict_mode: filters.conflict.value === 'all' ? 'hybrid' : filters.conflict.value,
    domains: filters.domain.value === 'all' ? uniq(state.injects.map(i => i.domain)).slice(0, 3) : [filters.domain.value],
    turns: Number(document.getElementById('scenarioTurns').value || 8),
    objectives: ['command_and_control', 'multi_domain_coordination', 'crisis_management', 'decision_making'],
    starting_phase: state.stage,
    red_commander_profile: document.getElementById('redProfile').value,
  };
}

function downloadScenario() {
  const blob = new Blob([JSON.stringify(buildScenarioObject(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'scenario.json';
  a.click();
  URL.revokeObjectURL(url);
}

function chooseMatchingInject({ level, conflict, domain, stage }) {
  const matches = state.injects.filter(inj =>
    inj.level === level && inj.conflict_mode === conflict && inj.domain === domain && inj.stage >= stage
  );
  return matches[0] || state.injects.find(inj => inj.level === level && inj.conflict_mode === conflict) || null;
}

function synthesiseRedResponse(profile, domain, blueAction) {
  const responseMap = {
    grey_zone_opportunist: {
      maritime: 'Red uses deniable commercial traffic disruption and ambiguous signaling to slow coalition movement.',
      cyber: 'Red intensifies low-visibility malware activity to create uncertainty without crossing open conflict thresholds.',
      information: 'Red amplifies divisive narratives and pushes manipulated media through proxy channels.',
      default: 'Red chooses deniable pressure designed to delay decision-making and strain alliance cohesion.'
    },
    peer_competitor: {
      air: 'Red layers EW and air-defense pressure to contest access while avoiding predictable escalation.',
      space: 'Red interferes with ISR and timing dependencies to widen uncertainty before committing mass.',
      logistics: 'Red targets sustainment rhythm and mobility bottlenecks to break campaign tempo.',
      default: 'Red shapes the battlespace by combining ISR denial, long-range pressure, and logistics disruption.'
    },
    insurgent_network: {
      land: 'Red-linked cells blend into civilian patterns and seek an overreaction at local checkpoints.',
      information: 'Red circulates grievance narratives to undermine legitimacy and complicate security operations.',
      default: 'Red pursues local legitimacy erosion, deniable harassment, and selective violence.'
    }
  };
  const map = responseMap[profile] || responseMap.grey_zone_opportunist;
  const core = map[domain] || map.default;
  return {
    id: `RED-SYN-${Date.now().toString().slice(-6)}`,
    title: `Red Countermove in ${domain}`,
    text: `${core}\n\nObserved Blue action: ${blueAction || 'No action entered.'}\nRecommended facilitator note: force a follow-up decision under time pressure on the next turn.`
  };
}

function inferDomain(text) {
  const lower = text.toLowerCase();
  const candidates = ['maritime','cyber','air','space','information','land','logistics'];
  return candidates.find(c => lower.includes(c)) || (filters.domain.value !== 'all' ? filters.domain.value : 'information');
}

function generateRedResponse() {
  const blueAction = document.getElementById('blueAction').value.trim();
  const domain = inferDomain(blueAction);
  const level = filters.level.value === 'all' ? 'operational' : filters.level.value;
  const conflict = filters.conflict.value === 'all' ? 'hybrid' : filters.conflict.value;
  const profile = document.getElementById('redProfile').value;

  const matched = chooseMatchingInject({ level, conflict, domain, stage: state.stage });
  const synth = synthesiseRedResponse(profile, domain, blueAction);

  const output = document.getElementById('redOutput');
  const blocks = [];
  blocks.push(`Profile: ${profile}`);
  blocks.push(`Inferred domain: ${domain}`);
  blocks.push(`Turn ${state.turn} · Stage ${state.stage}`);
  if (matched) {
    blocks.push(`\nRecommended library inject\n${matched.id} · ${matched.title}\n${matched.situation}\nDecision required: ${matched.decision_required}`);
    selectInject(matched.id);
  }
  blocks.push(`\nSynthesised Red response\n${synth.title}\n${synth.text}`);
  output.textContent = blocks.join('\n');

  if (blueAction) {
    logEntry(`Blue action entered: ${blueAction}`);
  }
  logEntry(`Red Commander generated a response in the ${domain} domain.`);
}

async function init() {
  const response = await fetch('./data/injects.json');
  state.injects = await response.json();
  populateFilter(filters.level, uniq(state.injects.map(i => i.level)));
  populateFilter(filters.conflict, uniq(state.injects.map(i => i.conflict_mode)));
  populateFilter(filters.domain, uniq(state.injects.map(i => i.domain)));
  populateFilter(filters.phase, uniq(state.injects.map(i => i.phase)));
  populateFilter(filters.severity, uniq(state.injects.map(i => i.severity)));
  Object.values(filters).forEach(select => select.addEventListener('change', applyFilters));
  document.getElementById('prevTurn').onclick = () => updateTurn(-1);
  document.getElementById('nextTurn').onclick = () => updateTurn(1);
  document.getElementById('generateRed').onclick = generateRedResponse;
  document.getElementById('downloadScenario').onclick = downloadScenario;
  document.getElementById('printView').onclick = () => window.print();
  applyFilters();
  renderSelected();
}

init();
