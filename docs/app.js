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
    pinnedMapView: null,
    turnDurationHours: 1
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
let zoneLayers = [], assetLayers = [], zoneCenterLayers = [], waypointGuideLayers = [];
let playerZoneLayers = [], playerAssetLayers = [];
let lastHoveredLatLng = null;

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
  { value: 'command_element', label: 'Command Element' },
  { value: 'container_ship', label: 'Container Ship' },
  { value: 'bulk_carrier', label: 'Bulk Carrier' },
  { value: 'tanker', label: 'Tanker' },
  { value: 'lng_carrier', label: 'LNG Carrier' },
  { value: 'ro_ro_ferry', label: 'Ro-Ro Ferry' },
  { value: 'passenger_ferry', label: 'Passenger Ferry' },
  { value: 'fishing_vessel', label: 'Fishing Vessel' },
  { value: 'tug_workboat', label: 'Tug / Workboat' },
  { value: 'dredger', label: 'Dredger' },
  { value: 'pilot_boat', label: 'Pilot Boat' },
  { value: 'research_survey_vessel', label: 'Research / Survey Vessel' }
];

const ASSET_AFFILIATION_OPTIONS = [
  { value: 'friend', label: 'Friendly' },
  { value: 'assumed_friend', label: 'Assumed Friendly' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'hostile', label: 'Hostile' },
  { value: 'suspect', label: 'Suspect' },
  { value: 'unknown', label: 'Unknown' }
];

const ASSET_REPRESENTATION_OPTIONS = [
  { value: 'unit', label: 'Confirmed Unit' },
  { value: 'track', label: 'Track' }
];

const TRACK_QUALITY_OPTIONS = [
  { value: 'q1', label: 'Q1 - High confidence' },
  { value: 'q2', label: 'Q2 - Good confidence' },
  { value: 'q3', label: 'Q3 - Fair confidence' },
  { value: 'q4', label: 'Q4 - Poor confidence' },
  { value: 'q5', label: 'Q5 - Fragmentary / weak' }
];

const COMMERCIAL_ASSET_TYPES = [
  'container_ship', 'bulk_carrier', 'tanker', 'lng_carrier', 'ro_ro_ferry', 'passenger_ferry',
  'fishing_vessel', 'tug_workboat', 'dredger', 'pilot_boat', 'research_survey_vessel'
];

const COMMERCIAL_NAME_PARTS = {
  container_ship: { prefix: 'MV', nouns: ['Mercury', 'Atlas', 'Mariner', 'Horizon', 'Northstar', 'Venturer'] },
  bulk_carrier: { prefix: 'MV', nouns: ['Iron Crest', 'Blue Ore', 'Harbor Stone', 'Baltic Grain', 'Ocean Bulk'] },
  tanker: { prefix: 'MT', nouns: ['Sea Spirit', 'Silver Current', 'Ocean Pioneer', 'North Fuel', 'Blue Terminal'] },
  lng_carrier: { prefix: 'LNG', nouns: ['Arctic Flow', 'Gas Meridian', 'Polar Flame', 'Blue Vapor'] },
  ro_ro_ferry: { prefix: 'MV', nouns: ['Channel Runner', 'Sea Lift', 'Roadbridge', 'Harbor Link'] },
  passenger_ferry: { prefix: 'MV', nouns: ['Island Star', 'Sea Bridge', 'Coastal Wave', 'Port Express'] },
  fishing_vessel: { prefix: 'FV', nouns: ['North Net', 'Silver Herring', 'Deep Line', 'Morning Catch'] },
  tug_workboat: { prefix: 'TB', nouns: ['Harbor Hand', 'Dock Assist', 'Mooring One', 'Towline'] },
  dredger: { prefix: 'DV', nouns: ['Channel Maker', 'Delta Sand', 'Harbor Cut', 'Deep Cutter'] },
  pilot_boat: { prefix: 'PB', nouns: ['Pilot One', 'Harbor Pilot', 'Channel Guide', 'Approach Lead'] },
  research_survey_vessel: { prefix: 'RV', nouns: ['Ocean Quest', 'Surveyor', 'Sea Vector', 'Blue Datum'] }
};

function clone(o) { return JSON.parse(JSON.stringify(o)); }
function randomWithin(min, max) {
  const a = Number(min);
  const b = Number(max);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  return low + Math.random() * (high - low);
}
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
    affiliation: 'friend',
    representation: 'unit',
    status: 'available',
    zone: '',
    fuel: 10,
    readiness: 5,
    assignedCell: merged.session.cells[0]?.id || '',
    lat: null,
    lon: null,
    heading: 90,
    speed: 12,
    trackQuality: 'q2'
  }, a, {
    type: normalizeAssetType(a?.type),
    affiliation: normalizeAssetAffiliation(a?.affiliation),
    representation: normalizeAssetRepresentation(a?.representation || a?.classification),
    trackQuality: normalizeTrackQuality(a?.trackQuality),
    lat: normalizeCoord(a?.lat),
    lon: normalizeCoord(a?.lon),
    heading: normalizeHeading(a?.heading),
    speed: normalizeSpeed(a?.speed)
  }));
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
function assetAffiliationLabel(value) { return ASSET_AFFILIATION_OPTIONS.find(o => o.value === value)?.label || 'Friendly'; }
function normalizeAssetAffiliation(value) {
  return ASSET_AFFILIATION_OPTIONS.some(o => o.value === value) ? value : 'friend';
}
function normalizeAssetType(type) {
  const legacy = {
    isr: 'isr_drone',
    port_cell: 'port_support_unit'
  };
  return legacy[type] || (ASSET_TYPE_OPTIONS.some(o => o.value === type) ? type : 'patrol_vessel');
}

function assetRepresentationLabel(value) { return ASSET_REPRESENTATION_OPTIONS.find(o => o.value === value)?.label || 'Confirmed Unit'; }
function normalizeAssetRepresentation(value) {
  return ASSET_REPRESENTATION_OPTIONS.some(o => o.value === value) ? value : 'unit';
}

function trackQualityLabel(value) { return TRACK_QUALITY_OPTIONS.find(o => o.value === value)?.label || 'Q2 - Good confidence'; }
function trackQualityShort(value) { return (TRACK_QUALITY_OPTIONS.find(o => o.value === value)?.label || 'Q2').split(' ')[0]; }
function normalizeTrackQuality(value) { return TRACK_QUALITY_OPTIONS.some(o => o.value === value) ? value : 'q2'; }
function normalizeCoord(value) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(6)) : null;
}
function normalizeHeading(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 90;
  const h = ((n % 360) + 360) % 360;
  return Number(h.toFixed(1));
}
function normalizeSpeed(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Number(n.toFixed(1));
}


function isCommercialAssetType(type) {
  return COMMERCIAL_ASSET_TYPES.includes(normalizeAssetType(type));
}

