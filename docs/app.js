const STORAGE_KEY = 'owge_v16_blank_authoring';

const DEFAULT_TEMPLATE = {
  scenario: {
    name: 'Blank Maritime Scenario',
    overview: 'Start from an empty chart. Facilitator places zones and assets manually, then saves the setup as a scenario package.',
    turn: 1,
    timeLabel: 'H+0',
    movementPressure: 0,
    timePressure: 0,
    assetPressure: 0,
    shippingConfidence: 6,
    zoneControlScore: 0,
    objectiveScore: 0,
    failureState: '',
    currentSituation: 'No scenario geometry yet. Build the battlespace by placing zones and assets on the map.',
    overlayMode: 'openseamap',
    redDoctrine: 'manual',
    rememberLastMapView: true,
    lastMapView: { center: [54.8, 7.55], zoom: 8 },
    pinnedMapView: null
  },
  zones: {}
};

const DEFAULT_STATE = {
  version: 16,
  scenario: clone(DEFAULT_TEMPLATE.scenario),
  zones: clone(DEFAULT_TEMPLATE.zones),
  selectedZoneId: '',
  selectedAssetId: '',
  mapMode: 'select',
  session: {
    cells: [
      { id: 'blue-maritime', name: 'Blue Maritime', domain: 'maritime' },
      { id: 'blue-port', name: 'Blue Port Authority', domain: 'logistics' }
    ]
  },
  assets: [],
  incidents: [],
  releasedInjects: [],
  selectedActions: {},
  playerFeedByCell: { 'blue-maritime': [], 'blue-port': [] },
  actionLogByCell: { 'blue-maritime': [], 'blue-port': [] },
  timeline: []
};

let state = loadState();
let injectLibrary = [];
let templates = {};
let map, playerMap, seaLayer, playerSeaLayer;
let zoneLayers = [], assetLayers = [], zoneCenterLayers = [];
let playerZoneLayers = [], playerAssetLayers = [];

const ASSET_TYPE_OPTIONS = [
  { value: 'frigate', label: 'Frigate' },
  { value: 'corvette', label: 'Corvette' },
  { value: 'patrol_vessel', label: 'Patrol Vessel' },
  { value: 'submarine', label: 'Submarine' },
  { value: 'amphibious_ship', label: 'Amphibious Ship' },
  { value: 'landing_craft', label: 'Landing Craft' },
  { value: 'auxiliary_ship', label: 'Auxiliary Ship' },
  { value: 'mine_warfare_vessel', label: 'Mine Warfare Vessel' },
  { value: 'maritime_helicopter', label: 'Maritime Helicopter' },
  { value: 'isr_drone', label: 'ISR Drone' },
  { value: 'boarding_team', label: 'Boarding Team' },
  { value: 'port_support_unit', label: 'Port Support Unit' },
  { value: 'command_element', label: 'Command Element' }
];

function clone(o) { return JSON.parse(JSON.stringify(o)); }
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return clone(DEFAULT_STATE);
  try {
    return migrateState(JSON.parse(raw));
  } catch (e) {
    return clone(DEFAULT_STATE);
  }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function migrateState(pkg) {
  const merged = Object.assign(clone(DEFAULT_STATE), pkg || {});
  merged.version = 16;
  merged.scenario = Object.assign(clone(DEFAULT_STATE.scenario), pkg?.scenario || {});
  merged.zones = pkg?.zones || {};
  merged.assets = Array.isArray(pkg?.assets) ? pkg.assets : [];
  merged.selectedZoneId = merged.selectedZoneId && merged.zones[merged.selectedZoneId] ? merged.selectedZoneId : (Object.keys(merged.zones)[0] || '');
  merged.selectedAssetId = merged.selectedAssetId && merged.assets.find(a => a.id === merged.selectedAssetId) ? merged.selectedAssetId : (merged.assets[0]?.id || '');
  merged.mapMode = merged.mapMode || 'select';
  ensureSessionMaps(merged);
  merged.scenario.rememberLastMapView = merged.scenario.rememberLastMapView !== false;
  merged.scenario.lastMapView = normalizeMapView(merged.scenario.lastMapView) || { center: [54.8, 7.55], zoom: 8 };
  merged.scenario.pinnedMapView = normalizeMapView(merged.scenario.pinnedMapView);
  Object.entries(merged.zones).forEach(([id, z]) => {
    merged.zones[id] = Object.assign({ name: id, center: [54.8, 7.55], radius: 12000, kind: 'sea' }, z);
  });
  merged.assets = merged.assets.map(a => Object.assign({
    id: `asset-${Math.random().toString(36).slice(2, 8)}`,
    name: 'New Asset',
    type: 'patrol_vessel',
    status: 'available',
    zone: '',
    fuel: 6,
    readiness: 5,
    assignedCell: merged.session.cells[0]?.id || ''
  }, a, { type: normalizeAssetType(a?.type) }));
  return merged;
}
function ensureSessionMaps(targetState = state) {
  targetState.session = targetState.session || { cells: [] };
  targetState.session.cells = Array.isArray(targetState.session.cells) && targetState.session.cells.length ? targetState.session.cells : clone(DEFAULT_STATE.session.cells);
  targetState.playerFeedByCell = targetState.playerFeedByCell || {};
  targetState.actionLogByCell = targetState.actionLogByCell || {};
  targetState.session.cells.forEach(c => {
    if (!targetState.playerFeedByCell[c.id]) targetState.playerFeedByCell[c.id] = [];
    if (!targetState.actionLogByCell[c.id]) targetState.actionLogByCell[c.id] = [];
  });
}
function getPlayerCell() {
  const params = new URLSearchParams(window.location.search);
  return params.get('cell') || document.getElementById('playerCellSelect')?.value || state.session.cells[0]?.id || '';
}
function prettyZone(zoneId) { return state.zones[zoneId]?.name || (zoneId || 'Unplaced'); }
function assetTypeLabel(type) { return ASSET_TYPE_OPTIONS.find(o => o.value === type)?.label || type || 'Asset'; }
function normalizeAssetType(type) {
  const legacy = {
    isr: 'isr_drone',
    port_cell: 'port_support_unit'
  };
  return legacy[type] || (ASSET_TYPE_OPTIONS.some(o => o.value === type) ? type : 'patrol_vessel');
}

