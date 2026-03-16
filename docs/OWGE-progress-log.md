# OWGE voortgangslogboek

## Actueel
- Focus: symbology / icoontjes
- Laatste wijziging: volledige symbology-pass op commerciële iconen, APP-6-achtige render, en shell/background cleanup

## Gedaan
- Commercial / AIS icon route vervangen door werkbare vessel icons
- Donkere/transparante shell verwijderd voor APP-6, Minimal en Vessel Icons
- APP-6 renderroute losgetrokken van vaste friendly-affiliation
- Affiliation-mapping uitgebreid met assumed friend en suspect
- Symbol-label in UI aangepast naar Vessel Icons

## Nog open
- Definitieve fine-tuning van commerciële silhouettes per type
- Eventueel APP-6 verder richting formele SIDC-gedreven rendering
- Refactor van docs/app.js
- Verdere player/facilitator UX-polish
- Later backend-ready session model

## Beslissingen
- Eerst werkbare, stabiele symbology boven perfecte doctrinaire volledigheid
- Geen donkere achtergrondplaat achter niet-NTDS symbolen

## Volgende logische stap
- Visuele review op kaart en daarna gerichte polish van specifieke scheepstypes of APP-6 details


## Update 2026-03-16 — Boarding + player/facilitator page split
- Boarding requests now only work within 2.00 nm.
- A valid boarding request forces both involved vessels to 0 kt for the next turn.
- Player Scenario and Facilitator Scenario are now separate pages with nav buttons.
- Player Map left pane no longer shows cell/scenario; it starts with Assigned Assets and Orders.
- Player heading/speed controls are now dropdowns; waypoint text is hidden but waypoint buttons remain.
- Contact classification panel now explains affiliation / representation / track quality and is constrained to the pane width.


## Update — Facilitator visibility and turn badge
- Fixed: player order saves now write a clear facilitator-facing log entry with heading, speed, and waypoint summary.
- Fixed: global turn/time badge now renders in the header at top right across facilitator and player pages.
- Note: facilitator map still only shows waypoint lines for the currently selected asset on the map itself; the new log makes Blue cell orders visible even when that asset is not selected.

## Latest update

- Measuring tool toegevoegd als zichtbare map-overlay control op facilitator- en playermap; klik Start, kies startpunt en eindpunt, lees afstand in nautische mijlen af.

## IA patch - facilitator pages
- Done: removed Scenario State from Facilitator Ops and Map page.
- Done: moved Scenario Authoring plus Templates and Scenario/Exercise Packages to Scenario tab.
- Done: Map page now starts with chart controls (overlay, icon style, turn hours, remember view) followed by Blue Cells.
- Open: verify whether Blue Cells should later also move to Scenario tab or remain on Map.


## Latest facilitator IA pass
- Moved scenario-building controls, templates, packages, and full asset roster management to the Scenario tab.
- Reduced Facilitator Ops / Injects to turn status, inject handling, facilitator updates, and timeline.
- Reduced Map / Authoring to chart controls, blue cells, zone editing, selected-asset editing, duplication, commercial traffic, and turn controls.
- Added a clearer inline turn status panel on Scenario, Ops, and Map so Turn 1 / current turn is always obvious.


## Update: Modern asset profiles + 0–100% fuel/readiness
- Modern naval class library now shows faction, role tags, default affiliation, sensor profile, and class notes.
- Added per-class fuel capacity baseline so fuel is edited/displayed as percent while movement still burns against a class capacity.
- Readiness moved from legacy 1–5 style to 0–100% for clearer operational interpretation.


## Update — Generic asset profiles
- Replaced named modern class quick-add with generic capability profiles.
- Assets now keep generic type names (frigate, destroyer, cruiser, submarine, carrier, etc.).
- Added secondary Asset Profile dropdown to tune role tags, sensor profile, fuel capacity, and baseline readiness without forcing a named class.
- Legacy named-class assets are migrated to the nearest generic profile on load.


## Latest patch
- Generic ship-class workflow emphasized over named specific classes.
- Profile dropdown remains the secondary mission-tuning control (AAW/ASW/etc.).
- Added BroadcastChannel-based page sync so Scenario turn advances push immediately to Map tabs.
- Removed facilitator map cell pills/overlays.
