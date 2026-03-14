
const STORAGE_KEY = 'owge_v11_state';
const defaultState = {
  scenario: {
    name: "Northern Corridor Crisis",
    overview: "Blue must protect territorial waters, keep the corridor open, and prevent coercive maritime disruption while operating under time pressure.",
    turn: 1,
    timeLabel: "H+0",
    movementPressure: 0,
    timePressure: 0,
    assetPressure: 0,
    currentSituation: "Commercial confidence is weakening as irregular maritime interference rises near the corridor and port approaches."
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

function clone(obj){ return JSON.parse(JSON.stringify(obj)); }
function loadState(){ const raw = localStorage.getItem(STORAGE_KEY); if(!raw) return clone(defaultState); try { return JSON.parse(raw); } catch(e){ return clone(defaultState); } }
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function resetState(){ state = clone(defaultState); saveState(); renderAll(); }

async function init(){
  const resp = await fetch('./data/injects.json');
  injectLibrary = await resp.json();
  bindEvents();
  renderAll();
}
function bindEvents(){
  document.getElementById('resetBtn').addEventListener('click', resetState);
  document.getElementById('generatePressureBtn').addEventListener('click', generatePressure);
  document.getElementById('nextTurnBtn').addEventListener('click', nextTurn);
}
function severityValue(s){ return ({Low:1, Medium:2, High:3, Strategic:4})[s] || 1; }
function prettyZone(z){
  const m = {main_port:'Main Port', north_approach:'North Approach', corridor:'Transit Corridor', territorial_waters:'Territorial Waters', offmap:'Off-map', info_space:'Information Space'};
  return m[z] || z;
}
function setAssetAction(assetId, zone, mode){
  state.selectedActions[assetId] = {zone: zone, mode: mode};
  saveState();
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
}
function zoneCoords(zone, offset){
  const base = {main_port:{x:175,y:255}, north_approach:{x:350,y:120}, corridor:{x:430,y:290}, territorial_waters:{x:300,y:250}, offmap:{x:610,y:120}, info_space:{x:560,y:500}}[zone] || {x:430,y:290};
  return {x: base.x + ((offset % 3) * 14), y: base.y + ((offset % 4) * 12)};
}
function renderScenario(){
  const el = document.getElementById('scenarioPanel');
  el.innerHTML = '<div><strong>' + state.scenario.name + '</strong></div><div class="small">' + state.scenario.overview + '</div><div class="row" style="margin-top:10px"><span class="tag">Turn: ' + state.scenario.turn + '</span><span class="tag">Time: ' + state.scenario.timeLabel + '</span><span class="tag">Movement Pressure: ' + state.scenario.movementPressure + '</span><span class="tag">Asset Pressure: ' + state.scenario.assetPressure + '</span><span class="tag">Time Pressure: ' + state.scenario.timePressure + '</span></div><p><strong>Current situation</strong><br>' + state.scenario.currentSituation + '</p>';
}
function renderAssets(){
  const el = document.getElementById('assetsPanel');
  el.innerHTML = state.assets.map(a => {
    const sel = state.selectedActions[a.id] || {zone: a.zone, mode: 'commit'};
    return '<div class="card asset ' + a.status + '"><div><strong>' + a.name + '</strong></div><div class="row"><span class="tag">' + a.type + '</span><span class="tag">' + a.status + '</span><span class="tag">' + prettyZone(a.zone) + '</span></div><div class="row"><select id="zone-' + a.id + '">' +
      ['main_port','north_approach','corridor','territorial_waters','offmap'].map(z => '<option value="' + z + '" ' + (sel.zone===z?'selected':'') + '>' + prettyZone(z) + '</option>').join('') +
      '</select><select id="mode-' + a.id + '"><option value="commit" ' + (sel.mode==='commit'?'selected':'') + '>Commit</option><option value="hold" ' + (sel.mode==='hold'?'selected':'') + '>Hold</option><option value="delay" ' + (sel.mode==='delay'?'selected':'') + '>Delayed</option></select><button onclick="setAssetAction(\'' + a.id + '\', document.getElementById(\'zone-' + a.id + '\').value, document.getElementById(\'mode-' + a.id + '\').value)">Set</button></div></div>';
  }).join('');
}
function renderInjects(){
  const el = document.getElementById('injectsPanel');
  if(!state.releasedInjects.length){ el.innerHTML = '<div class="small">No new pressure generated yet. Commit assets and click Generate Pressure.</div>'; return; }
  el.innerHTML = state.releasedInjects.map(i => '<div class="card"><div><strong>' + i.id + '</strong> · ' + i.title + '</div><div class="row"><span class="tag">' + i.domain + '</span><span class="tag">' + i.severity + '</span><span class="tag">' + prettyZone(i.zone) + '</span></div><div>' + i.situation + '</div></div>').join('');
}
function renderMap(){
  const el = document.getElementById('mapPanel');
  const incidentDots = state.incidents.map((inc, idx) => {
    const pos = zoneCoords(inc.zone, idx);
    const color = (inc.severity==='High' || inc.severity==='Strategic') ? '#ef4444' : (inc.severity==='Medium' ? '#f59e0b' : '#facc15');
    return '<circle cx="' + pos.x + '" cy="' + pos.y + '" r="' + (5 + severityValue(inc.severity)) + '" fill="' + color + '" opacity="0.9"></circle><text x="' + (pos.x + 8) + '" y="' + (pos.y - 8) + '" class="incident-label">' + inc.title + '</text>';
  }).join('');
  const assetIcons = state.assets.map((a, idx) => {
    const pos = zoneCoords(a.zone, idx + 1);
    const symbol = a.type === 'boarding_team' ? '△' : (a.type === 'isr' ? '◌' : (a.type === 'port_cell' ? '▣' : '▲'));
    const color = a.status==='delayed' ? '#ef4444' : (a.status==='committed' ? '#60a5fa' : '#cbd5e1');
    return '<text x="' + pos.x + '" y="' + pos.y + '" font-size="18" fill="' + color + '">' + symbol + '</text><text x="' + (pos.x + 12) + '" y="' + (pos.y + 4) + '" class="asset-label">' + a.id + '</text>';
  }).join('');
  el.innerHTML = '<div class="mapwrap"><svg viewBox="0 0 760 560" width="100%" height="100%"><rect x="0" y="0" width="760" height="560" fill="#082032"></rect><path d="M0,0 L0,560 L250,560 C280,500 300,430 285,380 C270,320 300,280 320,240 C350,180 340,120 310,70 C285,30 250,10 215,0 Z" fill="#274c3a" stroke="#4b7c59" stroke-width="2"></path><path d="M210,70 C260,95 275,155 255,210 C235,265 210,315 225,380 C240,440 220,500 195,560" fill="none" stroke="#9ec5a4" stroke-width="3" opacity="0.6"></path><ellipse cx="430" cy="290" rx="115" ry="200" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="8 8" opacity="0.7"></ellipse><text x="380" y="85" class="zone-label">Transit Corridor</text><ellipse cx="300" cy="250" rx="65" ry="90" fill="none" stroke="#93c5fd" stroke-width="2" opacity="0.6"></ellipse><text x="245" y="145" class="zone-label">Territorial Waters</text><ellipse cx="350" cy="120" rx="85" ry="55" fill="none" stroke="#60a5fa" stroke-width="2" opacity="0.5"></ellipse><text x="300" y="55" class="zone-label">North Approach</text><circle cx="175" cy="255" r="9" fill="#fde68a"></circle><text x="188" y="260" class="port-label">Main Port</text><text x="540" y="40" class="zone-label">Open Sea</text><text x="560" y="520" class="zone-label">Information Space</text>' + incidentDots + assetIcons + '</svg></div><div class="legend">▲ patrol vessel · △ boarding team · ◌ ISR · ▣ coordination cell. Colored circles show incident intensity.</div>';
}
function renderTimeline(){
  const el = document.getElementById('timelinePanel');
  if(!state.timeline.length){ el.innerHTML = '<div class="small">No turns resolved yet.</div>'; return; }
  el.innerHTML = state.timeline.map(t => '<div class="timeline-item"><strong>Turn ' + t.turn + '</strong> · ' + t.time + '<br>' + t.text + '</div>').join('');
}
function renderAll(){ renderScenario(); renderAssets(); renderInjects(); renderMap(); renderTimeline(); }
init();
