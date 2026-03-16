#!/usr/bin/env python3
"""Simple starter generator for Open War Game Engine.

Reads a scenario YAML file and produces a small JSON inject set. This is a seed
module only; it is meant to be replaced by a richer engine later.
"""
from __future__ import annotations

import argparse
import json
import random
from pathlib import Path
from typing import Any

import yaml

TITLES = {
    "land": ["Border Recon Activity", "Convoy Delay", "Bridge Damage Report"],
    "air": ["Unknown Aircraft Track", "Radar Coverage Gap", "IFF Failure"],
    "maritime": ["AIS Spoofing Alert", "Suspicious Vessel", "Harbor Disruption"],
    "cyber": ["Network Intrusion Alert", "Credential Leak", "System Latency Spike"],
    "space": ["Telemetry Drift", "ISR Coverage Gap", "Signal Degradation"],
    "information": ["Disinformation Surge", "Deepfake Leader Clip", "Narrative Shift"],
    "logistics": ["Fuel Delay", "Inventory Mismatch", "Contractor Walkout"],
}

PHASE_LABELS = {
    "competition": "Phase 1 - Competition",
    "hybrid_pressure": "Phase 2 - Hybrid Pressure",
    "limited_conflict": "Phase 3 - Limited Conflict",
    "major_escalation": "Phase 4 - Major Escalation",
}

SEVERITY_BY_LEVEL = {
    "strategic": ["High", "Strategic"],
    "operational": ["Medium", "High", "Strategic"],
    "tactical": ["Low", "Medium", "High"],
}


def load_yaml(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def generate_injects(scenario: dict[str, Any], count: int = 24) -> list[dict[str, Any]]:
    sc = scenario["scenario"]
    level = sc["level"]
    domains = sc["domains"]
    phases = sc["phases"]
    conflict_mode = sc["conflict_mode"]
    injects: list[dict[str, Any]] = []

    for idx in range(1, count + 1):
        domain = random.choice(domains)
        phase = random.choice(phases)
        severity = random.choice(SEVERITY_BY_LEVEL[level])
        title = random.choice(TITLES[domain])
        injects.append(
            {
                "id": f"OWGE-INJ-{idx:03d}",
                "level": level,
                "conflict_mode": conflict_mode,
                "phase": PHASE_LABELS[phase],
                "domain": domain,
                "severity": severity,
                "title": title,
                "situation": f"Exercise control reports {title.lower()} affecting the {domain} domain.",
                "decision_required": "Assess, coordinate, and decide immediate response posture.",
                "white_cell_notes": "Escalate if players delay or misattribute the event.",
            }
        )
    return injects


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--scenario", required=True, help="Path to YAML scenario file")
    parser.add_argument("--output", required=True, help="Path to output JSON file")
    parser.add_argument("--count", type=int, default=24, help="Number of injects to generate")
    args = parser.parse_args()

    scenario = load_yaml(Path(args.scenario))
    injects = generate_injects(scenario, count=args.count)
    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(injects, f, indent=2)
    print(f"Wrote {len(injects)} injects to {out_path}")


if __name__ == "__main__":
    main()