function shouldAutoRenameAsset(name) {
  const s = String(name || '').trim();
  if (!s) return true;
  return /^(new asset|asset\s*\d+|unit\s*\d+|track\s*\d+|vessel\s*\d+)$/i.test(s);
}

function autoNameForAssetType(type, existingNames = []) {
  const normalized = normalizeAssetType(type);
  const existing = new Set((existingNames || []).map(v => String(v || '').trim()).filter(Boolean));
  if (COMMERCIAL_NAME_PARTS[normalized]) {
    const part = COMMERCIAL_NAME_PARTS[normalized];
    for (const noun of part.nouns) {
      const candidate = `${part.prefix} ${noun}`;
      if (!existing.has(candidate)) return candidate;
    }
    let i = 2;
    while (existing.has(`${part.prefix} ${assetTypeLabel(normalized)} ${i}`)) i += 1;
    return `${part.prefix} ${assetTypeLabel(normalized)} ${i}`;
  }
  const label = assetTypeLabel(normalized);
  if (!existing.has(label)) return label;
  let i = 2;
  while (existing.has(`${label} ${i}`)) i += 1;
  return `${label} ${i}`;
}

function defaultFuelForAssetType(type) {
  const normalized = normalizeAssetType(type);
  if (['maritime_helicopter', 'isr_drone', 'boarding_team', 'port_support_unit', 'command_element'].includes(normalized)) return 10;
  return 10;
}

function defaultReadinessForAssetType(type) {
  const normalized = normalizeAssetType(type);
  if (isCommercialAssetType(normalized)) return 4;
  if (['boarding_team', 'port_support_unit', 'command_element'].includes(normalized)) return 5;
  return 5;
}

function parseWaypointText(text) {
  return String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
    const parts = line.split(',');
    if (parts.length < 2) return null;
    const lat = normalizeCoord(parts[0]);
    const lon = normalizeCoord(parts[1]);
    const label = parts.slice(2).join(',').trim();
    if (lat == null || lon == null) return null;
    return { lat, lon, label };
  }).filter(Boolean);
}

function formatWaypointText(waypoints) {
  return (Array.isArray(waypoints) ? waypoints : []).map(w => `${normalizeCoord(w.lat)},${normalizeCoord(w.lon)}${w.label ? ',' + w.label : ''}`).join('\n');
}

function waypointSummary(asset) {
  const count = Array.isArray(asset?.waypoints) ? asset.waypoints.length : 0;
  if (!count) return 'No waypoints';
  const next = asset.waypoints[0];
  return `${count} WP${count === 1 ? '' : 's'}${next ? ` · next ${next.lat?.toFixed?.(3) || next.lat}, ${next.lon?.toFixed?.(3) || next.lon}` : ''}`;
}

function selectedAsset() {
  return state.assets.find(a => a.id === state.selectedAssetId) || null;
}

function appendWaypointToSelectedAsset(latlng) {
  const asset = selectedAsset();
  if (!asset) {
    alert('Select an asset first, then use Add Waypoint Mode.');
    updateWaypointUi('Select an asset first, then click Add Waypoint Mode.');
    return;
  }
  asset.waypoints = Array.isArray(asset.waypoints) ? asset.waypoints : [];
  const wp = { lat: Number(latlng.lat.toFixed(6)), lon: Number(latlng.lng.toFixed(6)), label: `WP${asset.waypoints.length + 1}` };
  asset.waypoints.push(wp);
  saveState();
  renderAll();
  initMaps(true);
  updateWaypointUi(`Added ${wp.label} at ${wp.lat.toFixed(4)}, ${wp.lon.toFixed(4)} for ${asset.name}.`);
}

function clearSelectedAssetWaypoints() {
  const asset = selectedAsset();
  if (!asset) return;
  asset.waypoints = [];
  saveState();
  updateWaypointUi(`Cleared waypoints for ${asset.name}.`);
  renderAll();
  initMaps(true);
}

function updateWaypointUi(message) {
  const el = document.getElementById('waypointStatus');
  if (!el) return;
  const asset = selectedAsset();
  const modeText = state.mapMode === 'add-waypoint' ? 'Waypoint mode is ON.' : 'Waypoint mode is OFF.';
  const assetText = asset ? ` Selected asset: ${asset.name}.` : ' Select an asset to add waypoints.';
  const hoverText = lastHoveredLatLng ? ` Cursor: ${lastHoveredLatLng.lat.toFixed(4)}, ${lastHoveredLatLng.lng.toFixed(4)}.` : '';
  el.textContent = `${message || modeText}${message ? '' : assetText}${hoverText}`;
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
    document.getElementById('generatePressureBtn').onclick = previewNextTurnMovement;
    document.getElementById('nextTurnBtn').onclick = advanceSimulationTurn;
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
    document.getElementById('addWaypointModeBtn').onclick = () => setMapMode(state.mapMode === 'add-waypoint' ? 'select' : 'add-waypoint');
    document.getElementById('clearWaypointsBtn').onclick = clearSelectedAssetWaypoints;
    document.getElementById('addAssetBtn').onclick = addAsset;
    document.getElementById('duplicateAssetBtn').onclick = duplicateSelectedAsset;
    document.getElementById('autoPopulateCommercialBtn').onclick = autoPopulateCommercialTraffic;
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
  renderAssetEditor();
  renderFacilitatorMap();
  updateWaypointUi();
}

