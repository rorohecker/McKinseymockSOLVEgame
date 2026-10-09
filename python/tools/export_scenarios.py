#!/usr/bin/env python3
"""Export scenarios as JSON and a CSV summary, e.g. to build a question bank.

    python tools/export_scenarios.py --from 1 --to 50 --out ../exports

Writes one ``scenario_<seed>.json`` per seed plus ``summary.csv``.
"""
import argparse
import csv
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "python"))

from solve_lab import best_in, gen_sea_wolf, score_site  # noqa: E402
from solve_lab.seawolf import count_perfect  # noqa: E402
from solve_lab.snapshot import snapshot  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--from", dest="lo", type=int, default=1)
    ap.add_argument("--to", dest="hi", type=int, default=20)
    ap.add_argument("--out", default=str(ROOT / "exports"))
    a = ap.parse_args()
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    rows = []
    for seed in range(a.lo, a.hi + 1):
        snap = snapshot(seed)
        (out / f"scenario_{seed}.json").write_text(json.dumps(snap, indent=2, ensure_ascii=False), encoding="utf-8")
        w = gen_sea_wolf(seed)
        rows.append({
            "seed": seed,
            "redrock_theme": snap["rr"]["theme"]["name"],
            "redrock_chart": snap["rr"]["vis"]["kind"],
            "redrock_case_kinds": "|".join(c["kind"] for c in snap["rr"]["cases"]),
            **{f"site{s['idx'] + 1}_perfect_teams": count_perfect(s, s["pool"]) for s in w["sites"]},
            **{f"site{s['idx'] + 1}_best": best_in(s, s["pool"])["score"] for s in w["sites"]},
        })
    with (out / "summary.csv").open("w", newline="", encoding="utf-8") as f:
        wr = csv.DictWriter(f, fieldnames=list(rows[0]))
        wr.writeheader()
        wr.writerows(rows)
    print(f"wrote {len(rows)} scenarios to {out}")


if __name__ == "__main__":
    main()
