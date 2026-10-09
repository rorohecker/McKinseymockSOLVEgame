#!/usr/bin/env python3
"""Study tool: rank every 3-microbe team for a Sea Wolf site you wrote down.

PRACTICE ONLY. McKinsey's rules ban outside tools, notes and AI during the real
assessment. Use this afterwards to see which choice you should have made.

    python tools/seawolf_solver.py example_site.json
    python tools/seawolf_solver.py example_site.json --top 10

Input JSON:
    {"ranges": [[8,10],[6,8],[2,4]], "desired": "Heat Resistant", "undesired": "Phosphorous Removal",
     "microbes": [{"name": "Lior Volvox", "a": [10,2,4], "trait": "Pressure Resistant"}, ...]}
"""
import argparse
import json
import pathlib
import sys
from itertools import combinations

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "python"))

from solve_lab import score_site  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file")
    ap.add_argument("--top", type=int, default=5)
    a = ap.parse_args()
    spec = json.loads(pathlib.Path(a.file).read_text(encoding="utf-8"))
    site = {"ranges": spec["ranges"], "desired": spec.get("desired"), "undesired": spec.get("undesired")}
    ms = spec["microbes"]
    ranked = []
    for trio in combinations(ms, 3):
        r = score_site(site, list(trio))
        ranked.append((r["score"], r["avg"], trio, r["ded"]))
    ranked.sort(key=lambda x: -x[0])
    perfect = sum(1 for x in ranked if x[0] == 100)
    print(f"{len(ms)} microbes, {len(ranked)} teams, {perfect} perfect\n")
    for score, avg, trio, ded in ranked[:a.top]:
        names = ", ".join(m["name"] for m in trio)
        print(f"{score:>3}  {names}   averages {[round(v, 2) for v in avg]}")
        for d in ded:
            print(f"       -20 {d}")


if __name__ == "__main__":
    main()
