
const STORAGE_KEY = 'owge_v8_state';

const defaultState = {
  scenario: {
    name: "Northern Corridor Crisis",
    overview: "A fictional regional crisis is unfolding around a contested maritime corridor.",
    level: "operational",
    conflict_mode: "grey_zone",
    domains: ["maritime","cyber","information","logistics"],
    initial_blue_situation: "Blue naval forces are protecting territorial waters and a commercial transit corridor while authorities assess spoofing and cyber disruption.",
    turn: 1,
    escalation_stage: 1,
    current_time_label: "H+0",
    current_situation: "Blue naval forces are protecting territorial waters and a commercial transit corridor while authorities assess spoofing and cyber disruption."
  },
  latestBlueAction: "",
  latestIntent: null,
  suggestedInjects: [],
  releasedInjects: [],
  lastRedResponse: "",
  playerFeed: [],
  timeline: []
};

let state = loadState();
let injectLibrary = [];

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return JSON.parse(JSON.stringify(defaultState));
  try { return JSON.parse(raw); } catch (e) { return JSON.parse(JSON.stringify(defaultState)); }
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function resetState() {
  state = JSON.parse(JSON.stringify(defaultState));
  saveState();
  renderAll();
}
window.addEventListener('storage', function(e) {
  if (e.key === STORAGE_KEY) {
    state = loadState();
    renderAll();
  }
});

async function init() {
  const resp = await fetch('./data/injects.json');
  injectLibrary = await resp.json();
  bindEvents();
  renderAll();
}
function bindEvents() {
  const blueAction = document.getElementById('blueAction');
  if (blueAction) {
    document.getElementById('submitBlueActionBtn').addEventListener('click', submitBlueAction);
    document.getElementById('generateRedBtn').addEventListener('click', generateRedResponse);
    document.getElementById('releaseSelectedBtn').addEventListener('click', releaseSelectedInjects);
    document.getElementById('nextTurnBtn').addEventListener('click', nextTurn);
    document.getElementById('resetBtn').addEventListener('click', resetState);
  }
  const playerAction = document.getElementById('playerBlueAction');
  if (playerAction) {
    document.getElementById('playerSubmitBtn').addEventListener('click', playerSubmitBlueAction);
  }
}

function detectDomain(text) {
  const t = (text || "").toLowerCase();
  const rules = [
    ["maritime", ["ship","ships","vessel","fleet","sea","maritime","port","harbor","harbour","coast","coastal","territorial waters","shipping","chokepoint","boarding","convoy"]],
    ["air", ["air","aircraft","sortie","awacs","radar","intercept","air defense","cap","scramble","flight","flights","isr"]],
    ["land", ["land","brigade","battalion","checkpoint","infantry","artillery","patrol","border","company","reserve"]],
    ["cyber", ["cyber","network","server","malware","phishing","credentials","intrusion","patch","soc","system","systems"]],
    ["space", ["space","satellite","gps","orbital","telemetry","signal"]],
    ["information", ["media","narrative","message","messaging","disinformation","deepfake","press","social media","online clip"]],
    ["logistics", ["fuel","resupply","logistics","warehouse","transport","maintenance","inventory","pipeline","contractor"]]
  ];
  for (const pair of rules) {
    const domain = pair[0];
    const terms = pair[1];
    if (terms.some(term => t.includes(term))) return domain;
  }
  return state.scenario.domains[0] || "maritime";
}

function parseIntent(text) {
  const t = (text || "").toLowerCase();
  const primary_domain = detectDomain(text);
  let action_type = "general_action";
  let objective = "situation_management";
  let tempo = "immediate";
  let escalation_signal = "low";
  const triggers = [];

  const mapTriggers = [
    ["patrol_increase", ["increase patrol","patrol density","more ships","additional ships","visible patrols","presence"]],
    ["protect_territory", ["protect territorial waters","secure waters","protect shipping","secure shipping lanes","protect corridor","deter"]],
    ["network_isolation", ["isolate network","contain malware","disconnect system","manual fallback"]],
    ["messaging", ["public messaging","counter disinformation","press statement","public statement"]],
    ["surveillance", ["monitor","isr","surveillance","observe","track"]],
    ["reposition", ["reposition","move reserve","redeploy","shift forces"]]
  ];

  for (const row of mapTriggers) {
    const label = row[0];
    const phrases = row[1];
    if (phrases.some(p => t.includes(p))) triggers.push(label);
  }

  if (triggers.includes("patrol_increase")) action_type = "force_posture_increase";
  if (triggers.includes("network_isolation")) action_type = "containment";
  if (triggers.includes("messaging")) action_type = "strategic_communications";
  if (triggers.includes("surveillance")) action_type = "surveillance";
  if (triggers.includes("reposition")) action_type = "force_repositioning";

  if (triggers.includes("protect_territory")) objective = "territorial_protection";
  if (triggers.includes("network_isolation")) objective = "service_continuity";
  if (triggers.includes("messaging")) objective = "narrative_control";
  if (triggers.includes("surveillance")) objective = "situational_awareness";

  if (t.includes("immediately") || t.includes("urgent")) tempo = "urgent";
  if (t.includes("increase") || t.includes("deploy") || t.includes("launch") || t.includes("board")) escalation_signal = "moderate";
  if (t.includes("intercept") || t.includes("seize") || t.includes("board")) escalation_signal = "high";

  return {
    primary_domain: primary_domain,
    secondary_domain: primary_domain === "maritime" ? "information" : null,
    action_type: action_type,
    objective: objective,
    tempo: tempo,
    escalation_signal: escalation_signal,
    confidence: triggers.length ? 0.82 : 0.58,
    trigger_phrases: triggers
  };
}

