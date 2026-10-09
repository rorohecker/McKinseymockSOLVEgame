#!/usr/bin/env python3
"""Validate generated scenarios over many seeds.

    python tools/validate.py              # seeds 1..500
    python tools/validate.py 1 5000

Checks
  * a perfect Redrock answer sheet scores 175 and an empty one scores 0
  * every Sea Wolf site has its planted team scoring 100
  * microbe names are unique, pools have 28 microbes, planted microbes sit in the
    first six slots (so a permissive filter always shows them)
  * counts perfect teams per pool and how often a tight filter hides the solution
"""
import pathlib
import statistics
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "python"))

from solve_lab import (best_in, filter_pool, gen_redrock, gen_sea_wolf,  # noqa: E402
                       score_redrock, score_site)
from solve_lab.seawolf import POOL_SIZE, count_perfect  # noqa: E402


def perfect_answers(d):
    A = {}
    for q in d["an"]:
        for p in q["parts"]:
            A[p["key"]] = str(p["ans"])
    for b in d["blanks"]:
        A[b["key"]] = str(b["ans"]) if b["type"] == "num" else b["ans"][0]
    A["vtype"] = d["vis"]["right"]
    for i, v in enumerate(d["vis"]["values"]):
        A[f"v{i}"] = str(v)
    for i, c in enumerate(d["cases"]):
        A[f"c{i}"] = c["ans"] if c["type"] == "mc" else str(c["ans"])
    return A


def main():
    lo, hi = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1, int(sys.argv[1]) if len(sys.argv) == 2 else 500)
    problems, perfect_counts, tight_hidden, wide_hidden, sites = [], [], 0, 0, 0
    for seed in range(lo, hi + 1):
        d = gen_redrock(seed)
        r = score_redrock(d, perfect_answers(d))
        if r["total"] != 175:
            problems.append(f"seed {seed}: perfect Redrock sheet scored {r['total']}")
        if score_redrock(d, {})["total"] != 0:
            problems.append(f"seed {seed}: empty Redrock sheet scored above 0")
        w = gen_sea_wolf(seed)
        for s in w["sites"]:
            sites += 1
            planted = [w["byId"][i] for i in s["planted"]]
            if score_site(s, planted)["score"] != 100:
                problems.append(f"seed {seed} {s['name']}: planted team is not perfect")
            if len({m["name"] for m in s["pool"]}) != POOL_SIZE:
                problems.append(f"seed {seed} {s['name']}: duplicate names or wrong pool size")
            if any(s["pool"].index(m) > 5 for m in planted):
                problems.append(f"seed {seed} {s['name']}: planted microbe outside first six slots")
            if best_in(s, s["pool"])["score"] != 100:
                problems.append(f"seed {seed} {s['name']}: no perfect team found")
            perfect_counts.append(count_perfect(s, s["pool"]))
            for pad, counter in ((1, "tight"), (2, "wide")):
                f = {"r": [[a - pad, b + pad] for a, b in s["ranges"]], "useD": True, "exU": True}
                shown = [m["id"] for m in filter_pool(s, s["pool"], f)[:10]]
                if not all(p in shown for p in s["planted"]):
                    if counter == "tight":
                        tight_hidden += 1
                    else:
                        wide_hidden += 1
    perfect_counts.sort()
    n = len(perfect_counts)
    print(f"seeds {lo}..{hi}: {hi - lo + 1} scenarios, {sites} Sea Wolf sites")
    print(f"perfect teams per pool: min {perfect_counts[0]}, median {statistics.median(perfect_counts)}, max {perfect_counts[-1]}")
    print(f"sites where a filter at range +/-1 hides part of the planted team: {tight_hidden} ({tight_hidden / n:.0%})")
    print(f"sites where a filter at range +/-2 hides part of the planted team: {wide_hidden} ({wide_hidden / n:.0%})")
    if problems:
        print(f"\n{len(problems)} PROBLEMS")
        for p in problems[:20]:
            print(" -", p)
        sys.exit(1)
    print("OK: no problems found")


if __name__ == "__main__":
    main()