function resetToBlankScenario() {
  state = clone(DEFAULT_STATE);
  lastHoveredLatLng = null;
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
  const turnDurationInput = document.getElementById('turnDurationHoursInput');
  state.scenario.turnDurationHours = Math.max(0.25, Math.min(24, Number(turnDurationInput?.value || state.scenario.turnDurationHours || 1) || 1));
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


function currentMapBounds() {
  if (!map) {
    const c = state.scenario?.pinnedMapView?.center || state.scenario?.lastMapView?.center || [54.8, 7.55];
    return { south: c[0] - 0.12, north: c[0] + 0.12, west: c[1] - 0.22, east: c[1] + 0.22 };
  }
  const b = map.getBounds();
  return { south: b.getSouth(), north: b.getNorth(), west: b.getWest(), east: b.getEast() };
}

function createAssetBase(type, overrides = {}) {
  const existingIds = state.assets.map(a => a.id);
  const existingNames = state.assets.map(a => a.name);
  const zone = overrides.zone != null ? overrides.zone : (state.selectedZoneId || zoneIds()[0] || '');
  const center = overrides.lat != null && overrides.lon != null
    ? [Number(overrides.lat), Number(overrides.lon)]
    : (zone && state.zones[zone] ? state.zones[zone].center : (map ? [map.getCenter().lat, map.getCenter().lng] : [54.8, 7.55]));
  const normalizedType = normalizeAssetType(type || overrides.type || 'patrol_vessel');
  return {
    id: uniqueId(`asset-${state.assets.length + 1}`, existingIds),
    name: autoNameForAssetType(normalizedType, existingNames),
    type: normalizedType,
    affiliation: normalizeAssetAffiliation(overrides.affiliation || (isCommercialAssetType(normalizedType) ? 'neutral' : 'friend')),
    representation: normalizeAssetRepresentation(overrides.representation || (isCommercialAssetType(normalizedType) ? 'track' : 'unit')),
    status: overrides.status || 'available',
    zone,
    fuel: overrides.fuel != null ? Math.max(0, Number(overrides.fuel)) : defaultFuelForAssetType(normalizedType),
    readiness: overrides.readiness != null ? Math.max(0, Number(overrides.readiness)) : defaultReadinessForAssetType(normalizedType),
    assignedCell: overrides.assignedCell || state.session.cells[0]?.id || '',
    lat: Number(Number(center[0]).toFixed(6)),
    lon: Number(Number(center[1]).toFixed(6)),
    heading: normalizeHeading(overrides.heading ?? (Math.random() * 360)),
    speed: normalizeSpeed(overrides.speed ?? (isCommercialAssetType(normalizedType) ? randomWithin(8, 18) : 12)),
    trackQuality: normalizeTrackQuality(overrides.trackQuality || (isCommercialAssetType(normalizedType) ? 'q3' : 'q2')),
    waypoints: Array.isArray(overrides.waypoints) ? clone(overrides.waypoints) : []
  };
}

function duplicateSelectedAsset() {
  const source = state.assets.find(a => a.id === state.selectedAssetId);
  if (!source) {
    alert('Select an asset to duplicate.');
    return;
  }
  const copy = createAssetBase(source.type, Object.assign({}, source, {
    lat: Number(source.lat || 0) + 0.015,
    lon: Number(source.lon || 0) + 0.02,
    waypoints: Array.isArray(source.waypoints) ? source.waypoints.map(w => Object.assign({}, w)) : []
  }));
  copy.name = isCommercialAssetType(source.type)
    ? autoNameForAssetType(source.type, state.assets.map(a => a.name))
    : `${source.name || 'Asset'} Copy`;
  state.assets.push(copy);
  state.selectedAssetId = copy.id;
  saveState();
  renderAll();
  initMaps(true);
  if (map && Number.isFinite(copy.lat) && Number.isFinite(copy.lon)) {
    map.panTo([copy.lat, copy.lon]);
  }
  alert(`Duplicated asset: ${copy.name}`);
}

function autoPopulateCommercialTraffic() {
  const bounds = currentMapBounds();
  const count = Math.max(1, Math.min(40, Number(prompt('How many commercial vessels should OWGE add?', '12')) || 12));
  const pool = COMMERCIAL_ASSET_TYPES;
  const created = [];
  for (let i = 0; i < count; i += 1) {
    const type = pool[i % pool.length];
    const lat = randomWithin(bounds.south, bounds.north);
    const lon = randomWithin(bounds.west, bounds.east);
    const asset = createAssetBase(type, {
      lat, lon,
      zone: hasZones() ? nearestZone(lat, lon) : '',
      affiliation: Math.random() < 0.7 ? 'neutral' : (Math.random() < 0.5 ? 'unknown' : 'suspect'),
      representation: Math.random() < 0.75 ? 'track' : 'unit',
      heading: randomWithin(0, 359.9),
      speed: randomWithin(type === 'pilot_boat' || type === 'tug_workboat' ? 6 : 10, type === 'container_ship' || type === 'lng_carrier' || type === 'tanker' ? 19 : 16),
      trackQuality: ['q2','q3','q4'][Math.floor(Math.random()*3)]
    });
    state.assets.push(asset);
    created.push(asset);
  }
  state.selectedAssetId = created[created.length - 1]?.id || state.selectedAssetId || '';
  saveState();
  renderAll();
  initMaps(true);
  if (map && created.length) {
    const ll = created.map(a => [a.lat, a.lon]);
    map.fitBounds(ll, { padding: [32, 32], maxZoom: Math.max(8, map.getZoom()) });
  }
  alert(`Added ${created.length} commercial vessel${created.length === 1 ? '' : 's'} to the current map view.`);
}

function onSelectedAssetTypeChanged() {
  const asset = state.assets.find(a => a.id === state.selectedAssetId);
  const typeEl = document.getElementById('assetType');
  const nameEl = document.getElementById('assetName');
  const fuelEl = document.getElementById('assetFuel');
  const readinessEl = document.getElementById('assetReadiness');
  if (!typeEl || !nameEl) return;
  const type = normalizeAssetType(typeEl.value);
  if (asset) asset.type = type;
  if (shouldAutoRenameAsset(nameEl.value)) {
    const taken = state.assets.filter(a => a.id !== state.selectedAssetId).map(a => a.name);
    nameEl.value = autoNameForAssetType(type, taken);
  }
  if (fuelEl && !String(fuelEl.value || '').trim()) fuelEl.value = defaultFuelForAssetType(type);
  if (readinessEl && !String(readinessEl.value || '').trim()) readinessEl.value = defaultReadinessForAssetType(type);
}

function addAsset() {
  const asset = createAssetBase('patrol_vessel', {
    affiliation: 'friend',
    representation: 'unit',
    heading: 90,
    speed: 12,
    trackQuality: 'q2'
  });
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
  asset.affiliation = normalizeAssetAffiliation(document.getElementById('assetAffiliation').value);
  asset.representation = normalizeAssetRepresentation(document.getElementById('assetRepresentation').value);
  asset.status = document.getElementById('assetStatus').value;
  asset.zone = document.getElementById('assetZone').value;
  asset.fuel = Math.max(0, Number(document.getElementById('assetFuel').value) || defaultFuelForAssetType(asset.type));
  asset.readiness = Math.max(0, Number(document.getElementById('assetReadiness').value) || defaultReadinessForAssetType(asset.type));
  asset.assignedCell = document.getElementById('assetAssignedCell').value;
  asset.trackQuality = normalizeTrackQuality(document.getElementById('assetTrackQuality').value);
  asset.heading = normalizeHeading(document.getElementById('assetHeading').value);
  asset.speed = normalizeSpeed(document.getElementById('assetSpeed').value);
  asset.lat = normalizeCoord(document.getElementById('assetLat').value);
  asset.lon = normalizeCoord(document.getElementById('assetLon').value);
  asset.waypoints = parseWaypointText(document.getElementById('assetWaypoints')?.value || '');
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
    command_element: 'C2',
    container_ship: 'CONT',
    bulk_carrier: 'BULK',
    tanker: 'TNKR',
    lng_carrier: 'LNG',
    ro_ro_ferry: 'RORO',
    passenger_ferry: 'FERY',
    fishing_vessel: 'FISH',
    tug_workboat: 'TUG',
    dredger: 'DRDG',
    pilot_boat: 'PILOT',
    research_survey_vessel: 'SURV'
  };
  return map[normalizeAssetType(asset.type)] || 'UNIT';
}