function submitBlueAction() {
  const txt = document.getElementById('blueAction').value.trim();
  if (!txt) return;
  state.latestBlueAction = txt;
  state.latestIntent = parseIntent(txt);
  saveState();
  renderAll();
}
function playerSubmitBlueAction() {
  const txt = document.getElementById('playerBlueAction').value.trim();
  if (!txt) return;
  state.latestBlueAction = txt;
  state.latestIntent = parseIntent(txt);
  saveState();
  document.getElementById('playerBlueAction').value = '';
  renderAll();
}
function severityScore(sev) {
  return ({Low:1, Medium:2, High:3, Strategic:4})[sev] || 99;
}
function generateRedResponse() {
  const intent = state.latestIntent || parseIntent(state.latestBlueAction);
  state.latestIntent = intent;
  const domain = intent.primary_domain;
  let matches = injectLibrary.filter(function(i) {
    return i.domain === domain &&
      i.level === state.scenario.level &&
      (i.conflict_mode === state.scenario.conflict_mode || i.conflict_mode === "grey_zone");
  });

  matches.sort(function(a,b) { return severityScore(a.severity) - severityScore(b.severity); });
  state.suggestedInjects = matches.slice(0, 3).map(function(i) { return i.id; });

  const responses = {
    maritime: "Red increases ambiguity at sea through spoofing, irregular vessel behavior, and pressure on commercial confidence.",
    cyber: "Red increases pressure through disruption, probing, and exploitation of operational dependencies.",
    information: "Red amplifies narrative pressure, attribution uncertainty, and public doubt.",
    air: "Red tests airspace discipline and response tempo through irregular activity and sensor friction.",
    land: "Red probes local force posture, reaction speed, and escalation thresholds on the ground.",
    logistics: "Red targets continuity, throughput, and trust in sustainment systems.",
    space: "Red stresses navigation, timing, and ISR dependency through signal degradation."
  };
  state.lastRedResponse = responses[domain] || "Red applies calibrated pressure across the current battlespace.";
  saveState();
  renderAll();
}
function releaseSelectedInjects() {
  const checked = Array.from(document.querySelectorAll('input.inject-pick:checked')).map(function(x) { return x.value; });
  checked.forEach(function(id) {
    const inj = injectLibrary.find(function(x) { return x.id === id; });
    if (inj && !state.releasedInjects.includes(id)) {
      state.releasedInjects.push(id);
      if (inj.player_visible) {
        state.playerFeed.push({ turn: state.scenario.turn, time: state.scenario.current_time_label, text: inj.situation });
      }
    }
  });
  saveState();
  renderAll();
}
function advanceTime(turn) {
  if (turn <= 3) return "H+" + turn;
  if (turn <= 7) return "Day " + (turn - 2);
  return "Week " + (turn - 6);
}
function nextTurn() {
  const visibleInjects = state.releasedInjects.map(function(id) {
    return injectLibrary.find(function(x) { return x.id === id; });
  }).filter(Boolean);

  const injectSummary = visibleInjects.length
    ? visibleInjects.map(function(i) { return i.situation; }).join(" Meanwhile, ")
    : "No additional incidents were released during this period.";

  const summary = "Blue executed its action. Over the next period, " + injectSummary + " Meanwhile, Red maintained pressure consistent with the current scenario. The operating picture evolved and requires renewed assessment.";
  state.timeline.push({ turn: state.scenario.turn, time: state.scenario.current_time_label, text: summary });
  state.scenario.current_situation = summary;
  state.scenario.turn += 1;
  if (state.scenario.turn % 3 === 0) state.scenario.escalation_stage += 1;
  state.scenario.current_time_label = advanceTime(state.scenario.turn);

  state.latestBlueAction = "";
  state.latestIntent = null;
  state.suggestedInjects = [];
  state.releasedInjects = [];
  state.lastRedResponse = "";
  saveState();
  renderAll();
}

