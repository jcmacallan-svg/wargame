
const STORAGE_KEY = 'owge_v10_state';
const defaultState = {
  scenario: {
    name: "Northern Corridor Crisis",
    overview: "A fictional regional crisis is unfolding around a contested maritime corridor. Blue is tasked with protecting territorial waters, maintaining shipping confidence, and preventing coercive disruption below open conflict.",
    level: "operational",
    conflict_mode: "grey_zone",
    domains: ["maritime","information","cyber","logistics"],
    initial_blue_situation: "Blue maritime forces are present in and around territorial waters while irregular interference, traffic ambiguity, and commercial concern rise around the corridor.",
    turn: 1,
    escalation_stage: 1,
    current_time_label: "H+0",
    current_situation: "Blue maritime forces are present in and around territorial waters while irregular interference, traffic ambiguity, and commercial concern rise around the corridor."
  },
  session: {
    session_name: "Maritime Test Session",
    cells: [
      {"id":"blue-maritime","name":"Blue Maritime","domain":"maritime","role_type":"blue"},
      {"id":"blue-port","name":"Blue Port Authority","domain":"logistics","role_type":"blue"}
    ]
  },
  cellActions: {},
  latestIntentByCell: {},
  suggestedInjects: [],
  releasedInjects: [],
  redResponse: "",
  playerFeeds: {},
  timeline: []
};
let state = loadState();
let injectLibrary = [];
function deepClone(obj){ return JSON.parse(JSON.stringify(obj)); }
function loadState(){ const raw = localStorage.getItem(STORAGE_KEY); if(!raw) return deepClone(defaultState); try { return JSON.parse(raw); } catch(e){ return deepClone(defaultState); } }
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function resetState(){ state = deepClone(defaultState); saveState(); renderAll(); }
window.addEventListener('storage', function(e){ if(e.key===STORAGE_KEY){ state = loadState(); renderAll(); } });
function getCellFromQuery(){ const params = new URLSearchParams(window.location.search); return params.get('cell'); }
function ensureMaps(){ state.session.cells.forEach(c => { if(!state.playerFeeds[c.id]) state.playerFeeds[c.id]=[]; if(!state.cellActions[c.id]) state.cellActions[c.id]=[]; }); }
async function init(){ const resp = await fetch('./data/injects.json'); injectLibrary = await resp.json(); ensureMaps(); bindEvents(); renderAll(); }
function bindEvents(){
  if(document.getElementById('addCellBtn')){
    document.getElementById('addCellBtn').addEventListener('click', function(){ addCellRow(); });
    document.getElementById('saveSetupBtn').addEventListener('click', saveSetup);
    document.getElementById('generateRedBtn').addEventListener('click', generateRedResponse);
    document.getElementById('releaseSelectedBtn').addEventListener('click', releaseSelectedInjects);
    document.getElementById('nextTurnBtn').addEventListener('click', nextTurn);
    document.getElementById('resetBtn').addEventListener('click', resetState);
  }
  if(document.getElementById('playerSubmitBtn')) document.getElementById('playerSubmitBtn').addEventListener('click', playerSubmitBlueAction);
  if(document.getElementById('playerCellSelect')) document.getElementById('playerCellSelect').addEventListener('change', renderPlayerPage);
}
function detectDomain(text){
  const t = (text||"").toLowerCase();
  const rules = [
    ["maritime", ["ship","ships","vessel","fleet","sea","maritime","port","harbor","harbour","territorial waters","shipping","chokepoint","boarding","escort","patrol","corridor"]],
    ["information", ["media","narrative","messaging","disinformation","deepfake","press","social media"]],
    ["cyber", ["cyber","network","server","malware","intrusion","system","systems","digital"]],
    ["logistics", ["fuel","resupply","logistics","warehouse","transport","inventory","berth","port access","manifest"]],
    ["air", ["air","aircraft","sortie","radar","isr","flight"]]
  ];
  for(let i=0;i<rules.length;i++){ if(rules[i][1].some(term => t.includes(term))) return rules[i][0]; }
  return 'maritime';
}
function parseIntent(text, fallbackDomain){
  const t = (text||"").toLowerCase();
  const primary_domain = detectDomain(text) || fallbackDomain || "maritime";
  let action_type = "general_action";
  let objective = "situation_management";
  let tempo = "immediate";
  let escalation_signal = "low";
  const triggers = [];
  const rules = [
    ["force_posture_increase", ["increase patrol","patrol density","additional ships","increase presence","escort","deploy additional","surge patrol"]],
    ["territorial_protection", ["protect territorial waters","secure waters","protect shipping","secure shipping lanes","protect corridor","reassure commerce"]],
    ["boarding_or_interdiction", ["board","interdict","inspect vessel","hail and board"]],
    ["deconfliction", ["reroute traffic","issue advisory","deconflict","navigation advisory"]],
    ["containment", ["manual fallback","isolate system","reduce throughput","fallback procedures"]],
    ["surveillance", ["monitor","observe","track","shadow","surveillance"]]
  ];
  for(let i=0;i<rules.length;i++){ if(rules[i][1].some(p => t.includes(p))) triggers.push(rules[i][0]); }
  if(triggers.includes("force_posture_increase")) action_type = "force_posture_increase";
  if(triggers.includes("boarding_or_interdiction")) action_type = "boarding_or_interdiction";
  if(triggers.includes("deconfliction")) action_type = "deconfliction";
  if(triggers.includes("containment")) action_type = "containment";
  if(triggers.includes("surveillance")) action_type = "surveillance";
  if(triggers.includes("territorial_protection")) objective = "territorial_protection";
  if(triggers.includes("containment")) objective = "continuity_of_operations";
  if(triggers.includes("surveillance")) objective = "situational_awareness";
  if(t.includes("immediately") || t.includes("urgent")) tempo = "urgent";
  if(t.includes("increase") || t.includes("deploy") || t.includes("escort") || t.includes("board")) escalation_signal = "moderate";
  if(t.includes("interdict") || t.includes("detain") || t.includes("seize")) escalation_signal = "high";
  return { primary_domain, action_type, objective, tempo, escalation_signal, confidence: triggers.length?0.84:0.60, trigger_phrases: triggers };
}
function addCellRow(cell){
  const container = document.getElementById('cellsEditor'); if(!container) return;
  const c = cell || {id:"", name:"", domain:"maritime", role_type:"blue"};
  const row = document.createElement('div');
  row.className = 'card cell-row';
  row.innerHTML = '<div class="grid3">'+
    '<div><label>Cell name</label><input type="text" class="cell-name" value="'+c.name+'"></div>'+
    '<div><label>Cell domain</label><select class="cell-domain">'+
    ["maritime","logistics","information","cyber","air"].map(d => '<option value="'+d+'" '+(c.domain===d?'selected':'')+'>'+d+'</option>').join('')+
    '</select></div>'+
    '<div><label>Role type</label><select class="cell-role"><option value="blue" selected>blue</option></select></div>'+
    '</div><button class="secondary remove-cell-btn" type="button">Remove Cell</button>';
  container.appendChild(row);
  row.querySelector('.remove-cell-btn').addEventListener('click', function(){ row.remove(); });
}
function slugify(s){ return (s||"").toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function saveSetup(){
  const rows = Array.from(document.querySelectorAll('.cell-row'));
  const cells = rows.map((row, idx) => {
    const name = row.querySelector('.cell-name').value.trim() || ('Blue Cell '+(idx+1));
    return { id: slugify(name) || ('blue-cell-'+(idx+1)), name: name, domain: row.querySelector('.cell-domain').value, role_type: 'blue' };
  });
  state.session.session_name = document.getElementById('sessionName').value.trim() || "Maritime Test Session";
  state.session.cells = cells;
  ensureMaps();
  saveState();
  renderAll();
}
function playerSubmitBlueAction(){
  const cellId = getActivePlayerCellId();
  const txt = document.getElementById('playerBlueAction').value.trim();
  if(!cellId || !txt) return;
  const cell = state.session.cells.find(c => c.id===cellId);
  const intent = parseIntent(txt, cell ? cell.domain : null);
  state.cellActions[cellId] = state.cellActions[cellId] || [];
  state.cellActions[cellId].push({ turn: state.scenario.turn, time: state.scenario.current_time_label, text: txt, submitted_by: cellId });
  state.latestIntentByCell[cellId] = intent;
  saveState();
  document.getElementById('playerBlueAction').value = '';
  renderAll();
}
function aggregateBlueActionSummary(){
  const entries = state.session.cells.map(c => {
    const actions = state.cellActions[c.id] || [];
    const last = actions.length ? actions[actions.length - 1] : null;
    if(!last || last.turn !== state.scenario.turn) return null;
    return c.name + ' acted in the ' + c.domain + ' domain.';
  }).filter(Boolean);
  return entries.length ? entries.join(' ') : 'No Blue cell actions submitted this turn.';
}
function collectDomainsThisTurn(){
  const domains = [];
  state.session.cells.forEach(c => {
    const actions = state.cellActions[c.id] || [];
    const last = actions.length ? actions[actions.length - 1] : null;
    if(last && last.turn === state.scenario.turn){
      const intent = state.latestIntentByCell[c.id];
      const d = (intent && intent.primary_domain) || c.domain;
      if(domains.indexOf(d)===-1) domains.push(d);
    }
  });
  return domains;
}
function severityScore(sev){ return ({Low:1, Medium:2, High:3, Strategic:4})[sev] || 99; }
function generateRedResponse(){
  const domains = collectDomainsThisTurn();
  const effectiveDomains = domains.length ? domains : ['maritime'];
  let matches = injectLibrary.filter(i => effectiveDomains.includes(i.domain) && i.level===state.scenario.level && (i.conflict_mode===state.scenario.conflict_mode || i.conflict_mode==='grey_zone'));
  matches.sort((a,b) => severityScore(a.severity)-severityScore(b.severity));
  state.suggestedInjects = matches.slice(0, 8).map(i => i.id);
  const hintText = Object.values(state.latestIntentByCell).map(i => i ? i.action_type : null).filter(Boolean).join(', ') || 'general maritime activity';
  state.redResponse = 'Red assesses Blue activity as ' + hintText + '. It responds with calibrated maritime counter-pressure, beginning with ambiguity and commercial friction before moving toward coercive disruption if Blue increases tempo or visibility.';
  saveState();
  renderAll();
}
function releaseSelectedInjects(){
  const checkedInjects = Array.from(document.querySelectorAll('input.inject-pick:checked')).map(x => x.value);
  const selectedCells = Array.from(document.querySelectorAll('input.cell-pick:checked')).map(x => x.value);
  checkedInjects.forEach(id => {
    const inj = injectLibrary.find(x => x.id===id);
    if(!inj) return;
    if(state.releasedInjects.indexOf(id)===-1) state.releasedInjects.push(id);
    const targets = selectedCells.length ? selectedCells : state.session.cells.map(c => c.id);
    targets.forEach(cellId => {
      state.playerFeeds[cellId] = state.playerFeeds[cellId] || [];
      state.playerFeeds[cellId].push({ turn: state.scenario.turn, time: state.scenario.current_time_label, inject_id: inj.id, text: inj.situation });
    });
  });
  saveState();
  renderAll();
}
function advanceTime(turn){ if(turn<=3) return 'H+'+turn; if(turn<=7) return 'Day '+(turn-2); return 'Week '+(turn-6); }
function nextTurn(){
  const injectTexts = state.releasedInjects.map(id => { const inj = injectLibrary.find(x => x.id===id); return inj ? inj.situation : null; }).filter(Boolean);
  const summary = aggregateBlueActionSummary() + ' Over the next period, ' + (injectTexts.length ? injectTexts.join(' Meanwhile, ') : 'no additional maritime incidents were released.') + ' Meanwhile, Red maintained pressure across the corridor and shaped conditions for follow-on coercive moves. The operating picture evolved and requires renewed assessment.';
  state.timeline.push({ turn: state.scenario.turn, time: state.scenario.current_time_label, text: summary });
  state.scenario.current_situation = summary;
  state.scenario.turn += 1;
  if(state.scenario.turn % 3 === 0) state.scenario.escalation_stage += 1;
  state.scenario.current_time_label = advanceTime(state.scenario.turn);
  state.suggestedInjects = [];
  state.releasedInjects = [];
  state.redResponse = "";
  saveState();
  renderAll();
}
function renderScenario(){
  const el = document.getElementById('scenarioPanel'); if(!el) return;
  const s = state.scenario;
  el.innerHTML = '<div><strong>'+s.name+'</strong></div><div class="small">'+s.overview+'</div><div class="row" style="margin-top:10px"><span class="tag">Turn: '+s.turn+'</span><span class="tag">Time: '+s.current_time_label+'</span><span class="tag">Escalation: '+s.escalation_stage+'</span><span class="tag">Level: '+s.level+'</span><span class="tag">Conflict: '+s.conflict_mode+'</span></div><p><strong>Current situation</strong><br>'+s.current_situation+'</p>';
}
function renderSetup(){
  const input = document.getElementById('sessionName');
  const editor = document.getElementById('cellsEditor');
  const links = document.getElementById('playerLinks');
  if(!input || !editor || !links) return;
  input.value = state.session.session_name || "Maritime Test Session";
  editor.innerHTML = '';
  state.session.cells.forEach(c => addCellRow(c));
  links.innerHTML = state.session.cells.map(c => '<div class="linkbox"><strong>'+c.name+'</strong><br>'+window.location.origin+window.location.pathname.replace('index.html','player.html')+'?cell='+encodeURIComponent(c.id)+'</div>').join('');
}
function renderCellActions(){
  const el = document.getElementById('cellActionsPanel'); if(!el) return;
  el.innerHTML = state.session.cells.map(c => {
    const actions = state.cellActions[c.id] || [];
    const last = actions.length ? actions[actions.length - 1] : null;
    const intent = state.latestIntentByCell[c.id];
    return '<div class="card"><div><strong>'+c.name+'</strong></div><div class="row"><span class="tag">'+c.domain+'</span><span class="tag">'+c.id+'</span></div><div>'+(last ? last.text : '<span class="small">No action submitted yet.</span>')+'</div>'+(intent ? '<div class="small" style="margin-top:8px">Intent: '+intent.action_type+' · '+intent.objective+' · '+intent.primary_domain+'</div>' : '')+'</div>';
  }).join('');
  document.getElementById('aggregateBlueSummary').textContent = aggregateBlueActionSummary();
}
function renderSuggestedInjects(){
  const el = document.getElementById('suggestedInjects');
  const audience = document.getElementById('injectAudience');
  if(!el || !audience) return;
  if(!state.suggestedInjects.length) el.innerHTML = '<div class="small">No inject suggestions yet.</div>';
  else el.innerHTML = state.suggestedInjects.map(id => {
    const inj = injectLibrary.find(x => x.id===id);
    if(!inj) return '';
    return '<label class="card"><input class="inject-pick" type="checkbox" value="'+inj.id+'"><div><strong>'+inj.id+'</strong> · '+inj.title+'</div><div class="row"><span class="tag">'+inj.domain+'</span><span class="tag">'+inj.severity+'</span></div><div>'+inj.situation+'</div><div class="small">Decision required: '+inj.decision_required+'</div></label>';
  }).join('');
  audience.innerHTML = '<div class="small">Select audience (leave empty = all cells)</div>' + state.session.cells.map(c => '<label class="tag"><input class="cell-pick" type="checkbox" value="'+c.id+'"> '+c.name+'</label>').join(' ');
}
function renderRedResponse(){ const el = document.getElementById('redResponse'); if(el) el.textContent = state.redResponse || 'No Red response generated yet.'; }
function renderTimeline(){
  const el = document.getElementById('timeline'); if(!el) return;
  if(!state.timeline.length){ el.innerHTML = '<div class="small">No timeline entries yet.</div>'; return; }
  el.innerHTML = state.timeline.map(t => '<div class="card"><div><strong>Turn '+t.turn+'</strong> · '+t.time+'</div><div>'+t.text+'</div></div>').join('');
}
function getActivePlayerCellId(){ const q = getCellFromQuery(); if(q) return q; const sel = document.getElementById('playerCellSelect'); return sel ? sel.value : null; }
function renderPlayerPage(){
  const cellSelect = document.getElementById('playerCellSelect');
  const scenario = document.getElementById('playerScenario');
  const feed = document.getElementById('playerFeed');
  const playerMeta = document.getElementById('playerMeta');
  if(!scenario) return;
  if(cellSelect){
    const current = getCellFromQuery() || cellSelect.value || (state.session.cells[0] && state.session.cells[0].id);
    cellSelect.innerHTML = state.session.cells.map(c => '<option value="'+c.id+'" '+(c.id===current?'selected':'')+'>'+c.name+'</option>').join('');
  }
  const cellId = getActivePlayerCellId() || (state.session.cells[0] && state.session.cells[0].id);
  const cell = state.session.cells.find(c => c.id===cellId);
  if(playerMeta) playerMeta.innerHTML = cell ? '<span class="tag">'+cell.name+'</span><span class="tag">'+cell.domain+'</span>' : '<span class="small">No active cell selected.</span>';
  const s = state.scenario;
  scenario.innerHTML = '<div><strong>'+s.name+'</strong></div><div class="small">'+s.overview+'</div><div class="row" style="margin-top:10px"><span class="tag">Turn: '+s.turn+'</span><span class="tag">Time: '+s.current_time_label+'</span></div><p><strong>Current situation</strong><br>'+s.current_situation+'</p>';
  const items = state.playerFeeds[cellId] || [];
  if(!items.length) feed.innerHTML = '<div class="small">No player-visible injects released yet for this cell.</div>';
  else feed.innerHTML = items.map(item => '<div class="card"><div><strong>Turn '+item.turn+'</strong> · '+item.time+'</div><div>'+item.text+'</div></div>').join('');
}
function renderAll(){ ensureMaps(); renderScenario(); renderSetup(); renderCellActions(); renderSuggestedInjects(); renderRedResponse(); renderTimeline(); renderPlayerPage(); }
init();