function assetDoctrineProfile(asset) {
  const type = normalizeAssetType(asset.type);
  const map = {
    frigate: { short: 'FFG', code: 'ESC', role: 'Escort combatant' },
    corvette: { short: 'COR', code: 'LIT', role: 'Littoral combatant' },
    patrol_vessel: { short: 'OPV', code: 'PAT', role: 'Patrol' },
    submarine: { short: 'SSK', code: 'SUB', role: 'Subsurface' },
    amphibious_ship: { short: 'AMP', code: 'AMP', role: 'Amphibious' },
    landing_craft: { short: 'LC', code: 'LND', role: 'Landing craft' },
    auxiliary_ship: { short: 'AUX', code: 'LOG', role: 'Support / logistics' },
    mine_warfare_vessel: { short: 'MCM', code: 'MIW', role: 'Mine warfare' },
    maritime_helicopter: { short: 'HEL', code: 'AIR', role: 'Maritime helicopter' },
    isr_drone: { short: 'UAV', code: 'ISR', role: 'ISR drone' },
    boarding_team: { short: 'VBSS', code: 'BDT', role: 'Boarding team' },
    port_support_unit: { short: 'PORT', code: 'SUP', role: 'Port support' },
    command_element: { short: 'C2', code: 'CMD', role: 'Command' },
    container_ship: { short: 'CONT', code: 'COM', role: 'Container shipping' },
    bulk_carrier: { short: 'BULK', code: 'COM', role: 'Bulk carrier' },
    tanker: { short: 'TNKR', code: 'COM', role: 'Tanker' },
    lng_carrier: { short: 'LNG', code: 'COM', role: 'Gas carrier' },
    ro_ro_ferry: { short: 'RORO', code: 'COM', role: 'Ro-Ro ferry' },
    passenger_ferry: { short: 'FERY', code: 'COM', role: 'Passenger ferry' },
    fishing_vessel: { short: 'FISH', code: 'COM', role: 'Fishing vessel' },
    tug_workboat: { short: 'TUG', code: 'COM', role: 'Tug / workboat' },
    dredger: { short: 'DRDG', code: 'COM', role: 'Dredger' },
    pilot_boat: { short: 'PILOT', code: 'COM', role: 'Pilot boat' },
    research_survey_vessel: { short: 'SURV', code: 'COM', role: 'Research / survey' }
  };
  return map[type] || { short: 'UNIT', code: 'GEN', role: 'General' };
}

function assetDoctrineAffiliationCode(asset) {
  const aff = normalizeAssetAffiliation(asset.affiliation);
  if (aff === 'hostile') return 'H';
  if (aff === 'neutral') return 'N';
  if (aff === 'unknown') return 'U';
  if (aff === 'suspect') return 'S';
  if (aff === 'assumed_friend') return 'A';
  return 'F';
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
  const aff = assetDoctrineAffiliationCode(asset);
  if (domain === 'subsurface') return `S${aff}UP------`;
  if (domain === 'air') return `S${aff}AP------`;
  if (domain === 'ground') return `S${aff}GP------`;
  return `S${aff}SP------`;
}

function assetDoctrineFrame(asset) {
  const domain = assetDoctrineDomain(asset);
  const aff = normalizeAssetAffiliation(asset.affiliation);
  const colorMap = {
    friend: '#60a5fa',
    hostile: '#f87171',
    neutral: '#34d399',
    unknown: '#fbbf24'
  };
  const color = colorMap[aff] || '#60a5fa';
  if (domain === 'subsurface') return { color, path: 'M6 16 Q22 4 38 16 Q22 28 6 16 Z' };
  if (domain === 'air') return { color, path: 'M22 5 L39 16 L22 27 L5 16 Z' };
  if (domain === 'ground') return { color, path: 'M5 7 H39 V25 H5 Z' };
  return { color, path: 'M5 16 Q5 5 22 5 H39 Q39 16 39 16 Q39 27 22 27 H5 Q5 16 5 16 Z' };
}

function assetNtdsPalette(asset) {
  const aff = normalizeAssetAffiliation(asset.affiliation);
  if (aff === 'hostile') return { stroke: '#fecaca', fill: '#991b1b', chip: '#7f1d1d', text: '#fee2e2' };
  if (aff === 'neutral') return { stroke: '#bbf7d0', fill: '#166534', chip: '#14532d', text: '#dcfce7' };
  if (aff === 'unknown') return { stroke: '#fde68a', fill: '#a16207', chip: '#854d0e', text: '#fef3c7' };
  if (aff === 'suspect') return { stroke: '#fed7aa', fill: '#9a3412', chip: '#7c2d12', text: '#ffedd5' };
  if (aff === 'assumed_friend') return { stroke: '#c7d2fe', fill: '#4338ca', chip: '#312e81', text: '#e0e7ff' };
  return { stroke: '#bfdbfe', fill: '#1d4ed8', chip: '#1e3a8a', text: '#dbeafe' };
}

function assetNtdsGeometry(asset) {
  const domain = assetDoctrineDomain(asset);
  if (domain === 'subsurface') {
    return {
      path: 'M8 23 C12 14, 22 10, 34 10 C46 10, 56 14, 60 23 C56 32, 46 36, 34 36 C22 36, 12 32, 8 23 Z',
      accent: 'M18 23 H50',
      accent2: 'M24 18 H44'
    };
  }
  if (domain === 'air') {
    return {
      path: 'M34 8 L60 23 L34 38 L8 23 Z',
      accent: 'M18 23 H50',
      accent2: 'M34 13 V33'
    };
  }
  if (domain === 'ground') {
    return {
      path: 'M10 10 H58 V36 H10 Z',
      accent: 'M18 23 H50',
      accent2: 'M22 16 H46'
    };
  }
  return {
    path: 'M6 24 L18 12 H50 L62 24 L50 36 H18 Z',
    accent: 'M16 24 H52',
    accent2: 'M24 18 H44'
  };
}