function normalizeMapView(view) {
  if (!view || !Array.isArray(view.center) || view.center.length !== 2) return null;
  const lat = Number(view.center[0]);
  const lng = Number(view.center[1]);
  const zoom = Number(view.zoom);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(zoom)) return null;
  return { center: [lat, lng], zoom };
}
function defaultMapView() {
  return { center: [54.8, 7.55], zoom: 8 };
}
function currentMapView(targetMap) {
  if (!targetMap) return normalizeMapView(state.scenario.lastMapView) || normalizeMapView(state.scenario.pinnedMapView) || defaultMapView();
  const c = targetMap.getCenter();
  return { center: [Number(c.lat.toFixed(5)), Number(c.lng.toFixed(5))], zoom: targetMap.getZoom() };
}
function getInitialMapView() {
  return normalizeMapView(state.scenario.pinnedMapView) || normalizeMapView(state.scenario.lastMapView) || defaultMapView();
}
function persistLastMapView(targetMap) {
  if (!targetMap || state.scenario.rememberLastMapView === false) return;
  state.scenario.lastMapView = currentMapView(targetMap);
  saveState();
  renderScenario();
}
function pinCurrentMapView() {
  if (!map) return;
  state.scenario.pinnedMapView = currentMapView(map);
  saveState();
  renderScenario();
}
function clearPinnedMapView() {
  state.scenario.pinnedMapView = null;
  saveState();
  renderScenario();
}
function centerMapOnSavedView() {
  if (!map) return;
  const view = getInitialMapView();
  map.setView(view.center, view.zoom);
}
function zoneStyle(kind) {
  if (kind === 'port' || kind === 'harbor') return { color: '#fde68a', fillColor: '#fde68a', fillOpacity: 0.10 };
  if (kind === 'info') return { color: '#c084fc', fillColor: '#c084fc', fillOpacity: 0.09 };
  if (kind === 'support') return { color: '#94a3b8', fillColor: '#94a3b8', fillOpacity: 0.07 };
  if (kind === 'bottleneck') return { color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.10 };
  return { color: '#38bdf8', fillColor: '#38bdf8', fillOpacity: 0.07 };
}
function slugify(s) { return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item'; }
function uniqueId(base, existing) {
  let id = slugify(base);
  let i = 2;
  while (existing.includes(id)) {
    id = `${slugify(base)}-${i++}`;
  }
  return id;
}
function zoneIds() { return Object.keys(state.zones); }
function hasZones() { return zoneIds().length > 0; }

async function init() {
  try {
    const [injResp, tplResp] = await Promise.all([
      fetch('./data/injects.json').catch(() => null),
      fetch('./data/templates.json').catch(() => null)
    ]);
    injectLibrary = injResp && injResp.ok ? await injResp.json() : [];
    templates = tplResp && tplResp.ok ? await tplResp.json() : {};
  } catch (e) {
    injectLibrary = [];
    templates = {};
  }
  ensureSessionMaps();
  bindEvents();
  renderAll();
  initMaps(true);
}

function bindEvents() {
  if (document.getElementById('map')) {
    document.getElementById('resetBtn').onclick = resetToBlankScenario;
    document.getElementById('generatePressureBtn').onclick = () => alert('Pressure/adjudication is not the focus of this build. Use this build to author zones and assets, then save the scenario package.');
    document.getElementById('nextTurnBtn').onclick = () => alert('Turn resolution is de-emphasized in this build. Use it for facilitator scenario setup.');
    document.getElementById('overlaySelect').onchange = (e) => { state.scenario.overlayMode = e.target.value; saveState(); initMaps(true); };
    document.getElementById('saveZonePropsBtn').onclick = saveSelectedZoneProps;
    document.getElementById('deleteZoneBtn').onclick = deleteSelectedZone;
    document.getElementById('resetZonesBtn').onclick = clearZones;
    document.getElementById('addCellBtn').onclick = () => addCellRow();
    document.getElementById('saveCellsBtn').onclick = saveCells;
    document.getElementById('templateSelect').onchange = applyTemplate;
    document.getElementById('savePackageBtn').onclick = saveExercisePackage;
    document.getElementById('loadPackageInput').onchange = loadExercisePackage;
    document.getElementById('newBlankScenarioBtn').onclick = resetToBlankScenario;
    document.getElementById('saveScenarioMetaBtn').onclick = saveScenarioMeta;
    document.getElementById('rememberLastMapView').onchange = (e) => { state.scenario.rememberLastMapView = !!e.target.checked; if (state.scenario.rememberLastMapView && map) state.scenario.lastMapView = currentMapView(map); saveState(); renderScenario(); };
    document.getElementById('pinMapViewBtn').onclick = pinCurrentMapView;
    document.getElementById('clearPinnedMapViewBtn').onclick = clearPinnedMapView;
    document.getElementById('centerSavedMapViewBtn').onclick = centerMapOnSavedView;
    document.getElementById('addZoneModeBtn').onclick = () => setMapMode(state.mapMode === 'add-zone' ? 'select' : 'add-zone');
    document.getElementById('addAssetBtn').onclick = addAsset;
    document.getElementById('saveAssetPropsBtn').onclick = saveSelectedAssetProps;
    document.getElementById('deleteAssetBtn').onclick = deleteSelectedAsset;
    document.getElementById('clearAssetsBtn').onclick = clearAssets;
  }
  if (document.getElementById('playerCellSelect')) {
    document.getElementById('playerCellSelect').onchange = () => { renderPlayerPage(); initMaps(true); };
    document.getElementById('playerSubmitBtn').onclick = submitPlayerAction;
  }
}

function setMapMode(mode) {
  state.mapMode = mode;
  saveState();
  renderScenario();
}

function resetToBlankScenario() {
  state = clone(DEFAULT_STATE);
  saveState();
  renderAll();
  initMaps(true);
}

function clearZones() {
  state.zones = {};
  state.selectedZoneId = '';
  state.assets = state.assets.map(a => Object.assign({}, a, { zone: '' }));
  saveState();
  renderAll();
  initMaps(true);
}

function clearAssets() {
  state.assets = [];
  state.selectedAssetId = '';
  saveState();
  renderAll();
  initMaps(true);
}

function buildPackage() {
  return clone({
    version: 16,
    scenario: state.scenario,
    zones: state.zones,
    selectedZoneId: state.selectedZoneId,
    selectedAssetId: state.selectedAssetId,
    mapMode: 'select',
    session: state.session,
    assets: state.assets,
    incidents: state.incidents,
    releasedInjects: state.releasedInjects,
    selectedActions: state.selectedActions,
    playerFeedByCell: state.playerFeedByCell,
    actionLogByCell: state.actionLogByCell,
    timeline: state.timeline
  });
}

function saveExercisePackage() {
  const filename = `${slugify(state.scenario.name || 'owge-scenario') || 'owge-scenario'}.json`;
  const blob = new Blob([JSON.stringify(buildPackage(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function loadExercisePackage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function () {
    try {
      state = migrateState(JSON.parse(reader.result));
      saveState();
      renderAll();
      initMaps(true);
    } catch (err) {
      alert('Invalid exercise/scenario package.');
    }
  };
  reader.readAsText(file);
}

function applyTemplate() {
  const key = document.getElementById('templateSelect').value;
  if (!key) return;
  if (key === '__blank__') {
    resetToBlankScenario();
    return;
  }
  if (!templates[key]) return;
  state.scenario = Object.assign(clone(DEFAULT_STATE.scenario), clone(templates[key].scenario || {}));
  state.zones = clone(templates[key].zones || {});
  state.assets = clone(templates[key].assets || []);
  state.selectedZoneId = Object.keys(state.zones)[0] || '';
  state.selectedAssetId = state.assets[0]?.id || '';
  saveState();
  renderAll();
  initMaps(true);
}

function saveScenarioMeta() {
  state.scenario.name = document.getElementById('scenarioNameInput').value.trim() || 'Untitled Scenario';
  state.scenario.overview = document.getElementById('scenarioOverviewInput').value.trim() || 'Facilitator-authored scenario.';
  state.scenario.currentSituation = document.getElementById('scenarioSituationInput').value.trim() || 'Facilitator-authored setup.';
  state.scenario.overlayMode = document.getElementById('overlaySelect').value;
  const rememberLast = document.getElementById('rememberLastMapView');
  state.scenario.rememberLastMapView = rememberLast ? !!rememberLast.checked : state.scenario.rememberLastMapView !== false;
  if (map && state.scenario.rememberLastMapView) state.scenario.lastMapView = currentMapView(map);
  saveState();
  renderScenario();
}

function addCellRow(cell) {
  const container = document.getElementById('cellsEditor');
  if (!container) return;
  const c = cell || { id: '', name: '', domain: 'maritime' };
  const row = document.createElement('div');
  row.className = 'card cell-row';
  row.innerHTML = '<div class="grid2"><div><label>Name</label><input class="cell-name" value="' + (c.name || '') + '"></div><div><label>Domain</label><select class="cell-domain">' + ['maritime', 'logistics', 'information', 'cyber', 'air', 'land', 'space'].map(d => '<option value="' + d + '" ' + (c.domain === d ? 'selected' : '') + '>' + d + '</option>').join('') + '</select></div></div><button class="secondary remove-cell-btn">Remove</button>';
  container.appendChild(row);
  row.querySelector('.remove-cell-btn').onclick = () => row.remove();
}

function saveCells() {
  const rows = Array.from(document.querySelectorAll('.cell-row'));
  const cells = rows.map((row, idx) => {
    const name = row.querySelector('.cell-name').value.trim() || ('Blue Cell ' + (idx + 1));
    return { id: uniqueId(name, []), name, domain: row.querySelector('.cell-domain').value };
  });
  state.session.cells = cells.length ? cells : clone(DEFAULT_STATE.session.cells);
  const oldAssets = clone(state.assets);
  state.playerFeedByCell = {};
  state.actionLogByCell = {};
  ensureSessionMaps();
  state.assets = oldAssets.map(a => Object.assign({}, a, { assignedCell: state.session.cells.find(c => c.id === a.assignedCell)?.id || state.session.cells[0].id }));
  saveState();
  renderAll();
}

function selectZone(zoneId) {
  state.selectedZoneId = zoneId;
  saveState();
  renderZoneEditor();
  renderFacilitatorMap();
}

function createZoneAt(latlng) {
  const id = uniqueId(`zone-${zoneIds().length + 1}`, zoneIds());
  state.zones[id] = {
    name: `Zone ${zoneIds().length + 1}`,
    center: [latlng.lat, latlng.lng],
    radius: 12000,
    kind: 'sea'
  };
  state.selectedZoneId = id;
  state.mapMode = 'select';
  saveState();
  renderAll();
  initMaps(true);
}

function saveSelectedZoneProps() {
  const currentId = state.selectedZoneId;
  if (!currentId || !state.zones[currentId]) return;
  const requestedId = slugify(document.getElementById('zoneId').value.trim()) || currentId;
  const name = document.getElementById('zoneName').value.trim() || state.zones[currentId].name;
  const radius = Math.max(1000, Number(document.getElementById('zoneRadius').value) || state.zones[currentId].radius || 12000);
  const kind = document.getElementById('zoneKind').value || 'sea';
  const updated = Object.assign({}, state.zones[currentId], { name, radius, kind });
  if (requestedId !== currentId) {
    if (state.zones[requestedId]) {
      alert('Zone id already exists.');
      return;
    }
    delete state.zones[currentId];
    state.zones[requestedId] = updated;
    state.assets = state.assets.map(a => Object.assign({}, a, { zone: a.zone === currentId ? requestedId : a.zone }));
    state.selectedZoneId = requestedId;
  } else {
    state.zones[currentId] = updated;
  }
  saveState();
  renderAll();
  initMaps(true);
}

function deleteSelectedZone() {
  const id = state.selectedZoneId;
  if (!id || !state.zones[id]) return;
  delete state.zones[id];
  state.assets = state.assets.map(a => Object.assign({}, a, { zone: a.zone === id ? '' : a.zone }));
  state.selectedZoneId = zoneIds()[0] || '';
  saveState();
  renderAll();
  initMaps(true);
}

function addAsset() {
  const existingIds = state.assets.map(a => a.id);
  const zone = state.selectedZoneId || zoneIds()[0] || '';
  const asset = {
    id: uniqueId(`asset-${state.assets.length + 1}`, existingIds),
    name: `New Asset ${state.assets.length + 1}`,
    type: 'patrol_vessel',
    status: 'available',
    zone,
    fuel: 6,
    readiness: 5,
    assignedCell: state.session.cells[0]?.id || ''
  };
  state.assets.push(asset);
  state.selectedAssetId = asset.id;
  saveState();
  renderAll();
  initMaps(true);
}

function selectAsset(assetId) {
  state.selectedAssetId = assetId;
  saveState();
  renderAssetEditor();
  renderAssets();
  renderFacilitatorMap();
}

function saveSelectedAssetProps() {
  const asset = state.assets.find(a => a.id === state.selectedAssetId);
  if (!asset) return;
  const requestedId = slugify(document.getElementById('assetId').value.trim()) || asset.id;
  if (requestedId !== asset.id && state.assets.some(a => a.id === requestedId)) {
    alert('Asset id already exists.');
    return;
  }
  asset.id = requestedId;
  asset.name = document.getElementById('assetName').value.trim() || asset.name;
  asset.type = normalizeAssetType(document.getElementById('assetType').value);
  asset.status = document.getElementById('assetStatus').value;
  asset.zone = document.getElementById('assetZone').value;
  asset.fuel = Math.max(0, Number(document.getElementById('assetFuel').value) || 0);
  asset.readiness = Math.max(0, Number(document.getElementById('assetReadiness').value) || 0);
  asset.assignedCell = document.getElementById('assetAssignedCell').value;
  state.selectedAssetId = asset.id;
  saveState();
  renderAll();
  initMaps(true);
}

function deleteSelectedAsset() {
  const id = state.selectedAssetId;
  if (!id) return;
  state.assets = state.assets.filter(a => a.id !== id);
  state.selectedAssetId = state.assets[0]?.id || '';
  saveState();
  renderAll();
  initMaps(true);
}

function nearestZone(lat, lon) {
  const ids = zoneIds();
  if (!ids.length) return '';
  let best = ids[0];
  let score = Infinity;
  ids.forEach(key => {
    const c = state.zones[key].center;
    const s = Math.pow(lat - c[0], 2) + Math.pow(lon - c[1], 2);
    if (s < score) {
      score = s;
      best = key;
    }
  });
  return best;
}

function assetDoctrineAbbrev(asset) {
  const map = {
    frigate: 'FFG',
    corvette: 'COR',
    patrol_vessel: 'OPV',
    submarine: 'SUB',
    amphibious_ship: 'AMPH',
    landing_craft: 'LC',
    auxiliary_ship: 'AUX',
    mine_warfare_vessel: 'MCM',
    maritime_helicopter: 'HELO',
    isr_drone: 'ISR',
    boarding_team: 'VBSS',
    port_support_unit: 'PORT',
    command_element: 'C2'
  };
  return map[normalizeAssetType(asset.type)] || 'UNIT';
}

function assetDoctrineDomain(asset) {
  const type = normalizeAssetType(asset.type);
  if (type === 'submarine') return 'subsurface';
  if (type === 'maritime_helicopter' || type === 'isr_drone') return 'air';
  if (type === 'boarding_team' || type === 'port_support_unit' || type === 'command_element') return 'ground';
  return 'surface';
}

function assetDoctrineSidc(asset) {
  const domain = assetDoctrineDomain(asset);
  if (domain === 'subsurface') return 'SFUP------';
  if (domain === 'air') return 'SFAP------';
  if (domain === 'ground') return 'SFGP------';
  return 'SFSP------';
}

function assetDoctrineFrame(asset) {
  const domain = assetDoctrineDomain(asset);
  if (domain === 'subsurface') return { color: '#60a5fa', path: 'M6 16 Q22 4 38 16 Q22 28 6 16 Z' };
  if (domain === 'air') return { color: '#60a5fa', path: 'M22 5 L39 16 L22 27 L5 16 Z' };
  if (domain === 'ground') return { color: '#60a5fa', path: 'M5 7 H39 V25 H5 Z' };
  return { color: '#60a5fa', path: 'M5 16 Q5 5 22 5 H39 Q39 16 39 16 Q39 27 22 27 H5 Q5 16 5 16 Z' };
}

function buildFallbackDoctrineSvg(asset, selected) {
  const frame = assetDoctrineFrame(asset);
  const outline = selected ? '#f59e0b' : '#08111f';
  const text = assetDoctrineAbbrev(asset);
  return `
    <svg width="58" height="58" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="${frame.path}" fill="#e0f2fe" stroke="${outline}" stroke-width="3.4" />
      <path d="${frame.path}" fill="none" stroke="${frame.color}" stroke-width="1.8" />
      <text x="22" y="20" text-anchor="middle" dominant-baseline="middle" font-size="7.1" font-weight="700" fill="#0f172a">${text}</text>
      <text x="22" y="33.5" text-anchor="middle" font-size="5.2" font-weight="700" fill="#cbd5e1">${assetTypeLabel(asset.type).toUpperCase()}</text>
    </svg>`;
}

function buildMilsymbolMarker(asset, selected) {
  if (typeof ms === 'undefined' || !ms || typeof ms.Symbol !== 'function') return null;
  try {
    const label = assetDoctrineAbbrev(asset);
    const symbol = new ms.Symbol(assetDoctrineSidc(asset), {
      size: 42,
      uniqueDesignation: label,
      higherFormation: selected ? 'SELECTED' : '',
      infoFields: true,
      outlineWidth: selected ? 6 : 2,
      outlineColor: selected ? '#f59e0b' : '#0f172a'
    });
    const anchor = typeof symbol.getAnchor === 'function' ? symbol.getAnchor() : { x: 21, y: 21 };
    const html = `<div class="app6-marker-wrap">${symbol.asSVG()}<div class="app6-asset-name">${asset.name}</div></div>`;
    return L.divIcon({
      className: 'app6-div-icon',
      html,
      iconSize: [84, 72],
      iconAnchor: [Math.round(anchor.x || 21), Math.round((anchor.y || 21) + 6)],
      popupAnchor: [0, -16]
    });
  } catch (err) {
    return null;
  }
}

function assetIcon(asset) {
  const selected = state.selectedAssetId === asset.id;
  const doctrinalIcon = buildMilsymbolMarker(asset, selected);
  if (doctrinalIcon) return doctrinalIcon;
  const html = `<div class="app6-marker-wrap">${buildFallbackDoctrineSvg(asset, selected)}<div class="app6-asset-name">${asset.name}</div></div>`;
  return L.divIcon({ className: 'app6-div-icon', html, iconSize: [84, 72], iconAnchor: [29, 29], popupAnchor: [0, -12] });
}

function clearLayers(arr, target) {
  if (!target) return;
  arr.forEach(l => target.removeLayer(l));
  arr.length = 0;
}

function zoneOffsetLatLng(zoneId, index) {
  const ids = zoneIds();
  const fallback = ids[0] ? state.zones[ids[0]].center : [54.8, 7.55];
  const center = state.zones[zoneId]?.center || fallback;
  const row = index % 3;
  const col = Math.floor(index / 3) % 3;
  return [center[0] + (row - 1) * 0.03, center[1] + (col - 1) * 0.04];
}

function initMaps(force) {
  const facEl = document.getElementById('map');
  const playEl = document.getElementById('playerMap');
  if (force && map) { map.remove(); map = null; }
  if (force && playerMap) { playerMap.remove(); playerMap = null; }
  if (facEl) {
    const initialView = getInitialMapView();
    map = L.map('map').setView(initialView.center, initialView.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    seaLayer = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '&copy; OpenSeaMap contributors' });
    if ((state.scenario.overlayMode || 'openseamap') === 'openseamap') seaLayer.addTo(map);
    map.on('click', e => {
      if (state.mapMode === 'add-zone') {
        createZoneAt(e.latlng);
      }
    });
    map.on('moveend', () => persistLastMapView(map));
    renderFacilitatorMap();
  }
  if (playEl) {
    const playerInitialView = getInitialMapView();
    playerMap = L.map('playerMap').setView(playerInitialView.center, playerInitialView.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '&copy; OpenStreetMap contributors' }).addTo(playerMap);
    playerSeaLayer = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '&copy; OpenSeaMap contributors' });
    if ((state.scenario.overlayMode || 'openseamap') === 'openseamap') playerSeaLayer.addTo(playerMap);
    renderPlayerMap();
  }
}

function renderFacilitatorMap() {
  if (!map) return;
  clearLayers(zoneLayers, map);
  clearLayers(zoneCenterLayers, map);
  clearLayers(assetLayers, map);
  zoneIds().forEach(key => {
    const z = state.zones[key];
    const st = zoneStyle(z.kind);
    const selected = key === state.selectedZoneId;
    const circle = L.circle(z.center, {
      radius: z.radius,
      color: selected ? '#f59e0b' : st.color,
      fillColor: st.fillColor,
      fillOpacity: st.fillOpacity,
      weight: selected ? 3 : 2
    }).addTo(map);
    circle.on('click', (ev) => {
      L.DomEvent.stopPropagation(ev);
      selectZone(key);
    });
    circle.bindTooltip(`${z.name} (${key})`);
    zoneLayers.push(circle);

    const center = L.marker(z.center, { draggable: true, opacity: 0.9 }).addTo(map);
    center.on('click', (ev) => {
      L.DomEvent.stopPropagation(ev);
      selectZone(key);
    });
    center.on('drag', (e) => {
      state.zones[key].center = [e.latlng.lat, e.latlng.lng];
      saveState();
      renderZoneEditor();
      map.on('moveend', () => persistLastMapView(map));
    renderFacilitatorMap();
    });
    zoneCenterLayers.push(center);
  });

  state.assets.forEach((a, idx) => {
    const ll = a.zone && state.zones[a.zone] ? zoneOffsetLatLng(a.zone, idx + 1) : [54.8 + (idx % 3) * 0.04, 7.2 + (idx % 4) * 0.06];
    const marker = L.marker(ll, { icon: assetIcon(a), draggable: true, title: a.name }).addTo(map);
    marker.bindPopup('<strong>' + a.name + '</strong><br>Type: ' + assetTypeLabel(a.type) + '<br>Zone: ' + prettyZone(a.zone) + '<br>Cell: ' + (state.session.cells.find(c => c.id === a.assignedCell)?.name || 'Unassigned'));
    marker.on('click', () => selectAsset(a.id));
    marker.on('dragend', e => {
      if (!hasZones()) return;
      a.zone = nearestZone(e.target.getLatLng().lat, e.target.getLatLng().lng);
      saveState();
      renderAll();
      initMaps(true);
    });
    assetLayers.push(marker);
  });
}

function renderPlayerMap() {
  if (!playerMap) return;
  clearLayers(playerZoneLayers, playerMap);
  clearLayers(playerAssetLayers, playerMap);
  const cellId = getPlayerCell();
  zoneIds().forEach(key => {
    const z = state.zones[key];
    const st = zoneStyle(z.kind);
    const circle = L.circle(z.center, { radius: z.radius, color: st.color, fillColor: st.fillColor, fillOpacity: st.fillOpacity, weight: 2 }).addTo(playerMap);
    circle.bindTooltip(z.name);
    playerZoneLayers.push(circle);
  });
  state.assets.filter(a => !cellId || a.assignedCell === cellId).forEach((a, idx) => {
    const ll = a.zone && state.zones[a.zone] ? zoneOffsetLatLng(a.zone, idx + 1) : [54.8 + (idx % 3) * 0.04, 7.2 + (idx % 4) * 0.06];
    const marker = L.marker(ll, { icon: assetIcon(a), title: a.name }).addTo(playerMap);
    marker.bindPopup('<strong>' + a.name + '</strong><br>Type: ' + assetTypeLabel(a.type) + '<br>Zone: ' + prettyZone(a.zone));
    playerAssetLayers.push(marker);
  });
}

function renderScenario() {
  const el = document.getElementById('scenarioPanel');
  if (!el) return;
  const pinned = normalizeMapView(state.scenario.pinnedMapView);
  const remembered = normalizeMapView(state.scenario.lastMapView);
  el.innerHTML = `
    <div><strong>${state.scenario.name}</strong></div>
    <div class="small" style="margin-top:6px">${state.scenario.overview}</div>
    <div class="row" style="margin-top:10px">
      <span class="tag">Zones: ${zoneIds().length}</span>
      <span class="tag">Assets: ${state.assets.length}</span>
      <span class="tag">Map mode: ${state.mapMode === 'add-zone' ? 'Add zone on map click' : 'Select/edit'}</span>
      <span class="tag">Overlay: ${(state.scenario.overlayMode || 'openseamap') === 'openseamap' ? 'OSM + OpenSeaMap' : 'OSM only'}</span>
      <span class="tag">Remember view: ${state.scenario.rememberLastMapView === false ? 'Off' : 'On'}</span>
      <span class="tag">Pinned view: ${pinned ? 'Set' : 'Not set'}</span>
    </div>
    <p><strong>Current situation</strong><br>${state.scenario.currentSituation}</p>
    <p class="small"><strong>Map start view</strong><br>${pinned ? `Pinned at ${pinned.center[0].toFixed(2)}, ${pinned.center[1].toFixed(2)} / zoom ${pinned.zoom}` : 'No pinned view saved.'}${remembered ? `<br>Last remembered view ${remembered.center[0].toFixed(2)}, ${remembered.center[1].toFixed(2)} / zoom ${remembered.zoom}` : ''}</p>
  `;
  const title = document.querySelector('header h1');
  if (title) title.textContent = 'Open War Game Engine v16';
  const addZoneModeBtn = document.getElementById('addZoneModeBtn');
  if (addZoneModeBtn) {
    addZoneModeBtn.textContent = state.mapMode === 'add-zone' ? 'Exit Add Zone Mode' : 'Add Zone Mode';
    addZoneModeBtn.className = state.mapMode === 'add-zone' ? 'warn' : '';
  }
  const scenarioNameInput = document.getElementById('scenarioNameInput');
  if (scenarioNameInput) scenarioNameInput.value = state.scenario.name || '';
  const scenarioOverviewInput = document.getElementById('scenarioOverviewInput');
  if (scenarioOverviewInput) scenarioOverviewInput.value = state.scenario.overview || '';
  const scenarioSituationInput = document.getElementById('scenarioSituationInput');
  if (scenarioSituationInput) scenarioSituationInput.value = state.scenario.currentSituation || '';
  const overlaySelect = document.getElementById('overlaySelect');
  if (overlaySelect) overlaySelect.value = state.scenario.overlayMode || 'openseamap';
  const rememberLastMapView = document.getElementById('rememberLastMapView');
  if (rememberLastMapView) rememberLastMapView.checked = state.scenario.rememberLastMapView !== false;
}

function renderTemplates() {
  const sel = document.getElementById('templateSelect');
  if (!sel) return;
  const options = ['<option value="__blank__">Blank scenario</option>'].concat(Object.entries(templates).map(([key, tpl]) => `<option value="${key}">${tpl.scenario?.name || key}</option>`));
  sel.innerHTML = options.join('');
}

function renderCells() {
  const container = document.getElementById('cellsEditor');
  if (!container) return;
  container.innerHTML = '';
  state.session.cells.forEach(addCellRow);
  const links = document.getElementById('playerLinks');
  if (links) {
    links.innerHTML = state.session.cells.map(c => `<div class="small"><a href="./player.html?cell=${encodeURIComponent(c.id)}" target="_blank">Open player view: ${c.name}</a></div>`).join('');
  }
}

function renderZoneEditor() {
  const id = state.selectedZoneId;
  const zone = id ? state.zones[id] : null;
  const zoneIdEl = document.getElementById('zoneId');
  const zoneNameEl = document.getElementById('zoneName');
  const zoneRadiusEl = document.getElementById('zoneRadius');
  const zoneKindEl = document.getElementById('zoneKind');
  if (zoneIdEl) zoneIdEl.value = id || '';
  if (zoneNameEl) zoneNameEl.value = zone?.name || '';
  if (zoneRadiusEl) zoneRadiusEl.value = zone?.radius || '';
  if (zoneKindEl) zoneKindEl.value = zone?.kind || 'sea';
  const list = document.getElementById('zoneList');
  if (list) {
    list.innerHTML = zoneIds().length
      ? zoneIds().map(zoneId => `<div class="card ${zoneId === id ? 'zone-selected' : ''}"><strong>${state.zones[zoneId].name}</strong><div class="small">${zoneId} · ${state.zones[zoneId].kind} · ${Math.round((state.zones[zoneId].radius || 0) / 1000)} km</div><button class="secondary" onclick="selectZone('${zoneId}')">Select</button></div>`).join('')
      : '<div class="small">No zones yet. Click <strong>Add Zone Mode</strong> and then click on the map.</div>';
  }
}

function renderAssets() {
  const panel = document.getElementById('assetsPanel');
  if (!panel) return;
  panel.innerHTML = state.assets.length
    ? state.assets.map(a => `
      <div class="card asset ${a.id === state.selectedAssetId ? 'zone-selected' : ''}">
        <strong>${a.name}</strong>
        <div class="row" style="margin-top:6px">
          <span class="tag">${assetTypeLabel(a.type)}</span>
          <span class="tag">${a.status}</span>
          <span class="tag">${prettyZone(a.zone)}</span>
          <span class="tag">${state.session.cells.find(c => c.id === a.assignedCell)?.name || 'Unassigned'}</span>
        </div>
        <button class="secondary" onclick="selectAsset('${a.id}')">Select</button>
      </div>`).join('')
    : '<div class="small">No assets yet. Add them manually after creating zones.</div>';
  renderAssetEditor();
}

function renderAssetEditor() {
  const asset = state.assets.find(a => a.id === state.selectedAssetId) || null;
  const assetId = document.getElementById('assetId');
  const assetName = document.getElementById('assetName');
  const assetType = document.getElementById('assetType');
  const assetStatus = document.getElementById('assetStatus');
  const assetZone = document.getElementById('assetZone');
  const assetFuel = document.getElementById('assetFuel');
  const assetReadiness = document.getElementById('assetReadiness');
  const assetAssignedCell = document.getElementById('assetAssignedCell');
  if (!assetZone || !assetAssignedCell) return;
  assetZone.innerHTML = ['<option value="">Unplaced</option>'].concat(zoneIds().map(id => `<option value="${id}">${state.zones[id].name}</option>`)).join('');
  assetAssignedCell.innerHTML = state.session.cells.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  if (assetType) assetType.innerHTML = ASSET_TYPE_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
  if (assetId) assetId.value = asset?.id || '';
  if (assetName) assetName.value = asset?.name || '';
  if (assetType) assetType.value = normalizeAssetType(asset?.type || 'patrol_vessel');
  if (assetStatus) assetStatus.value = asset?.status || 'available';
  if (assetZone) assetZone.value = asset?.zone || '';
  if (assetFuel) assetFuel.value = asset?.fuel ?? 6;
  if (assetReadiness) assetReadiness.value = asset?.readiness ?? 5;
  if (assetAssignedCell) assetAssignedCell.value = asset?.assignedCell || state.session.cells[0]?.id || '';
}

function renderInjects() {
  const el = document.getElementById('injectsPanel');
  if (!el) return;
  el.innerHTML = `<div class="small">This build is focused on facilitator authoring: start blank, place zones, place assets, and save the package as your scenario baseline.</div>`;
}

function renderTimeline() {
  const el = document.getElementById('timelinePanel');
  if (!el) return;
  el.innerHTML = `<div class="small">Use the saved package as your authored scenario baseline. Runtime turn history is not the focus of this build.</div>`;
}

function submitPlayerAction() {
  const cellId = getPlayerCell();
  const text = document.getElementById('playerAction')?.value.trim();
  if (!text) return;
  const item = { time: state.scenario.timeLabel || 'H+0', text };
  state.actionLogByCell[cellId].push(item);
  saveState();
  document.getElementById('playerAction').value = '';
  renderPlayerPage();
}

function renderPlayerPage() {
  const sel = document.getElementById('playerCellSelect');
  if (!sel) return;
  const current = getPlayerCell();
  sel.innerHTML = state.session.cells.map(c => `<option value="${c.id}" ${c.id === current ? 'selected' : ''}>${c.name}</option>`).join('');
  const cellId = getPlayerCell();
  const cell = state.session.cells.find(c => c.id === cellId);
  document.getElementById('playerScenarioPanel').innerHTML = `<div><strong>${cell?.name || 'Blue Cell'}</strong></div><div class="small">${cell?.domain || ''}</div><div class="row" style="margin-top:10px"><span class="tag">Scenario: ${state.scenario.name}</span><span class="tag">Zones: ${zoneIds().length}</span><span class="tag">Assets: ${state.assets.filter(a => a.assignedCell === cellId).length}</span></div><p><strong>Current situation</strong><br>${state.scenario.currentSituation}</p>`;
  const myAssets = state.assets.filter(a => a.assignedCell === cellId);
  document.getElementById('playerAssetsPanel').innerHTML = myAssets.length ? myAssets.map(a => `<div class="card"><strong>${a.name}</strong><div class="row"><span class="tag">${assetTypeLabel(a.type)}</span><span class="tag">${a.status}</span><span class="tag">${prettyZone(a.zone)}</span><span class="tag">Fuel ${a.fuel}</span><span class="tag">Readiness ${a.readiness}</span></div></div>`).join('') : '<div class="small">No assets assigned to this cell yet.</div>';
  const feed = state.playerFeedByCell[cellId] || [];
  document.getElementById('playerFeedPanel').innerHTML = feed.length ? feed.slice().reverse().map(f => `<div class="timeline-item"><strong>${f.time}</strong><br>${f.text}</div>`).join('') : '<div class="small">No facilitator updates yet for this cell.</div>';
  const log = state.actionLogByCell[cellId] || [];
  document.getElementById('playerActionLog').innerHTML = log.length ? log.slice().reverse().map(a => `<div class="timeline-item"><strong>${a.time}</strong><br>${a.text}</div>`).join('') : '<div class="small">No submitted actions yet.</div>';
  initMaps(true);
}

function renderAll() {
  ensureSessionMaps();
  renderScenario();
  renderTemplates();
  renderCells();
  renderZoneEditor();
  renderAssets();
  renderInjects();
  renderTimeline();
  renderPlayerPage();
}

window.selectZone = selectZone;
window.selectAsset = selectAsset;

init();
