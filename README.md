# Open War Game Engine

**Tagline:** Non-classified modular multi-level war game generator for strategic, operational and tactical exercises.

Open War Game Engine is a non-classified, modular starter framework for designing and running multi-level wargames. It supports strategic, operational and tactical play, conflict-mode selection, NATO-style inject cards, and a static GitHub Pages demo site.

## What is included

- `docs/` — static web demo for GitHub Pages
- `data/injects.sample.json` — sample inject library
- `schemas/scenario.schema.yaml` — scenario definition schema
- `engine/generate_injects.py` — starter CLI to generate injects from a YAML scenario
- `.github/workflows/pages.yml` — GitHub Pages deployment workflow

## Quick start

### Option A — Fastest route using GitHub Pages

1. Create a new empty GitHub repository named `open-wargame-engine`.
2. Upload all files from this project to the root of that repository.
3. Push to the `main` branch.
4. In GitHub, open **Settings → Pages**.
5. Under **Build and deployment**, choose **GitHub Actions**.
6. The included workflow will publish the contents of `docs/` automatically.
7. After the workflow finishes, your site will be available at:

```text
https://YOUR-USERNAME.github.io/open-wargame-engine/
```

### Option B — Local preview before pushing

You can preview the static site locally.

#### With Python

```bash
cd docs
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Local development for the Python engine

Create a virtual environment and install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run the sample generator:

```bash
python engine/generate_injects.py --scenario scenarios/sample_scenario.yaml --output data/generated_injects.json
```

## Suggested repo growth path

### v1
- Static browser for injects
- Scenario schema
- Sample inject generator
- GitHub Pages deployment

### v2
- PDF/DOCX scenario ingestion
- NATO-style printable inject cards
- White cell control board
- Escalation ladder editor

### v3
- AI-assisted scenario drafting
- Branching adjudication support
- Red Commander module
- After Action Review generation

## Directory layout

```text
open-wargame-engine/
├── .github/
│   └── workflows/
│       └── pages.yml
├── data/
│   └── injects.sample.json
├── docs/
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── engine/
│   └── generate_injects.py
├── scenarios/
│   └── sample_scenario.yaml
├── schemas/
│   └── scenario.schema.yaml
├── requirements.txt
└── README.md
```

## Notes

- This repository is deliberately non-classified and fictional.
- It is meant as a design and prototyping framework, not as an authoritative military planning tool.
- The static web app is intentionally simple so that it runs cleanly on GitHub Pages.