function buildNtdsSvg(asset, selected) {
  const profile = assetDoctrineProfile(asset);
  const palette = assetNtdsPalette(asset);
  const geo = assetNtdsGeometry(asset);
  const aff = assetDoctrineAffiliationCode(asset);
  const representation = normalizeAssetRepresentation(asset.representation);
  const outline = selected ? '#f59e0b' : '#020617';
  const mainStrokeWidth = representation === 'track' ? 2.2 : 3.2;
  const dash = representation === 'track' ? '5 3' : '0';
  const fill = representation === 'track' ? 'rgba(2,6,23,0.10)' : palette.fill;
  const label = representation === 'track' ? 'TRK' : profile.short;
  const statusText = representation === 'track' ? 'T' : 'U';
  const statusFill = representation === 'track' ? '#111827' : '#020617';
  const statusStroke = representation === 'track' ? palette.stroke : '#94a3b8';
  const qualityText = trackQualityShort(asset.trackQuality);
  return `
    <svg width="76" height="58" viewBox="0 0 68 46" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="${geo.path}" fill="${fill}" stroke="${outline}" stroke-width="${mainStrokeWidth}" stroke-linejoin="round" stroke-dasharray="${dash}" />
      <path d="${geo.path}" fill="none" stroke="${palette.stroke}" stroke-width="1.5" stroke-linejoin="round" opacity=".95" stroke-dasharray="${dash}" />
      <path d="${geo.accent}" fill="none" stroke="${palette.stroke}" stroke-width="1.8" stroke-linecap="round" opacity=".9" />
      <path d="${geo.accent2}" fill="none" stroke="${palette.stroke}" stroke-width="1.3" stroke-linecap="round" opacity=".7" />
      <text x="34" y="27" text-anchor="middle" dominant-baseline="middle" font-size="${representation === 'track' ? '8.4' : '9.6'}" font-weight="800" fill="#f8fafc" letter-spacing=".4">${label}</text>
      <rect x="52" y="3" rx="5" ry="5" width="12" height="10" fill="#020617" opacity=".82"></rect>
      <text x="58" y="10.2" text-anchor="middle" font-size="6.2" font-weight="800" fill="${palette.stroke}">${aff}</text>
      <rect x="4" y="3" rx="5" ry="5" width="12" height="10" fill="${statusFill}" stroke="${statusStroke}" stroke-width="1"></rect>
      <text x="10" y="10.2" text-anchor="middle" font-size="6.2" font-weight="800" fill="#f8fafc">${statusText}</text>
      <rect x="22" y="33" rx="6" ry="6" width="24" height="10" fill="#020617" opacity=".86" stroke="${palette.stroke}" stroke-width="1"></rect>
      <text x="34" y="40.2" text-anchor="middle" font-size="6.3" font-weight="800" fill="${palette.stroke}">${qualityText}</text>
    </svg>`;
}

function assetIcon(asset) {
  const selected = state.selectedAssetId === asset.id;
  const profile = assetDoctrineProfile(asset);
  const palette = assetNtdsPalette(asset);
  const representation = normalizeAssetRepresentation(asset.representation);
  const html = `<div class="ntds-marker-wrap ntds-${representation}"><div class="ntds-symbol-shell">${buildNtdsSvg(asset, selected)}</div><div class="ntds-asset-name" style="border-color:${palette.stroke}; background:${palette.chip}; color:${palette.text};">${asset.name}</div><div class="ntds-asset-meta">${assetRepresentationLabel(representation)} · ${profile.role} · ${assetAffiliationLabel(asset.affiliation)} · ${trackQualityShort(asset.trackQuality)}</div></div>`;
  return L.divIcon({ className: 'ntds-div-icon', html, iconSize: [118, 92], iconAnchor: [38, 30], popupAnchor: [0, -14] });
}


function assetLatLng(asset, idx) {
  const explicitLat = normalizeCoord(asset?.lat);
  const explicitLon = normalizeCoord(asset?.lon);
  if (explicitLat != null && explicitLon != null) return [explicitLat, explicitLon];
  if (asset.zone && state.zones[asset.zone]) return zoneOffsetLatLng(asset.zone, idx + 1);
  return [54.8 + (idx % 3) * 0.04, 7.2 + (idx % 4) * 0.06];
}

function distanceNmBetween(lat1, lon1, lat2, lon2) {
  const meanLat = ((lat1 + lat2) / 2) * Math.PI / 180;
  const dLatNm = (lat2 - lat1) * 60;
  const dLonNm = (lon2 - lon1) * 60 * Math.cos(meanLat);
  return Math.sqrt(dLatNm * dLatNm + dLonNm * dLonNm);
}

function bearingBetween(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.cos(((lat1 + lat2) / 2) * Math.PI / 180);
  const dLat = (lat2 - lat1);
  const angle = Math.atan2(dLon, dLat) * 180 / Math.PI;
  return normalizeHeading(angle);
}

function courseVectorLatLngs(asset, idx) {
  const origin = assetLatLng(asset, idx);
  const waypoint = Array.isArray(asset.waypoints) && asset.waypoints.length ? asset.waypoints[0] : null;
  const heading = waypoint ? bearingBetween(origin[0], origin[1], waypoint.lat, waypoint.lon) : normalizeHeading(asset.heading);
  const speed = Math.max(0, normalizeSpeed(asset.speed));
  const distanceNm = waypoint ? Math.max(1.2, Math.min(12, distanceNmBetween(origin[0], origin[1], waypoint.lat, waypoint.lon))) : Math.max(1.2, Math.min(12, speed * 0.22 + (normalizeAssetRepresentation(asset.representation) === 'track' ? 1.2 : 0)));
  return [origin, destinationLatLon(origin[0], origin[1], heading, distanceNm)];
}

function destinationLatLon(lat, lon, heading, distanceNm) {
  const radians = normalizeHeading(heading) * Math.PI / 180;
  const dLat = (distanceNm * Math.cos(radians)) / 60;
  const lonScale = Math.cos(lat * Math.PI / 180) || 0.00001;
  const dLon = (distanceNm * Math.sin(radians)) / (60 * lonScale);
  return [lat + dLat, lon + dLon];
}

function projectMovement(asset, origin, distanceNm) {
  let remaining = Math.max(0, Number(distanceNm || 0));
  let current = [origin[0], origin[1]];
  let heading = normalizeHeading(asset.heading);
  let consumedWaypoints = 0;
  const queue = Array.isArray(asset.waypoints) ? asset.waypoints.map(w => ({ lat: normalizeCoord(w.lat), lon: normalizeCoord(w.lon), label: String(w.label || '') })).filter(w => w.lat != null && w.lon != null) : [];
  while (remaining > 0 && queue.length) {
    const wp = queue[0];
    const legDistance = distanceNmBetween(current[0], current[1], wp.lat, wp.lon);
    heading = bearingBetween(current[0], current[1], wp.lat, wp.lon);
    if (legDistance <= remaining + 0.0001) {
      current = [wp.lat, wp.lon];
      remaining -= legDistance;
      queue.shift();
      consumedWaypoints += 1;
    } else {
      current = destinationLatLon(current[0], current[1], heading, remaining);
      remaining = 0;
    }
  }
  if (remaining > 0) {
    current = destinationLatLon(current[0], current[1], heading, remaining);
  }
  if (queue.length) heading = bearingBetween(current[0], current[1], queue[0].lat, queue[0].lon);
  return { destination: current, heading, remainingWaypoints: queue, consumedWaypoints };
}

function advanceTimeLabel(currentLabel, hours) {
  const match = /^H([+-])(\d+(?:\.\d+)?)$/.exec(String(currentLabel || 'H+0').trim());
  let val = 0;
  if (match) val = (match[1] === '-' ? -1 : 1) * Number(match[2] || 0);
  val += hours;
  const sign = val >= 0 ? '+' : '-';
  const abs = Math.abs(val);
  const rounded = Math.round(abs * 100) / 100;
  return `H${sign}${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded}`;
}