function renderScenario() {
  const el = document.getElementById('scenarioPanel');
  if (!el) return;
  const s = state.scenario;
  el.innerHTML =
    '<div class="kv"><strong>' + s.name + '</strong></div>' +
    '<div class="small">' + s.overview + '</div>' +
    '<div class="row" style="margin-top:10px">' +
      '<span class="tag">Level: ' + s.level + '</span>' +
      '<span class="tag">Conflict: ' + s.conflict_mode + '</span>' +
      '<span class="tag">Turn: ' + s.turn + '</span>' +
      '<span class="tag">Escalation: ' + s.escalation_stage + '</span>' +
      '<span class="tag">Time: ' + s.current_time_label + '</span>' +
    '</div>' +
    '<p><strong>Current situation</strong><br>' + s.current_situation + '</p>';
}
function renderIntent() {
  const el = document.getElementById('intentPanel');
  if (!el) return;
  if (!state.latestIntent) {
    el.innerHTML = '<div class="small">No Blue action parsed yet.</div>';
    return;
  }
  const i = state.latestIntent;
  el.innerHTML =
    '<div class="row">' +
      '<span class="tag">Primary: ' + i.primary_domain + '</span>' +
      '<span class="tag">Action: ' + i.action_type + '</span>' +
      '<span class="tag">Objective: ' + i.objective + '</span>' +
      '<span class="tag">Tempo: ' + i.tempo + '</span>' +
      '<span class="tag">Escalation: ' + i.escalation_signal + '</span>' +
      '<span class="tag">Confidence: ' + i.confidence + '</span>' +
    '</div>' +
    '<div class="small">Trigger phrases: ' + (i.trigger_phrases.length ? i.trigger_phrases.join(', ') : 'none strongly matched') + '</div>';
}
function renderSuggestedInjects() {
  const el = document.getElementById('suggestedInjects');
  if (!el) return;
  if (!state.suggestedInjects.length) {
    el.innerHTML = '<div class="small">No inject suggestions yet.</div>';
    return;
  }
  const html = state.suggestedInjects.map(function(id) {
    const inj = injectLibrary.find(function(x) { return x.id === id; });
    if (!inj) return '';
    return '<label class="card">' +
      '<input class="inject-pick" type="checkbox" value="' + inj.id + '">' +
      '<div><strong>' + inj.id + '</strong> · ' + inj.title + '</div>' +
      '<div class="row">' +
      '<span class="tag">' + inj.domain + '</span>' +
      '<span class="tag">' + inj.severity + '</span>' +
      '</div>' +
      '<div>' + inj.situation + '</div>' +
      '<div class="small">Decision required: ' + inj.decision_required + '</div>' +
      '</label>';
  }).join('');
  el.innerHTML = html;
}
function renderRedResponse() {
  const el = document.getElementById('redResponse');
  if (!el) return;
  el.textContent = state.lastRedResponse || 'No Red response generated yet.';
}
function renderTimeline() {
  const el = document.getElementById('timeline');
  if (!el) return;
  if (!state.timeline.length) {
    el.innerHTML = '<div class="small">No timeline entries yet.</div>';
    return;
  }
  el.innerHTML = state.timeline.map(function(item) {
    return '<div class="card"><div><strong>Turn ' + item.turn + '</strong> · ' + item.time + '</div><div>' + item.text + '</div></div>';
  }).join('');
}
function renderFacilitatorBlueAction() {
  const el = document.getElementById('currentBlueAction');
  if (!el) return;
  el.textContent = state.latestBlueAction || 'No Blue action submitted yet.';
}
function renderPlayerPage() {
  const scenario = document.getElementById('playerScenario');
  const feed = document.getElementById('playerFeed');
  const latest = document.getElementById('playerLatest');
  if (scenario) {
    const s = state.scenario;
    scenario.innerHTML =
      '<div><strong>' + s.name + '</strong></div>' +
      '<div class="small">' + s.overview + '</div>' +
      '<div class="row" style="margin-top:10px">' +
      '<span class="tag">Turn: ' + s.turn + '</span>' +
      '<span class="tag">Time: ' + s.current_time_label + '</span>' +
      '</div>' +
      '<p><strong>Current situation</strong><br>' + s.current_situation + '</p>';
  }
  if (latest) latest.textContent = state.latestBlueAction || 'No Blue action submitted yet.';
  if (feed) {
    if (!state.playerFeed.length) {
      feed.innerHTML = '<div class="small">No player-visible injects released yet.</div>';
    } else {
      feed.innerHTML = state.playerFeed.map(function(item) {
        return '<div class="card"><div><strong>Turn ' + item.turn + '</strong> · ' + item.time + '</div><div>' + item.text + '</div></div>';
      }).join('');
    }
  }
}
function renderAll() {
  renderScenario();
  renderIntent();
  renderSuggestedInjects();
  renderRedResponse();
  renderTimeline();
  renderFacilitatorBlueAction();
  renderPlayerPage();
}
init();
