
const STORAGE_KEY = 'owge_v12_state';

const ZONES = {
  main_port: {name:'Main Port', center:[54.50, 7.10], radius:12000},
  north_approach: {name:'North Approach', center:[55.03, 7.55], radius:18000},
  corridor: {name:'Transit Corridor', center:[54.86, 7.80], radius:22000},
  territorial_waters: {name:'Territorial Waters', center:[54.70, 7.43], radius:16000},
  info_space: {name:'Information Space', center:[54.95, 8.15], radius:8000},
  offmap: {name:'Off-map', center:[55.12, 8.40], radius:10000}
};

const defaultState = {
  scenario: {
    name: "Northern Corridor Crisis",
    overview: "Blue must protect territorial waters, keep the corridor open, and prevent coercive maritime disruption while operating under time pressure.",
    turn: 1,
    timeLabel: "H+0",
    movementPressure: 0,
    timePressure: 0,
    assetPressure: 0,
    currentSituation: "Commercial confidence is weakening as irregular maritime interference rises near the corridor and port approaches.",
    overlayMode: "openseamap"
  },
  assets: [
    {id:"PV-ALPHA", name:"Patrol Vessel Alpha", type:"patrol_vessel", status:"available", zone:"main_port"},
    {id:"PV-BRAVO", name:"Patrol Vessel Bravo", type:"patrol_vessel", status:"available", zone:"territorial_waters"},
    {id:"BT-1", name:"Boarding Team 1", type:"boarding_team", status:"available", zone:"main_port"},
    {id:"ISR-1", name:"ISR Support Window", type:"isr", status:"available", zone:"offmap"},
    {id:"PORT-CELL", name:"Port Coordination Cell", type:"port_cell", status:"available", zone:"main_port"}
  ],
  incidents: [
    {id:"INC-1", title:"AIS anomalies", zone:"corridor", severity:"Low"},
    {id:"INC-2", title:"Commercial concern", zone:"main_port", severity:"Low"}
  ],
  releasedInjects: [],
  selectedActions: {},
  timeline: []
};

let state = loadState();
let injectLibrary = [];
let map, baseLayer, seaLayer, zoneLayers = [], incidentLayers = [], assetLayers = [];

function clone(obj){ return JSON.parse(JSON.stringify(obj)); }
function loadState(){ const raw = localStorage.getItem(STORAGE_KEY); if(!raw) return clone(defaultState); try { return JSON.parse(raw); } catch(e){ return clone(defaultState); } }
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function resetState(){ state = clone(defaultState); saveState(); renderAll(); initMap(true); }

async function init(){
  const resp = await fetch('./data/injects.json');
  injectLibrary = await resp.json();
  bindEvents();
  renderAll();
  initMap(true);
}

function bindEvents(){
  document.getElementById('resetBtn').addEventListener('click', resetState);
  document.getElementById('generatePressureBtn').addEventListener('click', generatePressure);
  document.getElementById('nextTurnBtn').addEventListener('click', nextTurn);
  document.getElementById('overlaySelect').addEventListener('change', e => {
    state.scenario.overlayMode = e.target.value;
    saveState();
    initMap(true);
  });
}

function severityValue(s){ return ({Low:1, Medium:2, High:3, Strategic:4})[s] || 1; }
function prettyZone(z){ return (ZONES[z] && ZONES[z].name) || z; }

function setAssetAction(assetId, zone, mode){
  state.selectedActions[assetId] = {zone, mode};
  saveState();
  renderAssets();
  refreshMapMarkers();
}

function applyAssetDecisions(){
  state.assets.forEach(a => {
    const act = state.selectedActions[a.id];
    if(act){
      a.zone = act.zone;
      a.status = act.mode === 'commit' ? 'committed' : (act.mode === 'delay' ? 'delayed' : 'available');
    } else if(a.status === 'committed') {
      a.status = 'available';
    }
  });
}

function generatePressure(){
  applyAssetDecisions();
  const zonesCovered = {};
  state.assets.forEach(a => { if(a.status !== 'delayed') zonesCovered[a.zone] = (zonesCovered[a.zone] || 0) + 1; });

  let suggested = injectLibrary.filter(i => {
    if(i.zone === 'info_space') return true;
    const weak = !zonesCovered[i.zone];
    const strainedPort = i.zone === 'main_port' && (zonesCovered['main_port'] || 0) < 2;
    const corridorThin = i.zone === 'corridor' && (zonesCovered['corridor'] || 0) < 1;
    const territorialThin = i.zone === 'territorial_waters' && (zonesCovered['territorial_waters'] || 0) < 1;
    return weak || strainedPort || corridorThin || territorialThin;
  });

  suggested.sort((a,b) => severityValue(a.severity) - severityValue(b.severity));
  state.releasedInjects = suggested.slice(0, 4);

  state.scenario.movementPressure = Math.max(0, 3 - ((zonesCovered['corridor'] || 0) + (zonesCovered['territorial_waters'] || 0)));
  state.scenario.assetPressure = state.assets.filter(a => a.status !== 'available').length;
  state.scenario.timePressure = state.scenario.turn;
  saveState();
  renderAll();
  refreshMapMarkers();
}

