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
