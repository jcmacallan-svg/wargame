# Open War Game Engine

**Non-classified modular multi-level war game generator for strategic, operational and tactical exercises.**

Open War Game Engine is a facilitator-first design tool for building, browsing, printing, and running non-classified wargame injects in a static GitHub Pages site.

## What this version includes
- 252 injects across strategic, operational, and tactical levels
- conflict packs for hybrid, peer, counterinsurgency, and grey zone play
- scenario schema for consistent design inputs
- facilitator turn system with action log
- browser-based AI Red Commander that generates adversary reactions
- print-friendly inject cards for handouts and white-cell use

## Quick start
1. Create a GitHub repository named `wargame` or `open-war-game-engine`.
2. Upload the contents of this project.
3. In GitHub, go to **Settings → Pages**.
4. Choose **Deploy from branch**.
5. Set branch to `main` and folder to `/docs`.
6. Save and wait for Pages deployment.

Your site will then appear at:

`https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`

## Local preview
From the project root:

```bash
cd docs
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Repository layout
- `docs/` static site for GitHub Pages
- `docs/data/injects.json` inject library
- `schema/scenario.schema.json` scenario schema
- `scenarios/sample_scenario.json` example scenario
- `engine/` notes for future Python-backed extensions

## Facilitator workflow
1. Load the site.
2. Set level, conflict mode, domain, and scenario preferences.
3. Start the turn system.
4. Enter Blue action summaries into the action log.
5. Use **Generate Red Response** to create a counter-move.
6. Print selected inject cards for players or white cell staff.

## How the AI Red Commander works in this release
This version uses a transparent rule-based adversary model rather than a remote AI service.
That keeps it stable on GitHub Pages and suitable for public non-classified use.

It evaluates:
- current turn
- phase/escalation stage
- level
- conflict mode
- selected domain focus
- Blue action text

It then chooses one of three outputs:
- reuse a fitting inject from the library
- escalate to a higher-stage inject in the same conflict pack
- synthesize a new Red response card from embedded doctrine rules

## Next recommended extensions
- PDF export deck builder
- scenario import from DOCX/PDF through a backend service
- saved exercises and facilitator accounts
- richer adjudication logic
- live player feed and AAR report builder