function nextTimeLabel(turn){
  if(turn <= 4) return 'H+' + (turn - 1);
  if(turn <= 8) return 'Day ' + (turn - 4);
  return 'Week ' + (turn - 8);
}

function nextTurn(){
  applyAssetDecisions();
  const injectText = state.releasedInjects.length ? state.releasedInjects.map(i => i.situation).join(' Meanwhile, ') : 'no major new incidents materialised.';
  const assetText = state.assets.map(a => a.name + ' is ' + a.status + ' in ' + prettyZone(a.zone)).join('; ');
  const summary = 'Blue reallocated maritime assets across the battlespace. Over the next period, ' + injectText + ' Asset posture evolved as follows: ' + assetText + '. Loss of movement space, asset commitment, and time pressure now shape the next decision window.';
  state.timeline.unshift({turn: state.scenario.turn, time: state.scenario.timeLabel, text: summary});

  state.releasedInjects.forEach((inj, idx) => {
    state.incidents.push({id: 'INC-' + (state.incidents.length + idx + 1), title: inj.title, zone: inj.zone, severity: inj.severity});
  });

  state.scenario.currentSituation = summary;
  state.scenario.turn += 1;
  state.scenario.timeLabel = nextTimeLabel(state.scenario.turn);
  state.selectedActions = {};
  state.releasedInjects = [];
  saveState();
  renderAll();
  refreshMapMarkers();
}

function statusClass(value){
  if(value >= 3) return 'status-bad';
  if(value >= 1) return 'status-warn';
  return 'status-good';
}

function renderScenario(){
  const el = document.getElementById('scenarioPanel');
  el.innerHTML = `
    <div><strong>${state.scenario.name}</strong></div>
    <div class="small">${state.scenario.overview}</div>
    <div class="row" style="margin-top:10px">
      <span class="tag">Turn: ${state.scenario.turn}</span>
      <span class="tag">Time: ${state.scenario.timeLabel}</span>
      <span class="tag ${statusClass(state.scenario.movementPressure)}">Movement Pressure: ${state.scenario.movementPressure}</span>
      <span class="tag ${statusClass(state.scenario.assetPressure)}">Asset Pressure: ${state.scenario.assetPressure}</span>
      <span class="tag ${statusClass(state.scenario.timePressure)}">Time Pressure: ${state.scenario.timePressure}</span>
    </div>
    <p><strong>Current situation</strong><br>${state.scenario.currentSituation}</p>
  `;
  document.getElementById('overlaySelect').value = state.scenario.overlayMode || 'openseamap';
}

function renderAssets(){
  const el = document.getElementById('assetsPanel');
  el.innerHTML = state.assets.map(a => {
    const sel = state.selectedActions[a.id] || {zone: a.zone, mode: 'commit'};
    return `<div class="card asset ${a.status}">
      <div><strong>${a.name}</strong></div>
      <div class="row">
        <span class="tag">${a.type}</span>
        <span class="tag">${a.status}</span>
        <span class="tag">${prettyZone(a.zone)}</span>
      </div>
      <div class="row">
        <select id="zone-${a.id}">
          ${['main_port','north_approach','corridor','territorial_waters','offmap'].map(z => `<option value="${z}" ${(sel.zone===z)?'selected':''}>${prettyZone(z)}</option>`).join('')}
        </select>
        <select id="mode-${a.id}">
          <option value="commit" ${(sel.mode==='commit')?'selected':''}>Commit</option>
          <option value="hold" ${(sel.mode==='hold')?'selected':''}>Hold</option>
          <option value="delay" ${(sel.mode==='delay')?'selected':''}>Delayed</option>
        </select>
        <button onclick="setAssetAction('${a.id}', document.getElementById('zone-${a.id}').value, document.getElementById('mode-${a.id}').value)">Set</button>
      </div>
    </div>`;
  }).join('');
}

function renderInjects(){
  const el = document.getElementById('injectsPanel');
  if(!state.releasedInjects.length){
    el.innerHTML = '<div class="small">No new pressure generated yet. Commit assets and click Generate Pressure.</div>';
    return;
  }
  el.innerHTML = state.releasedInjects.map(i => `
    <div class="card">
      <div><strong>${i.id}</strong> · ${i.title}</div>
      <div class="row">
        <span class="tag">${i.domain}</span>
        <span class="tag">${i.severity}</span>
        <span class="tag">${prettyZone(i.zone)}</span>
      </div>
      <div>${i.situation}</div>
    </div>
  `).join('');
}

function renderTimeline(){
  const el = document.getElementById('timelinePanel');
  if(!state.timeline.length){
    el.innerHTML = '<div class="small">No turns resolved yet.</div>';
    return;
  }
  el.innerHTML = state.timeline.map(t => `<div class="timeline-item"><strong>Turn ${t.turn}</strong> · ${t.time}<br>${t.text}</div>`).join('');
}

