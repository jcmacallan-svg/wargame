const STORAGE_KEY = 'owge_v16_state';

const DEFAULT_TEMPLATE = {
  scenario: {
    name: 'Northern Corridor Crisis',
    overview: 'Blue must protect territorial waters, keep the corridor open, and prevent coercive maritime disruption while operating under time pressure.',
    turn: 1,
    timeLabel: 'H+0',
    movementPressure: 0,
    timePressure: 0,
    assetPressure: 0,
    shippingConfidence: 6,
    zoneControlScore: 0,
    objectiveScore: 0,
    failureState: '',
    currentSituation: 'Commercial confidence is weakening as irregular maritime interference rises near the corridor and port approaches.',
    overlayMode: 'openseamap',
    redDoctrine: 'ambiguity_first',
    informationPolicy: 'role_based',
    zonePlacementMode: 'manual',
    objectives: [
      { id: 'secure_corridor', name: 'Keep the corridor open', type: 'tag_control', target: 'corridor', weight: 2 },
      { id: 'protect_port', name: 'Protect port throughput', type: 'tag_control', target: 'port', weight: 2 },
      { id: 'retain_confidence', name: 'Retain commercial confidence', type: 'shipping_confidence', target: 'shipping_confidence', weight: 1 }
    ]
  },
  zones: {
    main_port: { name: 'Main Port', center: [54.50, 7.10], radius: 12000, kind: 'port', tags: ['port'], movementModifier: 1, controlWeight: 2, visibilityProfile: 'all', allowAssetPresence: true, notes: '', isCore: true },
    north_approach: { name: 'North Approach', center: [55.03, 7.55], radius: 18000, kind: 'sea', tags: ['approach'], movementModifier: 0, controlWeight: 1, visibilityProfile: 'all', allowAssetPresence: true, notes: '', isCore: true },
    corridor: { name: 'Transit Corridor', center: [54.86, 7.80], radius: 22000, kind: 'bottleneck', tags: ['corridor', 'chokepoint'], movementModifier: 1, controlWeight: 3, visibilityProfile: 'all', allowAssetPresence: true, notes: '', isCore: true },
    territorial_waters: { name: 'Territorial Waters', center: [54.70, 7.43], radius: 16000, kind: 'sea', tags: ['territorial'], movementModifier: 0, controlWeight: 2, visibilityProfile: 'all', allowAssetPresence: true, notes: '', isCore: true },
    info_space: { name: 'Information Space', center: [54.95, 8.15], radius: 8000, kind: 'info', tags: ['information'], movementModifier: 0, controlWeight: 1, visibilityProfile: 'restricted', allowAssetPresence: true, notes: '', isCore: false },
    offmap: { name: 'Off-map', center: [55.12, 8.40], radius: 10000, kind: 'support', tags: ['support'], movementModifier: 0, controlWeight: 1, visibilityProfile: 'restricted', allowAssetPresence: true, notes: '', isCore: false }
  }
};

const MOVEMENT_COSTS = {
  main_port: { main_port: 0, north_approach: 2, corridor: 3, territorial_waters: 2, offmap: 4, outer_harbor: 1, escort_lane: 2 },
  north_approach: { main_port: 2, north_approach: 0, corridor: 2, territorial_waters: 3, offmap: 3, outer_harbor: 2, escort_lane: 2 },
  corridor: { main_port: 3, north_approach: 2, corridor: 0, territorial_waters: 2, offmap: 2, outer_harbor: 2, escort_lane: 1 },
  territorial_waters: { main_port: 2, north_approach: 3, corridor: 2, territorial_waters: 0, offmap: 3, outer_harbor: 2, escort_lane: 2 },
  offmap: { main_port: 4, north_approach: 3, corridor: 2, territorial_waters: 3, offmap: 0, outer_harbor: 3, escort_lane: 2 },
  outer_harbor: { main_port: 1, north_approach: 2, corridor: 2, territorial_waters: 2, offmap: 3, outer_harbor: 0, escort_lane: 2 },
  escort_lane: { main_port: 2, north_approach: 2, corridor: 1, territorial_waters: 2, offmap: 2, outer_harbor: 2, escort_lane: 0 }
};

const DEFAULT_STATE = {
  version: 16,
  scenario: clone(DEFAULT_TEMPLATE.scenario),
  zones: clone(DEFAULT_TEMPLATE.zones),
  selectedZoneId: 'corridor',
  session: { cells: [
    { id: 'blue-maritime', name: 'Blue Maritime', domain: 'maritime' },
    { id: 'blue-port', name: 'Blue Port Authority', domain: 'logistics' },
    { id: 'blue-info', name: 'Blue Information Cell', domain: 'information' }
  ] },
  assets: [
    { id: 'PV-ALPHA', name: 'Patrol Vessel Alpha', type: 'patrol_vessel', status: 'available', zone: 'main_port', fuel: 7, readiness: 5, assignedCell: 'blue-maritime', visibleTo: ['blue-maritime'] },
    { id: 'PV-BRAVO', name: 'Patrol Vessel Bravo', type: 'patrol_vessel', status: 'available', zone: 'territorial_waters', fuel: 7, readiness: 5, assignedCell: 'blue-maritime', visibleTo: ['blue-maritime'] },
    { id: 'BT-1', name: 'Boarding Team 1', type: 'boarding_team', status: 'available', zone: 'main_port', fuel: 5, readiness: 5, assignedCell: 'blue-maritime', visibleTo: ['blue-maritime'] },
    { id: 'ISR-1', name: 'ISR Support Window', type: 'isr', status: 'available', zone: 'offmap', fuel: 4, readiness: 4, assignedCell: 'blue-maritime', visibleTo: ['blue-maritime', 'blue-info'] },
    { id: 'PORT-CELL', name: 'Port Coordination Cell', type: 'port_cell', status: 'available', zone: 'main_port', fuel: 5, readiness: 5, assignedCell: 'blue-port', visibleTo: ['blue-port', 'blue-maritime'] }
  ],
  incidents: [
    { id: 'INC-1', title: 'AIS anomalies', zone: 'corridor', severity: 'Low', visibleTo: ['blue-maritime', 'blue-info'] },
    { id: 'INC-2', title: 'Commercial concern', zone: 'main_port', severity: 'Low', visibleTo: ['blue-port', 'blue-maritime'] }
  ],
  releasedInjects: [],
  selectedActions: {},
  playerFeedByCell: { 'blue-maritime': [], 'blue-port': [], 'blue-info': [] },
  actionLogByCell: { 'blue-maritime': [], 'blue-port': [], 'blue-info': [] },
  timeline: [],
  turnPreview: emptyTurnPreview()
};

