# Open War Game Engine v5

**Open War Game Engine**  
Non-classified modular multi-level war game generator for strategic, operational and tactical exercises.

## What changed in v5
This is a full working package focused on facilitators.

- 252 injects in the library
- Scenario editor in the browser
- Random scenario generator
- Upload and download scenario JSON
- Turn system with escalation stage progression
- Bilingual UI (English / Nederlands)
- AI Red Commander v1 doctrine model
- Print-friendly released inject cards
- GitHub Pages ready static site

## Repo structure

```text
open-war-game-engine-v5/
├── docs/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── data/
│   │   └── injects.json
│   └── i18n/
│       ├── en.js
│       └── nl.js
├── schema/
│   └── scenario.schema.json
└── scenarios/
    └── sample_scenario.json
```

## Run locally

From the repo root:

```bash
cd docs
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000
```

## Deploy to GitHub Pages

1. Create or open your GitHub repository.
2. Upload the contents of this zip to the root of the repo.
3. In GitHub go to **Settings → Pages**.
4. Set:
   - **Source:** Deploy from branch
   - **Branch:** `main`
   - **Folder:** `/docs`
5. Save.

Your site will appear at:

```text
https://YOUR-USERNAME.github.io/YOUR-REPO/
```

## How to use

1. Open the site.
2. Create a scenario in the Scenario Editor, or click **Generate Random Scenario**.
3. Enter a Blue action.
4. Click **Generate Red Response**.
5. Review the recommended inject and release it to the facilitator deck if needed.
6. Use **Next Turn** to progress the scenario and escalation stage.
7. Use **Print released cards** to print the released injects.

## Scenario JSON format

See `schema/scenario.schema.json` for the expected structure.

A sample is provided in `scenarios/sample_scenario.json`.

## Notes

- The Red Commander in v5 is rule-based and transparent by design.
- It uses scenario level, conflict mode, doctrine profile, escalation stage, and domain detection from the Blue action.
- This keeps the site stable on GitHub Pages without requiring a backend.