function movementDistanceNm(asset, hours) {
  return Math.max(0, normalizeSpeed(asset.speed)) * Math.max(0, Number(hours || 0));
}

function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, Number(t || 0)));
}

function fuelBurnRatePerHour(speed) {
  const s = Math.max(0, Number(speed || 0));
  if (s <= 0) return 0.04;
  if (s <= 10) return 0.10;
  if (s <= 18) return 0.10 + ((s - 10) / 8) * 0.04;
  if (s <= 24) return 0.14 + ((s - 18) / 6) * 0.08;
  if (s <= 30) return 0.22 + ((s - 24) / 6) * 0.08;
  return Math.min(0.45, 0.30 + ((s - 30) * 0.02));
}

function fuelProfileLabel(speed) {
  const s = Math.max(0, Number(speed || 0));
  if (s <= 0.1) return 'idle';
  if (s < 10) return 'slow / inefficient';
  if (s <= 18) return s === 18 ? 'cruise optimum' : 'economical';
  if (s <= 24) return 'fast cruise';
  if (s <= 30) return 'high speed / inefficient';
  return 'overstress';
}

function fuelPlanForTurn(asset, hours) {
  const requestedHours = Math.max(0, Number(hours || 0));
  const availableFuel = Math.max(0, Number(asset?.fuel || 0));
  const speed = Math.max(0, normalizeSpeed(asset?.speed));
  const burnRate = fuelBurnRatePerHour(speed);
  const maxHoursByFuel = burnRate > 0 ? (availableFuel / burnRate) : requestedHours;
  const effectiveHours = Math.max(0, Math.min(requestedHours, maxHoursByFuel));
  const fuelUsed = Math.min(availableFuel, burnRate * effectiveHours);
  const fuelRemaining = Math.max(0, availableFuel - fuelUsed);
  const limitedByFuel = effectiveHours + 1e-6 < requestedHours;
  return { requestedHours, effectiveHours, burnRate, fuelUsed, fuelRemaining, limitedByFuel, profile: fuelProfileLabel(speed) };
}

function movementPreviewRows() {
  const hours = Math.max(0.25, Math.min(24, Number(state.scenario.turnDurationHours || 1) || 1));
  return state.assets.map((asset, idx) => {
    const origin = assetLatLng(asset, idx);
    const fuelPlan = fuelPlanForTurn(asset, hours);
    const distanceNm = movementDistanceNm(asset, fuelPlan.effectiveHours);
    const movement = distanceNm > 0 ? projectMovement(asset, origin, distanceNm) : { destination: origin, heading: normalizeHeading(asset.heading), remainingWaypoints: Array.isArray(asset.waypoints) ? clone(asset.waypoints) : [], consumedWaypoints: 0 };
    const destination = movement.destination;
    return { asset, origin, destination, distanceNm, zone: hasZones() ? nearestZone(destination[0], destination[1]) : asset.zone || '', movement, fuelPlan };
  });
}

function previewNextTurnMovement() {
  const rows = movementPreviewRows();
  if (!rows.length) {
    alert('No assets available to preview. Add one or more assets first.');
    return;
  }
  const hours = Math.max(0.25, Math.min(24, Number(state.scenario.turnDurationHours || 1) || 1));
  const lines = rows.slice(0, 10).map(r => `${r.asset.name}: ${r.distanceNm.toFixed(1)} nm ${r.movement.consumedWaypoints ? `via ${r.movement.consumedWaypoints} WP` : `on ${normalizeHeading(r.movement.heading)}°`} to ${r.destination[0].toFixed(4)}, ${r.destination[1].toFixed(4)}${r.zone ? ` (${prettyZone(r.zone)})` : ''}${r.movement.remainingWaypoints[0] ? ` · next ${r.movement.remainingWaypoints[0].label || 'WP'}` : ''} · fuel ${r.fuelPlan.fuelUsed.toFixed(2)} used / ${r.fuelPlan.fuelRemaining.toFixed(2)} left @ ${r.fuelPlan.burnRate.toFixed(2)}/h${r.fuelPlan.limitedByFuel ? ' · fuel-limited' : ''}`);
  alert(`Movement preview for next turn (${hours}h):\n\n${lines.join('\n')}${rows.length > 10 ? `\n...and ${rows.length - 10} more asset(s)` : ''}`);
}

function advanceSimulationTurn() {
  const rows = movementPreviewRows();
  if (!rows.length) {
    alert('No assets available to move. Add one or more assets first.');
    return;
  }
  const hours = Math.max(0.25, Math.min(24, Number(state.scenario.turnDurationHours || 1) || 1));
  const moved = [];
  rows.forEach(r => {
    r.asset.lat = Number(r.destination[0].toFixed(6));
    r.asset.lon = Number(r.destination[1].toFixed(6));
    r.asset.heading = normalizeHeading(r.movement.heading);
    r.asset.waypoints = r.movement.remainingWaypoints;
    r.asset.fuel = Number(r.fuelPlan.fuelRemaining.toFixed(2));
    if (r.zone) r.asset.zone = r.zone;
    moved.push(`${r.asset.name} ${r.distanceNm.toFixed(1)} nm to ${r.destination[0].toFixed(3)}, ${r.destination[1].toFixed(3)}${r.movement.consumedWaypoints ? ` via ${r.movement.consumedWaypoints} WP` : ''} · fuel ${r.fuelPlan.fuelUsed.toFixed(2)} used / ${r.fuelPlan.fuelRemaining.toFixed(2)} left${r.fuelPlan.limitedByFuel ? ' · fuel-limited' : ''}`);
  });
  state.scenario.turn = Number(state.scenario.turn || 1) + 1;
  state.scenario.timeLabel = advanceTimeLabel(state.scenario.timeLabel, hours);
  state.timeline.push({
    time: state.scenario.timeLabel,
    text: `Resolved movement for ${rows.length} asset(s) over ${hours} hour(s). ${moved.slice(0,3).join('; ')}${moved.length > 3 ? '; ...' : ''}`
  });
  saveState();
  renderAll();
  initMaps(true);
}