let state = loadState();
let injectLibrary = [];
let templates = {};
let map, playerMap, seaLayer, playerSeaLayer;
let zoneLayers = [], incidentLayers = [], assetLayers = [], redLayers = [], zoneCenterLayers = [], playerZoneLayers = [], playerIncidentLayers = [], playerAssetLayers = [];

function clone(o) { return JSON.parse(JSON.stringify(o)); }
function emptyTurnPreview() { return { assetPreview: [], coverage: {}, redPresence: [], releasedInjects: [], objectiveScore: 0, zoneControlScore: 0, shippingConfidence: 0, movementPressure: 0, assetPressure: 0, timePressure: 0, failureState: '', summaryDraft: '' }; }
function slugify(s) { return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function severityValue(s) { return ({ Low: 1, Medium: 2, High: 3, Strategic: 4 })[s] || 1; }
function incidentColor(sev) { return sev === 'High' || sev === 'Strategic' ? '#ef4444' : sev === 'Medium' ? '#f59e0b' : '#facc15'; }
function statusClass(v) { return v >= 5 ? 'status-bad' : v >= 2 ? 'status-warn' : 'status-good'; }
function prettyZone(z) { return (state.zones[z] && state.zones[z].name) || z; }
function zoneKindDomains(kind) { return ({ sea: ['maritime'], bottleneck: ['maritime'], harbor: ['maritime', 'logistics'], port: ['logistics', 'maritime'], info: ['information', 'cyber'], support: ['logistics', 'maritime'] })[kind] || ['maritime']; }
function normalizeZone(zone = {}) {
  return {
    name: zone.name || 'New Zone',
    center: zone.center || [54.8, 7.5],
    radius: Number(zone.radius || 12000),
    kind: zone.kind || 'sea',
    tags: Array.isArray(zone.tags) ? zone.tags : String(zone.tags || '').split(',').map(s => s.trim()).filter(Boolean),
    movementModifier: Number(zone.movementModifier || 0),
    controlWeight: Number(zone.controlWeight || 1),
    visibilityProfile: zone.visibilityProfile || 'all',
    allowAssetPresence: zone.allowAssetPresence !== false,
    notes: zone.notes || '',
    isCore: !!zone.isCore
  };
}
function normalizeAsset(asset) {
  const visibleTo = Array.isArray(asset.visibleTo) && asset.visibleTo.length ? asset.visibleTo : [asset.assignedCell].filter(Boolean);
  return { ...asset, visibleTo };
}
function migratePackage(pkg = {}) {
  const merged = Object.assign(clone(DEFAULT_STATE), pkg);
  merged.version = 16;
  merged.scenario = Object.assign(clone(DEFAULT_STATE.scenario), merged.scenario || {});
  merged.scenario.informationPolicy = merged.scenario.informationPolicy || 'role_based';
  merged.scenario.zonePlacementMode = 'manual';
  merged.scenario.objectives = Array.isArray(merged.scenario.objectives) && merged.scenario.objectives.length ? merged.scenario.objectives : clone(DEFAULT_STATE.scenario.objectives);
  const zones = {};
  Object.entries(merged.zones || {}).forEach(([id, zone]) => { zones[id] = normalizeZone(zone); });
  merged.zones = zones;
  merged.assets = (merged.assets || []).map(normalizeAsset);
  merged.incidents = (merged.incidents || []).map(inc => ({ ...inc, visibleTo: Array.isArray(inc.visibleTo) && inc.visibleTo.length ? inc.visibleTo : visibleCellsForDomain(inc.domain, inc.zone) }));
  merged.turnPreview = merged.turnPreview || emptyTurnPreview();
  return merged;
}
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return migratePackage(clone(DEFAULT_STATE));
  try { return migratePackage(JSON.parse(raw)); } catch (e) { return migratePackage(clone(DEFAULT_STATE)); }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function ensureSessionMaps() {
  state.session.cells.forEach(c => {
    if (!state.playerFeedByCell[c.id]) state.playerFeedByCell[c.id] = [];
    if (!state.actionLogByCell[c.id]) state.actionLogByCell[c.id] = [];
  });
}
function getPlayerCell() {
  const params = new URLSearchParams(window.location.search);
  return params.get('cell') || (document.getElementById('playerCellSelect') ? document.getElementById('playerCellSelect').value : (state.session.cells[0] && state.session.cells[0].id));
}
function zoneStyle(kind) {
  if (kind === 'port' || kind === 'harbor') return { color: '#fde68a', fillColor: '#fde68a', fillOpacity: 0.1 };
  if (kind === 'info') return { color: '#c084fc', fillColor: '#c084fc', fillOpacity: 0.08 };
  if (kind === 'support') return { color: '#64748b', fillColor: '#64748b', fillOpacity: 0.05 };
  if (kind === 'bottleneck') return { color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.08 };
  return { color: '#38bdf8', fillColor: '#38bdf8', fillOpacity: 0.05 };
}
function movementCost(fromZoneId, toZoneId, assisted) {
  const base = ((MOVEMENT_COSTS[fromZoneId] || {})[toZoneId] ?? 3);
  const zoneModifier = Number((state.zones[toZoneId] || {}).movementModifier || 0);
  let cost = Math.max(0, base + zoneModifier);
  if (assisted) cost = Math.max(0, cost - 1);
  return cost;
}
function zoneHasTag(zone, tag) { return (zone.tags || []).includes(tag); }
function visibleCellsForDomain(domain, zoneId) {
  const zone = state.zones[zoneId] || {};
  return state.session.cells.filter(cell => {
    if (domain && cell.domain === domain) return true;
    if (zone.visibilityProfile === 'facilitator_only') return false;
    if (zone.visibilityProfile === 'restricted') return zoneKindDomains(zone.kind).includes(cell.domain);
    return ['maritime', 'logistics', 'information', 'cyber'].includes(cell.domain);
  }).map(cell => cell.id);
}
function isZoneVisibleToCell(zoneId, cellId) {
  const zone = state.zones[zoneId];
  const cell = state.session.cells.find(c => c.id === cellId);
  if (!zone || !cell) return false;
  if (zone.visibilityProfile === 'facilitator_only') return false;
  if (zone.visibilityProfile === 'all') return true;
  if (zone.visibilityProfile === 'restricted') return zoneKindDomains(zone.kind).includes(cell.domain);
  return true;
}
function isAssetVisibleToCell(asset, cellId) {
  if (Array.isArray(asset.visibleTo) && asset.visibleTo.includes('all')) return true;
  if (Array.isArray(asset.visibleTo) && asset.visibleTo.includes(cellId)) return true;
  return false;
}
function isIncidentVisibleToCell(item, cellId) {
  if (Array.isArray(item.visibleTo) && item.visibleTo.includes('all')) return true;
  if (Array.isArray(item.visibleTo) && item.visibleTo.includes(cellId)) return true;
  return false;
}
function zoneOffsetLatLng(zoneId, index) {
  const center = (state.zones[zoneId] || state.zones[state.selectedZoneId] || Object.values(state.zones)[0]).center;
  return [center[0] + (index % 3) * 0.03 - 0.03, center[1] + (index % 4) * 0.04 - 0.04];
}
function nearestZone(lat, lon) {
  let best = Object.keys(state.zones)[0];
  let score = Infinity;
  Object.entries(state.zones).forEach(([key, z]) => {
    const s = Math.pow(lat - z.center[0], 2) + Math.pow(lon - z.center[1], 2);
    if (s < score) { score = s; best = key; }
  });
  return best;
}

async function init() {
  const [injResp, tplResp] = await Promise.all([fetch('./data/injects.json'), fetch('./data/templates.json')]);
  injectLibrary = await injResp.json();
  templates = await tplResp.json();
  ensureSessionMaps();
  bindEvents();
  renderAll();
  initMaps(true);
}

function bindEvents() {
  if (document.getElementById('map')) {
    document.getElementById('resetBtn').onclick = () => { state = migratePackage(clone(DEFAULT_STATE)); saveState(); renderAll(); initMaps(true); };
    document.getElementById('generatePressureBtn').onclick = generatePressure;
    document.getElementById('nextTurnBtn').onclick = nextTurn;
    document.getElementById('overlaySelect').onchange = e => { state.scenario.overlayMode = e.target.value; saveState(); initMaps(true); };
    document.getElementById('saveZonePropsBtn').onclick = saveSelectedZoneProps;
    document.getElementById('deleteZoneBtn').onclick = deleteSelectedZone;
    document.getElementById('resetZonesBtn').onclick = () => { state.zones = clone(DEFAULT_TEMPLATE.zones); state.selectedZoneId = 'corridor'; saveState(); renderAll(); initMaps(true); };
    document.getElementById('addCellBtn').onclick = () => addCellRow();
    document.getElementById('saveCellsBtn').onclick = saveCells;
    document.getElementById('templateSelect').onchange = applyTemplate;
    document.getElementById('savePackageBtn').onclick = saveExercisePackage;
    document.getElementById('loadPackageInput').onchange = loadExercisePackage;
  }
  if (document.getElementById('playerCellSelect')) {
    document.getElementById('playerCellSelect').onchange = () => { renderPlayerPage(); initMaps(true); };
    document.getElementById('playerSubmitBtn').onclick = submitPlayerAction;
  }
}

function buildPackage() {
  return clone({
    version: 16,
    scenario: state.scenario,
    zones: state.zones,
    selectedZoneId: state.selectedZoneId,
    session: state.session,
    assets: state.assets,
    incidents: state.incidents,
    releasedInjects: state.releasedInjects,
    selectedActions: state.selectedActions,
    playerFeedByCell: state.playerFeedByCell,
    actionLogByCell: state.actionLogByCell,
    timeline: state.timeline,
    turnPreview: state.turnPreview
  });
}
function saveExercisePackage() {
  const blob = new Blob([JSON.stringify(buildPackage(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'owge_exercise_package_v16.json';
  a.click();
}
function loadExercisePackage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function () {
    try {
      state = migratePackage(JSON.parse(reader.result));
      ensureSessionMaps();
      saveState();
      renderAll();
      initMaps(true);
    } catch (err) {
      alert('Invalid exercise package.');
    }
  };
  reader.readAsText(file);
}
function applyTemplate() {
  const key = document.getElementById('templateSelect').value;
  if (!templates[key]) return;
  state.scenario = Object.assign(clone(DEFAULT_STATE.scenario), clone(templates[key].scenario || {}), { zonePlacementMode: 'manual', informationPolicy: 'role_based' });
  const incomingZones = templates[key].zones || {};
  state.zones = {};
  Object.entries(incomingZones).forEach(([id, zone]) => state.zones[id] = normalizeZone(zone));
  state.selectedZoneId = Object.keys(state.zones)[0];
  state.incidents = [{ id: 'INC-1', title: 'Initial pressure', zone: state.selectedZoneId, severity: 'Low', visibleTo: visibleCellsForDomain('maritime', state.selectedZoneId) }];
  state.turnPreview = emptyTurnPreview();
  saveState();
  renderAll();
  initMaps(true);
}
function setAssetAction(assetId, zone, mode) { state.selectedActions[assetId] = { zone, mode }; saveState(); renderAssets(); }
function addCellRow(cell) {
  const container = document.getElementById('cellsEditor');
  if (!container) return;
  const c = cell || { id: '', name: '', domain: 'maritime' };
  const row = document.createElement('div');
  row.className = 'card cell-row';
  row.innerHTML = `<div class="grid2"><div><label>Name</label><input class="cell-name" value="${c.name || ''}"></div><div><label>Domain</label><select class="cell-domain">${['maritime', 'logistics', 'information', 'cyber', 'air', 'land', 'space'].map(d => `<option value="${d}" ${c.domain === d ? 'selected' : ''}>${d}</option>`).join('')}</select></div></div><button class="secondary remove-cell-btn">Remove</button>`;
  container.appendChild(row);
  row.querySelector('.remove-cell-btn').onclick = () => row.remove();
}
function saveCells() {
  const rows = Array.from(document.querySelectorAll('.cell-row'));
  state.session.cells = rows.map((row, idx) => {
    const name = row.querySelector('.cell-name').value.trim() || `Blue Cell ${idx + 1}`;
    return { id: slugify(name) || `blue-cell-${idx + 1}`, name, domain: row.querySelector('.cell-domain').value };
  });
  state.assets = state.assets.map(asset => normalizeAsset(asset));
  state.playerFeedByCell = {};
  state.actionLogByCell = {};
  ensureSessionMaps();
  saveState();
  renderAll();
}
function selectZone(zoneId) { state.selectedZoneId = zoneId; saveState(); renderZoneEditor(); initMaps(true); }
function saveSelectedZoneProps() {
  const id = state.selectedZoneId;
  if (!id || !state.zones[id]) return;
  const newId = slugify(document.getElementById('zoneId').value.trim()) || id;
  const updated = normalizeZone({
    ...state.zones[id],
    name: document.getElementById('zoneName').value.trim() || state.zones[id].name,
    radius: Number(document.getElementById('zoneRadius').value || state.zones[id].radius),
    kind: document.getElementById('zoneKind').value,
    tags: document.getElementById('zoneTags').value,
    movementModifier: Number(document.getElementById('zoneMovementModifier').value || 0),
    controlWeight: Number(document.getElementById('zoneControlWeight').value || 1),
    visibilityProfile: document.getElementById('zoneVisibilityProfile').value,
    allowAssetPresence: document.getElementById('zoneAllowAssetPresence').checked,
    notes: document.getElementById('zoneNotes').value.trim(),
    isCore: document.getElementById('zoneIsCore').checked
  });
  if (newId !== id && !state.zones[newId]) {
    delete state.zones[id];
    state.zones[newId] = updated;
    state.selectedZoneId = newId;
    state.assets.forEach(asset => { if (asset.zone === id) asset.zone = newId; });
    state.incidents.forEach(inc => { if (inc.zone === id) inc.zone = newId; });
  } else {
    state.zones[id] = updated;
  }
  saveState();
  renderAll();
  initMaps(true);
}
function deleteSelectedZone() {
  const id = state.selectedZoneId;
  const zone = state.zones[id];
  if (!id || !zone) return;
  if (zone.isCore) return alert('This zone is marked as core and cannot be deleted until core is cleared.');
  if (Object.keys(state.zones).length <= 1) return alert('At least one zone must remain.');
  const fallback = Object.keys(state.zones).find(z => z !== id);
  delete state.zones[id];
  state.selectedZoneId = fallback;
  state.assets.forEach(asset => { if (asset.zone === id) asset.zone = fallback; });
  state.incidents = state.incidents.filter(inc => inc.zone !== id);
  saveState();
  renderAll();
  initMaps(true);
}
function createZoneAt(latlng) {
  let id = slugify(`zone-${Object.keys(state.zones).length + 1}`);
  while (state.zones[id]) id = slugify(`${id}-x`);
  state.zones[id] = normalizeZone({ name: 'New Zone', center: [latlng.lat, latlng.lng], radius: 12000, kind: 'sea', visibilityProfile: 'all' });
  state.selectedZoneId = id;
  saveState();
  renderAll();
  initMaps(true);
}
function submitPlayerAction() {
  const cellId = getPlayerCell();
  const input = document.getElementById('playerAction');
  const text = input.value.trim();
  if (!text) return;
  const entry = { time: state.scenario.timeLabel, text };
  state.actionLogByCell[cellId].push(entry);
  input.value = '';
  saveState();
  renderPlayerPage();
}

function computeAssetResolution() {
  const isrAssist = state.assets.some(x => x.type === 'isr' && x.status !== 'delayed' && x.fuel > 0 && x.readiness > 0);
  const assets = state.assets.map(asset => {
    const action = state.selectedActions[asset.id] || { zone: asset.zone, mode: 'hold' };
    const zone = state.zones[action.zone] || state.zones[asset.zone];
    const result = clone(asset);
    if (action.mode === 'delay') {
      result.status = 'delayed';
      result.readiness = Math.max(0, result.readiness - 1);
      return result;
    }
    if (zone && zone.allowAssetPresence === false) {
      result.status = 'held';
      return result;
    }
    const moveCost = movementCost(asset.zone, action.zone, isrAssist && asset.type !== 'isr');
    if (action.zone !== asset.zone && action.mode === 'commit') {
      result.zone = action.zone;
      result.fuel = Math.max(0, result.fuel - moveCost);
      result.readiness = Math.max(0, result.readiness - 1);
      result.status = 'committed';
    } else {
      result.status = action.mode === 'hold' ? 'holding' : 'available';
      result.readiness = Math.max(0, result.readiness - (action.mode === 'hold' ? 0 : 1));
    }
    return normalizeAsset(result);
  });
  const assetPressure = assets.reduce((sum, asset) => sum + (asset.fuel <= 1 ? 2 : 0) + (asset.readiness <= 1 ? 2 : 0) + (asset.status === 'delayed' ? 1 : 0), 0);
  return { assets, assetPressure };
}
function zoneCoverage(assetList = state.assets) {
  const coverage = {};
  Object.entries(state.zones).forEach(([zoneId, zone]) => {
    const ownAssets = assetList.filter(asset => asset.zone === zoneId && asset.status !== 'delayed');
    coverage[zoneId] = {
      ownCount: ownAssets.length,
      maritimeCount: ownAssets.filter(a => ['patrol_vessel', 'boarding_team', 'isr'].includes(a.type)).length,
      logisticsCount: ownAssets.filter(a => ['port_cell'].includes(a.type)).length,
      score: ownAssets.reduce((sum, a) => sum + (a.readiness > 0 ? 1 : 0), 0)
    };
  });
  return coverage;
}
function buildRedPresence(coverage) {
  return Object.entries(state.zones).map(([zoneId, zone]) => {
    const gap = Math.max(0, Number(zone.controlWeight || 1) - (coverage[zoneId]?.score || 0));
    return { zone: zoneId, intensity: Math.min(3, gap + (zone.kind === 'bottleneck' ? 1 : 0)) };
  }).filter(item => item.intensity > 0);
}
function doctrineTrigger(coverage) {
  const corridorWeak = Object.entries(state.zones).some(([id, zone]) => zoneHasTag(zone, 'corridor') && (coverage[id]?.score || 0) < 2);
  const portWeak = Object.entries(state.zones).some(([id, zone]) => zoneHasTag(zone, 'port') && (coverage[id]?.score || 0) < 1);
  if (corridorWeak && portWeak) return 'confidence_collapse';
  if (corridorWeak) return 'corridor_pressure';
  if (portWeak) return 'port_pressure';
  return 'weak_posture';
}
function computeObjectiveScores(coverage, redPresence) {
  const weightedControl = Object.entries(state.zones).reduce((sum, [zoneId, zone]) => {
    const control = Math.max(0, (coverage[zoneId]?.score || 0) - (redPresence.find(r => r.zone === zoneId)?.intensity || 0));
    return sum + control * Number(zone.controlWeight || 1);
  }, 0);
  const movementPressure = redPresence.reduce((sum, r) => sum + (state.zones[r.zone]?.kind === 'bottleneck' ? r.intensity : 0), 0);
  const timePressure = Math.max(0, state.scenario.turn - 1);
  let shippingConfidence = Math.max(0, 8 - movementPressure - Math.round(timePressure / 2));
  let objectiveScore = 0;
  (state.scenario.objectives || []).forEach(obj => {
    const weight = Number(obj.weight || 1);
    if (obj.type === 'shipping_confidence') {
      if (shippingConfidence >= 4) objectiveScore += weight;
      return;
    }
    const targetZones = Object.entries(state.zones).filter(([, zone]) => zoneHasTag(zone, obj.target) || zone.kind === obj.target || obj.target === zone.kind || obj.target === zone.name || obj.target === obj.id).map(([id]) => id);
    const satisfied = targetZones.some(zoneId => (coverage[zoneId]?.score || 0) >= (state.zones[zoneId]?.controlWeight || 1));
    if (satisfied) objectiveScore += weight;
  });
  if (movementPressure >= 5) shippingConfidence = Math.max(0, shippingConfidence - 1);
  const failureState = shippingConfidence <= 1 ? 'Commercial confidence collapse risk' : movementPressure >= 6 ? 'Movement space collapsing' : '';
  return { zoneControlScore: weightedControl, objectiveScore, shippingConfidence, movementPressure, timePressure, failureState };
}
function buildTurnPreview() {
  const resolution = computeAssetResolution();
  const coverage = zoneCoverage(resolution.assets);
  const redPresence = buildRedPresence(coverage);
  const trigger = doctrineTrigger(coverage);
  const releasedInjects = injectLibrary.filter(inj => ['weak_posture', trigger, 'corridor_pressure', 'port_pressure', 'confidence_collapse'].includes(inj.trigger)).slice(0, 3).map(inj => ({ ...inj, visibleTo: visibleCellsForDomain(inj.domain, inj.zone) }));
  const score = computeObjectiveScores(coverage, redPresence);
  return {
    assetPreview: resolution.assets,
    coverage,
    redPresence,
    releasedInjects,
    objectiveScore: score.objectiveScore,
    zoneControlScore: score.zoneControlScore,
    shippingConfidence: score.shippingConfidence,
    movementPressure: score.movementPressure,
    assetPressure: resolution.assetPressure,
    timePressure: score.timePressure,
    failureState: score.failureState,
    summaryDraft: `Corridor pressure ${score.movementPressure}, objective score ${score.objectiveScore}, shipping confidence ${score.shippingConfidence}.`
  };
}
function generatePressure() {
  state.turnPreview = buildTurnPreview();
  state.releasedInjects = clone(state.turnPreview.releasedInjects);
  saveState();
  renderAll();
  initMaps(true);
}
function nextTurn() {
  if (!state.turnPreview || !state.turnPreview.assetPreview.length) state.turnPreview = buildTurnPreview();
  state.assets = clone(state.turnPreview.assetPreview).map(normalizeAsset);
  state.scenario.zoneControlScore = state.turnPreview.zoneControlScore;
  state.scenario.objectiveScore = state.turnPreview.objectiveScore;
  state.scenario.shippingConfidence = state.turnPreview.shippingConfidence;
  state.scenario.movementPressure = state.turnPreview.movementPressure;
  state.scenario.assetPressure = state.turnPreview.assetPressure;
  state.scenario.timePressure = state.turnPreview.timePressure;
  state.scenario.failureState = state.turnPreview.failureState;
  state.scenario.currentSituation = state.turnPreview.summaryDraft;
  state.incidents.push(...clone(state.turnPreview.releasedInjects));
  state.turnPreview.releasedInjects.forEach(item => {
    (item.visibleTo || []).forEach(cellId => {
      state.playerFeedByCell[cellId].push({ time: state.scenario.timeLabel, zone: item.zone, text: `${item.title}: ${item.situation}`, visibleTo: item.visibleTo });
    });
  });
  state.timeline.unshift({ turn: state.scenario.turn, time: state.scenario.timeLabel, text: state.turnPreview.summaryDraft });
  state.scenario.turn += 1;
  state.scenario.timeLabel = `H+${(state.scenario.turn - 1) * 2}`;
  state.selectedActions = {};
  state.releasedInjects = [];
  state.turnPreview = emptyTurnPreview();
  saveState();
  renderAll();
  initMaps(true);
}

function renderScenario() {
  const el = document.getElementById('scenarioPanel');
  if (!el) return;
  const previewNote = state.turnPreview?.assetPreview?.length ? `<div class="card"><strong>Preview ready</strong><div class="small">Resolve Turn commits the current pressure preview and routes updates only to relevant cells.</div></div>` : '';
  el.innerHTML = `<div><strong>${state.scenario.name}</strong></div><div class="small">${state.scenario.overview}</div><div class="row" style="margin-top:10px"><span class="tag">Turn ${state.scenario.turn}</span><span class="tag">${state.scenario.timeLabel}</span><span class="tag ${statusClass(state.scenario.movementPressure)}">Movement ${state.scenario.movementPressure}</span><span class="tag ${statusClass(state.scenario.assetPressure)}">Assets ${state.scenario.assetPressure}</span><span class="tag ${statusClass(Math.max(0,6-state.scenario.shippingConfidence))}">Shipping ${state.scenario.shippingConfidence}</span><span class="tag">Zone Control ${state.scenario.zoneControlScore}</span><span class="tag">Objectives ${state.scenario.objectiveScore}</span></div><p><strong>Current situation</strong><br>${state.scenario.currentSituation}</p><div class="small">Zone placement mode: manual. Facilitator defines harbors, bottlenecks, chokepoints, and play zones directly on the map.</div>${state.scenario.failureState ? `<div class="card"><strong>Warning</strong><div>${state.scenario.failureState}</div></div>` : ''}${previewNote}`;
  const overlay = document.getElementById('overlaySelect');
  if (overlay) overlay.value = state.scenario.overlayMode || 'openseamap';
}
function renderTemplates() {
  const el = document.getElementById('templateSelect');
  if (!el) return;
  const current = el.value || Object.keys(templates)[0];
  el.innerHTML = Object.keys(templates).map(key => `<option value="${key}" ${key === current ? 'selected' : ''}>${templates[key].scenario.name}</option>`).join('');
}
function renderCells() {
  const editor = document.getElementById('cellsEditor');
  if (!editor) return;
  editor.innerHTML = '';
  state.session.cells.forEach(addCellRow);
  const links = document.getElementById('playerLinks');
  links.innerHTML = state.session.cells.map(c => `<div class="small"><a href="./player.html?cell=${c.id}" target="_blank">${c.name} player link</a></div>`).join('');
}
function renderZoneEditor() {
  const zone = state.zones[state.selectedZoneId];
  if (!zone || !document.getElementById('zoneId')) return;
  document.getElementById('zoneId').value = state.selectedZoneId;
  document.getElementById('zoneName').value = zone.name;
  document.getElementById('zoneRadius').value = zone.radius;
  document.getElementById('zoneKind').value = zone.kind;
  document.getElementById('zoneTags').value = (zone.tags || []).join(', ');
  document.getElementById('zoneMovementModifier').value = zone.movementModifier || 0;
  document.getElementById('zoneControlWeight').value = zone.controlWeight || 1;
  document.getElementById('zoneVisibilityProfile').value = zone.visibilityProfile || 'all';
  document.getElementById('zoneAllowAssetPresence').checked = zone.allowAssetPresence !== false;
  document.getElementById('zoneNotes').value = zone.notes || '';
  document.getElementById('zoneIsCore').checked = !!zone.isCore;
  document.getElementById('zoneList').innerHTML = Object.entries(state.zones).map(([id, z]) => `<div class="card ${id===state.selectedZoneId ? 'zone-selected' : ''}" onclick="selectZone('${id}')"><strong>${z.name}</strong><div class="row"><span class="tag">${id}</span><span class="tag">${z.kind}</span><span class="tag">weight ${z.controlWeight}</span><span class="tag">${z.visibilityProfile}</span></div><div class="small">tags: ${(z.tags || []).join(', ') || 'none'}</div></div>`).join('');
}
function renderAssets() {
  const el = document.getElementById('assetsPanel');
  if (!el) return;
  const assisted = state.assets.some(x => x.type === 'isr' && x.status !== 'delayed' && x.fuel > 0 && x.readiness > 0);
  el.innerHTML = state.assets.map(a => {
    const sel = state.selectedActions[a.id] || { zone: a.zone, mode: 'hold' };
    return `<div class="card asset ${a.status}"><strong>${a.name}</strong><div class="row"><span class="tag">${a.type}</span><span class="tag">${a.status}</span><span class="tag">${prettyZone(a.zone)}</span><span class="tag">Fuel ${a.fuel}</span><span class="tag">Readiness ${a.readiness}</span><span class="tag">Visible ${(a.visibleTo || []).join(', ')}</span></div><div class="grid2"><select id="zone-${a.id}">${Object.keys(state.zones).map(z => `<option value="${z}" ${sel.zone === z ? 'selected' : ''}>${prettyZone(z)}</option>`).join('')}</select><select id="mode-${a.id}"><option value="commit" ${sel.mode === 'commit' ? 'selected' : ''}>Commit</option><option value="hold" ${sel.mode === 'hold' ? 'selected' : ''}>Hold</option><option value="delay" ${sel.mode === 'delay' ? 'selected' : ''}>Delayed</option></select><button onclick="setAssetAction('${a.id}', document.getElementById('zone-${a.id}').value, document.getElementById('mode-${a.id}').value)">Set</button></div><div class="small">Movement cost: ${movementCost(a.zone, sel.zone, assisted && a.type !== 'isr')}</div></div>`;
  }).join('');
}
function renderInjects() {
  const el = document.getElementById('injectsPanel');
  if (!el) return;
  const injects = state.turnPreview?.releasedInjects?.length ? state.turnPreview.releasedInjects : state.releasedInjects;
  if (!injects.length) {
    el.innerHTML = '<div class="small">No new pressure generated yet. Use Generate Pressure for a preview before resolving the turn.</div>';
    return;
  }
  el.innerHTML = injects.map(i => `<div class="card"><div><strong>${i.id}</strong> · ${i.title}</div><div class="row"><span class="tag">${i.domain}</span><span class="tag">${i.severity}</span><span class="tag">${prettyZone(i.zone)}</span></div><div>${i.situation}</div><div class="small">Visible to: ${(i.visibleTo || []).join(', ')}</div></div>`).join('');
}
function renderTimeline() {
  const el = document.getElementById('timelinePanel');
  if (!el) return;
  if (!state.timeline.length) { el.innerHTML = '<div class="small">No turns resolved yet.</div>'; return; }
  el.innerHTML = state.timeline.map(t => `<div class="timeline-item"><strong>Turn ${t.turn}</strong> · ${t.time}<br>${t.text}</div>`).join('');
}
function clearLayers(arr, target) { if (!target) return; arr.forEach(l => target.removeLayer(l)); arr.length = 0; }
function assetMarkerLatLng(asset, index) { return zoneOffsetLatLng(asset.zone, index + 2); }
function assetIcon(asset) {
  const symbol = asset.type === 'boarding_team' ? '△' : asset.type === 'isr' ? '◌' : asset.type === 'port_cell' ? '▣' : '▲';
  const color = asset.status === 'delayed' ? '#ef4444' : asset.status === 'committed' ? '#60a5fa' : '#e5e7eb';
  return L.divIcon({ className: '', html: `<div style="color:${color};font-size:20px;font-weight:700;text-shadow:0 0 2px #000">${symbol}</div>`, iconSize: [20, 20], iconAnchor: [10, 10] });
}
function redIcon(intensity) {
  const color = intensity >= 3 ? '#ef4444' : intensity >= 2 ? '#f59e0b' : '#facc15';
  return L.divIcon({ className: '', html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #000;opacity:0.9"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] });
}
function initMaps(force) {
  const facEl = document.getElementById('map');
  const playEl = document.getElementById('playerMap');
  if (force && map) { map.remove(); map = null; }
  if (force && playerMap) { playerMap.remove(); playerMap = null; }
  if (facEl) {
    map = L.map('map').setView([54.80, 7.55], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    seaLayer = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '&copy; OpenSeaMap contributors' });
    if ((state.scenario.overlayMode || 'openseamap') === 'openseamap') seaLayer.addTo(map);
    map.on('dblclick', e => createZoneAt(e.latlng));
    renderFacilitatorMap();
  }
  if (playEl) {
    playerMap = L.map('playerMap').setView([54.80, 7.55], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '&copy; OpenStreetMap contributors' }).addTo(playerMap);
    playerSeaLayer = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '&copy; OpenSeaMap contributors' });
    if ((state.scenario.overlayMode || 'openseamap') === 'openseamap') playerSeaLayer.addTo(playerMap);
    renderPlayerMap();
  }
}
function renderFacilitatorMap() {
  clearLayers(zoneLayers, map); clearLayers(incidentLayers, map); clearLayers(assetLayers, map); clearLayers(redLayers, map); clearLayers(zoneCenterLayers, map);
  Object.entries(state.zones).forEach(([key, z]) => {
    const st = zoneStyle(z.kind);
    const selected = key === state.selectedZoneId;
    const circle = L.circle(z.center, { radius: z.radius, color: selected ? '#f59e0b' : st.color, fillColor: st.fillColor, fillOpacity: st.fillOpacity, weight: selected ? 3 : 2 }).addTo(map);
    circle.on('click', () => selectZone(key));
    circle.bindTooltip(`${z.name} (${z.kind})`);
    zoneLayers.push(circle);
    const center = L.marker(z.center, { draggable: true, opacity: 0.85 }).addTo(map);
    center.on('click', () => selectZone(key));
    center.on('drag', e => { state.zones[key].center = [e.latlng.lat, e.latlng.lng]; saveState(); renderZoneEditor(); renderFacilitatorMap(); });
    zoneCenterLayers.push(center);
  });
  state.incidents.forEach((inc, idx) => {
    const ll = zoneOffsetLatLng(inc.zone, idx + 1);
    const marker = L.circleMarker(ll, { radius: 5 + severityValue(inc.severity), color: incidentColor(inc.severity), fillColor: incidentColor(inc.severity), fillOpacity: 0.9, weight: 1 }).addTo(map);
    marker.bindPopup(`<strong>${inc.title}</strong><br>${prettyZone(inc.zone)}<br>Severity: ${inc.severity}<br>Visible: ${(inc.visibleTo || []).join(', ')}`);
    incidentLayers.push(marker);
  });
  state.assets.forEach((asset, idx) => {
    const ll = assetMarkerLatLng(asset, idx);
    const marker = L.marker(ll, { icon: assetIcon(asset), draggable: true, title: asset.name }).addTo(map);
    marker.bindPopup(`<strong>${asset.name}</strong><br>Status: ${asset.status}<br>Fuel: ${asset.fuel}<br>Readiness: ${asset.readiness}<br>Assigned: ${asset.assignedCell}<br>Visible: ${(asset.visibleTo || []).join(', ')}`);
    marker.on('dragend', e => {
      const pos = e.target.getLatLng();
      const zone = nearestZone(pos.lat, pos.lng);
      state.selectedActions[asset.id] = { zone, mode: state.selectedActions[asset.id]?.mode || 'commit' };
      saveState();
      renderAssets();
      renderFacilitatorMap();
    });
    assetLayers.push(marker);
  });
  const redPresence = state.turnPreview?.redPresence?.length ? state.turnPreview.redPresence : buildRedPresence(zoneCoverage());
  redPresence.forEach((r, idx) => {
    const ll = zoneOffsetLatLng(r.zone, idx + 4);
    const marker = L.marker(ll, { icon: redIcon(r.intensity), title: 'Red Presence' }).addTo(map);
    marker.bindPopup(`<strong>Red Presence</strong><br>${prettyZone(r.zone)}<br>Intensity: ${r.intensity}`);
    redLayers.push(marker);
  });
}
function renderPlayerMap() {
  clearLayers(playerZoneLayers, playerMap); clearLayers(playerIncidentLayers, playerMap); clearLayers(playerAssetLayers, playerMap);
  const cellId = getPlayerCell();
  Object.entries(state.zones).forEach(([key, zone]) => {
    if (!isZoneVisibleToCell(key, cellId)) return;
    const st = zoneStyle(zone.kind);
    const circle = L.circle(zone.center, { radius: zone.radius, color: st.color, fillColor: st.fillColor, fillOpacity: st.fillOpacity, weight: 2 }).addTo(playerMap);
    circle.bindTooltip(zone.name);
    playerZoneLayers.push(circle);
  });
  const visibleFeed = (state.playerFeedByCell[cellId] || []).slice(-10);
  visibleFeed.forEach((item, idx) => {
    const ll = zoneOffsetLatLng(item.zone || state.selectedZoneId, idx + 1);
    const marker = L.circleMarker(ll, { radius: 7, color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.9, weight: 1 }).addTo(playerMap);
    marker.bindPopup(`<strong>Situation Update</strong><br>${item.text}`);
    playerIncidentLayers.push(marker);
  });
  state.assets.filter(asset => isAssetVisibleToCell(asset, cellId)).forEach((asset, idx) => {
    const ll = assetMarkerLatLng(asset, idx);
    const marker = L.marker(ll, { icon: assetIcon(asset), title: asset.name }).addTo(playerMap);
    marker.bindPopup(`<strong>${asset.name}</strong><br>Status: ${asset.status}<br>Fuel: ${asset.fuel}<br>Readiness: ${asset.readiness}`);
    playerAssetLayers.push(marker);
  });
}
function renderPlayerPage() {
  const sel = document.getElementById('playerCellSelect');
  if (!sel) return;
  const queryCell = new URLSearchParams(window.location.search).get('cell');
  const current = queryCell || sel.value || (state.session.cells[0] && state.session.cells[0].id);
  sel.innerHTML = state.session.cells.map(c => `<option value="${c.id}" ${c.id === current ? 'selected' : ''}>${c.name}</option>`).join('');
  const cellId = queryCell || sel.value || current;
  const cell = state.session.cells.find(c => c.id === cellId);
  document.getElementById('playerScenarioPanel').innerHTML = `<div><strong>${cell ? cell.name : 'Blue Cell'}</strong></div><div class="small">${cell ? cell.domain : ''}</div><div class="row" style="margin-top:10px"><span class="tag">Turn ${state.scenario.turn}</span><span class="tag">Time ${state.scenario.timeLabel}</span><span class="tag">Shipping ${state.scenario.shippingConfidence}</span><span class="tag">Objectives ${state.scenario.objectiveScore}</span></div><p><strong>Current situation</strong><br>${state.scenario.currentSituation}</p><div class="small">Role-based visibility is active. You only see zones, assets, and updates released to this cell.</div>`;
  const myAssets = state.assets.filter(asset => isAssetVisibleToCell(asset, cellId));
  document.getElementById('playerAssetsPanel').innerHTML = myAssets.length ? myAssets.map(a => `<div class="card"><strong>${a.name}</strong><div class="row"><span class="tag">${a.type}</span><span class="tag">${a.status}</span><span class="tag">${prettyZone(a.zone)}</span><span class="tag">Fuel ${a.fuel}</span><span class="tag">Readiness ${a.readiness}</span></div></div>`).join('') : '<div class="small">No assets are currently visible to this cell.</div>';
  const feed = state.playerFeedByCell[cellId] || [];
  document.getElementById('playerFeedPanel').innerHTML = feed.length ? feed.slice().reverse().map(f => `<div class="timeline-item"><strong>${f.time}</strong><br>${f.text}</div>`).join('') : '<div class="small">No facilitator updates yet for this cell.</div>';
  const log = state.actionLogByCell[cellId] || [];
  document.getElementById('playerActionLog').innerHTML = log.length ? log.slice().reverse().map(a => `<div class="timeline-item"><strong>${a.time}</strong><br>${a.text}</div>`).join('') : '<div class="small">No submitted actions yet.</div>';
  initMaps(true);
}
function renderAll() { ensureSessionMaps(); renderScenario(); renderTemplates(); renderCells(); renderZoneEditor(); renderAssets(); renderInjects(); renderTimeline(); renderPlayerPage(); }

window.selectZone = selectZone;
window.setAssetAction = setAssetAction;
init();
