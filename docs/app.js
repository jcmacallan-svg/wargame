const DATA_URL = './data/injects.sample.json';

const state = {
  injects: [],
  filters: {
    level: 'all',
    conflict_mode: 'all',
    domain: 'all'
  }
};

function uniqueValues(items, key) {
  return [...new Set(items.map(item => item[key]))].sort();
}

function populateSelect(id, values) {
  const select = document.getElementById(id);
  for (const value of values) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }
}

function renderCards() {
  const container = document.getElementById('cards');
  const { level, conflict_mode, domain } = state.filters;
  const filtered = state.injects.filter(item => {
    return (level === 'all' || item.level === level)
      && (conflict_mode === 'all' || item.conflict_mode === conflict_mode)
      && (domain === 'all' || item.domain === domain);
  });

  document.getElementById('resultCount').textContent = `${filtered.length} inject(s)`;
  container.innerHTML = '';

  for (const item of filtered) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="badges">
        <span class="badge">${item.id}</span>
        <span class="badge">${item.level}</span>
        <span class="badge">${item.conflict_mode}</span>
        <span class="badge">${item.domain}</span>
        <span class="badge">${item.severity}</span>
      </div>
      <h3>${item.title}</h3>
      <div class="meta">${item.phase}</div>
      <div class="section-title">Situation</div>
      <div>${item.situation}</div>
      <div class="section-title">Decision required</div>
      <div>${item.decision_required}</div>
      <div class="section-title">White cell notes</div>
      <div>${item.white_cell_notes}</div>
    `;
    container.appendChild(card);
  }
}

async function init() {
  const response = await fetch(DATA_URL);
  state.injects = await response.json();

  populateSelect('level', uniqueValues(state.injects, 'level'));
  populateSelect('conflict_mode', uniqueValues(state.injects, 'conflict_mode'));
  populateSelect('domain', uniqueValues(state.injects, 'domain'));

  ['level', 'conflict_mode', 'domain'].forEach(key => {
    const el = document.getElementById(key);
    el.addEventListener('change', () => {
      state.filters[key] = el.value;
      renderCards();
    });
  });

  renderCards();
}

init().catch(err => {
  document.getElementById('cards').innerHTML = `<div class="card">Failed to load data: ${err.message}</div>`;
});