function trackQualityStyle(asset) {
  const q = normalizeTrackQuality(asset.trackQuality);
  const map = {
    q1: { opacity: 0.95, weight: 3.2, dashArray: null },
    q2: { opacity: 0.85, weight: 2.8, dashArray: '8 4' },
    q3: { opacity: 0.72, weight: 2.4, dashArray: '6 5' },
    q4: { opacity: 0.6, weight: 2.1, dashArray: '4 6' },
    q5: { opacity: 0.45, weight: 1.8, dashArray: '2 7' }
  };
  return map[q] || map.q2;
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
        return;
      }
      if (state.mapMode === 'add-waypoint') {
        appendWaypointToSelectedAsset(e.latlng);
      }
    });
    map.on('mousemove', e => {
      lastHoveredLatLng = e.latlng;
      if (state.mapMode === 'add-waypoint') updateWaypointUi();
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
  clearLayers(waypointGuideLayers, map);
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
      renderFacilitatorMap();
    });
    zoneCenterLayers.push(center);
  });

  const selected = selectedAsset();
  if (selected) {
    const assetOrigin = assetLatLng(selected, state.assets.findIndex(a => a.id === selected.id));
    const wpQueue = Array.isArray(selected.waypoints) ? selected.waypoints : [];
    const points = [assetOrigin].concat(wpQueue.map(w => [normalizeCoord(w.lat), normalizeCoord(w.lon)]).filter(w => w[0] != null && w[1] != null));
    if (points.length > 1) {
      const line = L.polyline(points, { color: '#f59e0b', weight: 3, opacity: 0.9, dashArray: '6 6' }).addTo(map);
      waypointGuideLayers.push(line);
    }
    wpQueue.forEach((wp, i) => {
      if (normalizeCoord(wp.lat) == null || normalizeCoord(wp.lon) == null) return;
      const marker = L.circleMarker([normalizeCoord(wp.lat), normalizeCoord(wp.lon)], { radius: 7, color: '#f59e0b', weight: 2, fillColor: '#fff7ed', fillOpacity: 0.95 }).addTo(map);
      marker.bindTooltip(`${wp.label || `WP${i+1}`} · ${normalizeCoord(wp.lat).toFixed(4)}, ${normalizeCoord(wp.lon).toFixed(4)}`, { permanent: false });
      waypointGuideLayers.push(marker);
    });
  }

  state.assets.forEach((a, idx) => {
    const ll = assetLatLng(a, idx);
    const vector = courseVectorLatLngs(a, idx);
    const palette = assetNtdsPalette(a);
    const vectorStyle = trackQualityStyle(a);
    const vectorLine = L.polyline(vector, {
      color: palette.stroke,
      weight: vectorStyle.weight,
      opacity: vectorStyle.opacity,
      dashArray: vectorStyle.dashArray,
      lineCap: 'round'
    }).addTo(map);
    assetLayers.push(vectorLine);
    const marker = L.marker(ll, { icon: assetIcon(a), draggable: true, title: a.name }).addTo(map);
    marker.bindPopup('<strong>' + a.name + '</strong><br>Display: ' + assetRepresentationLabel(a.representation) + '<br>Type: ' + assetTypeLabel(a.type) + '<br>Affiliation: ' + assetAffiliationLabel(a.affiliation) + '<br>Track quality: ' + trackQualityLabel(a.trackQuality) + '<br>Heading: ' + normalizeHeading(a.heading) + '&deg;<br>Speed: ' + normalizeSpeed(a.speed) + ' kt<br>Fuel: ' + Number(a.fuel ?? 0).toFixed(1) + '<br>Waypoints: ' + waypointSummary(a) + '<br>Zone: ' + prettyZone(a.zone) + '<br>Cell: ' + (state.session.cells.find(c => c.id === a.assignedCell)?.name || 'Unassigned'));
    marker.on('click', (ev) => { if (ev?.originalEvent) L.DomEvent.stopPropagation(ev.originalEvent); selectAsset(a.id); });
    marker.on('dragend', e => {
      const p = e.target.getLatLng();
      a.lat = Number(p.lat.toFixed(6));
      a.lon = Number(p.lng.toFixed(6));
      if (hasZones()) a.zone = nearestZone(p.lat, p.lng);
      saveState();
      renderAll();
      initMaps(true);
      updateWaypointUi(`Moved ${a.name} to ${a.lat.toFixed(4)}, ${a.lon.toFixed(4)}.`);
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
    const ll = assetLatLng(a, idx);
    const vector = courseVectorLatLngs(a, idx);
    const palette = assetNtdsPalette(a);
    const vectorStyle = trackQualityStyle(a);
    const vectorLine = L.polyline(vector, {
      color: palette.stroke,
      weight: vectorStyle.weight,
      opacity: Math.max(0.35, vectorStyle.opacity - 0.1),
      dashArray: vectorStyle.dashArray,
      lineCap: 'round'
    }).addTo(playerMap);
    playerAssetLayers.push(vectorLine);
    const marker = L.marker(ll, { icon: assetIcon(a), title: a.name }).addTo(playerMap);
    marker.bindPopup('<strong>' + a.name + '</strong><br>Display: ' + assetRepresentationLabel(a.representation) + '<br>Type: ' + assetTypeLabel(a.type) + '<br>Affiliation: ' + assetAffiliationLabel(a.affiliation) + '<br>Track quality: ' + trackQualityLabel(a.trackQuality) + '<br>Heading: ' + normalizeHeading(a.heading) + '&deg;<br>Speed: ' + normalizeSpeed(a.speed) + ' kt<br>Fuel: ' + Number(a.fuel ?? 0).toFixed(1) + '<br>Waypoints: ' + waypointSummary(a) + '<br>Zone: ' + prettyZone(a.zone));
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
      <span class="tag">Map mode: ${state.mapMode === 'add-zone' ? 'Add zone on map click' : state.mapMode === 'add-waypoint' ? 'Add waypoint on map click' : 'Select/edit'}</span>
      <span class="tag">Overlay: ${(state.scenario.overlayMode || 'openseamap') === 'openseamap' ? 'OSM + OpenSeaMap' : 'OSM only'}</span>
      <span class="tag">Remember view: ${state.scenario.rememberLastMapView === false ? 'Off' : 'On'}</span>
      <span class="tag">Pinned view: ${pinned ? 'Set' : 'Not set'}</span>
      <span class="tag">Turn: ${state.scenario.turn || 1}</span>
      <span class="tag">Duration: ${Number(state.scenario.turnDurationHours || 1)} h</span>
    </div>
    <p><strong>Current situation</strong><br>${state.scenario.currentSituation}</p>
    <p class="small"><strong>Turn clock</strong><br>${state.scenario.timeLabel || 'H+0'} · each turn advances assets by heading/speed for ${Number(state.scenario.turnDurationHours || 1)} hour(s). Fuel burn is speed-based, with 18 kt as the most efficient cruise band.</p>
    <p class="small"><strong>Map start view</strong><br>${pinned ? `Pinned at ${pinned.center[0].toFixed(2)}, ${pinned.center[1].toFixed(2)} / zoom ${pinned.zoom}` : 'No pinned view saved.'}${remembered ? `<br>Last remembered view ${remembered.center[0].toFixed(2)}, ${remembered.center[1].toFixed(2)} / zoom ${remembered.zoom}` : ''}</p>
  `;
  const title = document.querySelector('header h1');
  if (title) title.textContent = 'Open War Game Engine v16';
  const addZoneModeBtn = document.getElementById('addZoneModeBtn');
  if (addZoneModeBtn) {
    addZoneModeBtn.textContent = state.mapMode === 'add-zone' ? 'Exit Add Zone Mode' : 'Add Zone Mode';
    addZoneModeBtn.className = state.mapMode === 'add-zone' ? 'warn' : '';
  }
  const addWaypointModeBtn = document.getElementById('addWaypointModeBtn');
  if (addWaypointModeBtn) {
    addWaypointModeBtn.textContent = state.mapMode === 'add-waypoint' ? 'Exit Waypoint Mode' : 'Add Waypoint Mode';
    addWaypointModeBtn.className = state.mapMode === 'add-waypoint' ? 'warn' : 'secondary';
  }
  updateWaypointUi();
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
  const turnDurationHoursInput = document.getElementById('turnDurationHoursInput');
  if (turnDurationHoursInput) turnDurationHoursInput.value = Number(state.scenario.turnDurationHours || 1);
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
          <span class="tag">${assetRepresentationLabel(a.representation)}</span>
          <span class="tag">${assetTypeLabel(a.type)}</span>
          <span class="tag">${assetAffiliationLabel(a.affiliation)}</span>
          <span class="tag">${trackQualityShort(a.trackQuality)}</span>
          <span class="tag">${a.status}</span>
          <span class="tag">${prettyZone(a.zone)}</span>
          <span class="tag">${normalizeHeading(a.heading)}° / ${normalizeSpeed(a.speed)} kt</span>
          <span class="tag">Fuel ${Number(a.fuel ?? 0).toFixed(1)}</span>
          <span class="tag">${waypointSummary(a)}</span>
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
  const assetAffiliation = document.getElementById('assetAffiliation');
  const assetRepresentation = document.getElementById('assetRepresentation');
  const assetStatus = document.getElementById('assetStatus');
  const assetZone = document.getElementById('assetZone');
  const assetFuel = document.getElementById('assetFuel');
  const assetReadiness = document.getElementById('assetReadiness');
  const assetAssignedCell = document.getElementById('assetAssignedCell');
  const assetTrackQuality = document.getElementById('assetTrackQuality');
  const assetHeading = document.getElementById('assetHeading');
  const assetSpeed = document.getElementById('assetSpeed');
  const assetLat = document.getElementById('assetLat');
  const assetLon = document.getElementById('assetLon');
  const assetWaypoints = document.getElementById('assetWaypoints');
  if (!assetZone || !assetAssignedCell) return;
  assetZone.innerHTML = ['<option value="">Unplaced</option>'].concat(zoneIds().map(id => `<option value="${id}">${state.zones[id].name}</option>`)).join('');
  assetAssignedCell.innerHTML = state.session.cells.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  if (assetType) assetType.innerHTML = ASSET_TYPE_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
  if (assetAffiliation) assetAffiliation.innerHTML = ASSET_AFFILIATION_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
  if (assetRepresentation) assetRepresentation.innerHTML = ASSET_REPRESENTATION_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
  if (assetTrackQuality) assetTrackQuality.innerHTML = TRACK_QUALITY_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
  if (assetId) assetId.value = asset?.id || '';
  if (assetName) assetName.value = asset?.name || '';
  if (assetType) assetType.value = normalizeAssetType(asset?.type || 'patrol_vessel');
  if (assetAffiliation) assetAffiliation.value = normalizeAssetAffiliation(asset?.affiliation || 'friend');
  if (assetRepresentation) assetRepresentation.value = normalizeAssetRepresentation(asset?.representation || 'unit');
  if (assetStatus) assetStatus.value = asset?.status || 'available';
  if (assetZone) assetZone.value = asset?.zone || '';
  if (assetFuel) { assetFuel.value = asset?.fuel ?? defaultFuelForAssetType(asset?.type); assetFuel.placeholder = 'Fuel (default 10)'; assetFuel.title = 'Fuel remaining'; }
  if (assetReadiness) { assetReadiness.value = asset?.readiness ?? defaultReadinessForAssetType(asset?.type); assetReadiness.placeholder = 'Readiness (1-5)'; assetReadiness.title = 'Operational readiness'; }
  if (assetAssignedCell) assetAssignedCell.value = asset?.assignedCell || state.session.cells[0]?.id || '';
  if (assetTrackQuality) assetTrackQuality.value = normalizeTrackQuality(asset?.trackQuality || 'q2');
  if (assetHeading) assetHeading.value = normalizeHeading(asset?.heading ?? 90);
  if (assetSpeed) assetSpeed.value = normalizeSpeed(asset?.speed ?? 12);
  if (assetLat) assetLat.value = asset?.lat ?? '';
  if (assetLon) assetLon.value = asset?.lon ?? '';
  if (assetWaypoints) assetWaypoints.value = formatWaypointText(asset?.waypoints || []);
  updateWaypointUi();
}

function renderInjects() {
  const el = document.getElementById('injectsPanel');
  if (!el) return;
  el.innerHTML = `<div class="small">This build is focused on facilitator authoring: start blank, place zones, place assets, give them waypoints if needed, and save the package as your scenario baseline.</div>`;
}

function renderTimeline() {
  const el = document.getElementById('timelinePanel');
  if (!el) return;
  if (!state.timeline.length) {
    el.innerHTML = `<div class="small">No movement turns resolved yet. Set heading/speed or add waypoints on an asset and click <strong>Resolve Turn</strong> to advance it automatically on the chart; fuel will tick down based on speed.</div>`;
    return;
  }
  el.innerHTML = state.timeline.slice().reverse().map(item => `<div class="timeline-item"><strong>${item.time || 'H+0'}</strong><br>${item.text}</div>`).join('');
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
  document.getElementById('playerScenarioPanel').innerHTML = `<div><strong>${cell?.name || 'Blue Cell'}</strong></div><div class="small">${cell?.domain || ''}</div><div class="row" style="margin-top:10px"><span class="tag">Scenario: ${state.scenario.name}</span><span class="tag">Zones: ${zoneIds().length}</span><span class="tag">Assets: ${state.assets.filter(a => a.assignedCell === cellId).length}</span><span class="tag">${state.scenario.timeLabel || 'H+0'}</span></div><p><strong>Current situation</strong><br>${state.scenario.currentSituation}</p>`;
  const myAssets = state.assets.filter(a => a.assignedCell === cellId);
  document.getElementById('playerAssetsPanel').innerHTML = myAssets.length ? myAssets.map(a => `<div class="card"><strong>${a.name}</strong><div class="row"><span class="tag">${assetRepresentationLabel(a.representation)}</span><span class="tag">${assetTypeLabel(a.type)}</span><span class="tag">${assetAffiliationLabel(a.affiliation)}</span><span class="tag">${trackQualityShort(a.trackQuality)}</span><span class="tag">${a.status}</span><span class="tag">${prettyZone(a.zone)}</span><span class="tag">${normalizeHeading(a.heading)}° / ${normalizeSpeed(a.speed)} kt</span><span class="tag">${waypointSummary(a)}</span><span class="tag">Fuel ${Number(a.fuel ?? 0).toFixed(1)}</span><span class="tag">Readiness ${a.readiness}</span></div></div>`).join('') : '<div class="small">No assets assigned to this cell yet.</div>';
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