function initMap(force=false){
  if(force && map){
    map.remove();
    map = null;
  }
  if(map) return;

  map = L.map('map', { zoomControl: true }).setView([54.80, 7.55], 8);

  baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 12,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  seaLayer = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
    maxZoom: 12,
    attribution: '&copy; OpenSeaMap contributors'
  });

  if((state.scenario.overlayMode || 'openseamap') === 'openseamap'){
    seaLayer.addTo(map);
  }

  renderZoneOverlays();
  refreshMapMarkers();
}

function renderZoneOverlays(){
  zoneLayers.forEach(l => map.removeLayer(l));
  zoneLayers = [];

  const colors = {
    main_port:'#fde68a',
    north_approach:'#60a5fa',
    corridor:'#38bdf8',
    territorial_waters:'#93c5fd',
    info_space:'#c084fc',
    offmap:'#64748b'
  };

  Object.keys(ZONES).forEach(key => {
    const z = ZONES[key];
    const circle = L.circle(z.center, {
      radius: z.radius,
      color: colors[key] || '#94a3b8',
      weight: 2,
      fillColor: colors[key] || '#94a3b8',
      fillOpacity: key === 'info_space' ? 0.08 : 0.04
    }).addTo(map);
    circle.bindTooltip(z.name, {permanent:false});
    zoneLayers.push(circle);
  });

  const coastPort = L.marker(ZONES.main_port.center, {title:'Main Port'}).addTo(map).bindPopup('<strong>Main Port</strong><br>Primary support and harbor node.');
  zoneLayers.push(coastPort);
}

function zoneOffsetLatLng(zone, index){
  const center = ZONES[zone] ? ZONES[zone].center : [54.86, 7.80];
  const lat = center[0] + (index % 3) * 0.03 - 0.03;
  const lon = center[1] + (index % 4) * 0.04 - 0.04;
  return [lat, lon];
}

function assetIcon(asset){
  const symbol = asset.type === 'boarding_team' ? '△' : asset.type === 'isr' ? '◌' : asset.type === 'port_cell' ? '▣' : '▲';
  const color = asset.status === 'delayed' ? '#ef4444' : asset.status === 'committed' ? '#60a5fa' : '#e5e7eb';
  return L.divIcon({
    className: '',
    html: `<div style="color:${color};font-size:20px;font-weight:700;text-shadow:0 0 2px #000">${symbol}</div>`,
    iconSize: [20,20],
    iconAnchor: [10,10]
  });
}

function incidentColor(sev){
  if(sev === 'High' || sev === 'Strategic') return '#ef4444';
  if(sev === 'Medium') return '#f59e0b';
  return '#facc15';
}

function refreshMapMarkers(){
  if(!map) return;
  incidentLayers.forEach(l => map.removeLayer(l));
  assetLayers.forEach(l => map.removeLayer(l));
  incidentLayers = [];
  assetLayers = [];

  state.incidents.forEach((inc, idx) => {
    const pos = zoneOffsetLatLng(inc.zone, idx + 1);
    const marker = L.circleMarker(pos, {
      radius: 5 + severityValue(inc.severity),
      color: incidentColor(inc.severity),
      fillColor: incidentColor(inc.severity),
      fillOpacity: 0.9,
      weight: 1
    }).addTo(map);
    marker.bindPopup(`<strong>${inc.title}</strong><br>${prettyZone(inc.zone)}<br>Severity: ${inc.severity}`);
    incidentLayers.push(marker);
  });

  state.assets.forEach((a, idx) => {
    const pos = zoneOffsetLatLng(a.zone, idx + 2);
    const marker = L.marker(pos, {icon: assetIcon(a), draggable: true, title: a.name}).addTo(map);
    marker.bindPopup(`<strong>${a.name}</strong><br>${a.type}<br>Status: ${a.status}<br>Zone: ${prettyZone(a.zone)}<br><span class="small">Drag near another zone and use the panel to confirm.</span>`);
    marker.on('dragend', function(e){
      const ll = e.target.getLatLng();
      const nearest = nearestZone(ll.lat, ll.lng);
      state.selectedActions[a.id] = {zone: nearest, mode: state.selectedActions[a.id]?.mode || 'commit'};
      saveState();
      renderAssets();
      refreshMapMarkers();
    });
    assetLayers.push(marker);
  });
}

function nearestZone(lat, lon){
  let best = 'corridor';
  let bestScore = Infinity;
  Object.keys(ZONES).forEach(key => {
    const c = ZONES[key].center;
    const score = Math.pow(lat - c[0], 2) + Math.pow(lon - c[1], 2);
    if(score < bestScore){
      bestScore = score;
      best = key;
    }
  });
  return best;
}

function renderAll(){
  renderScenario();
  renderAssets();
  renderInjects();
  renderTimeline();
}
init();
