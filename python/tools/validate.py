#!/usr/bin/env python3
"""Validate generated scenarios over many seeds.

    python tools/validate.py              # seeds 1..500
    python tools/validate.py 1 5000

Checks
  * a perfect Redrock answer sheet scores 175 and an empty one scores 0
  * every Sea Wolf site has a compliant planted team and a best team at least as strong
  * microbe names are unique, pools have 28 microbes, planted microbes sit in the
    first six slots (so a permissive filter always shows them)
  * counts compliant teams per pool and how often a tight filter hides the planted team
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
        if len({c["kind"] for c in d["cases"]}) != 6:
            problems.append(f"seed {seed}: duplicate Redrock case kind")
        advanced = {"Weighted average", "Data judgement", "Sequential change", "Median",
                    "Conditional probability", "Sequential budget", "Changing denominator"}
        if sum(c["kind"] in advanced for c in d["cases"][2:]) != 3:
            problems.append(f"seed {seed}: Redrock case mix is not balanced")
        if [c["kind"] for c in d["cases"][:2]] != ["Four-year growth", "Average decline"] or d["cases"][0]["body"] != d["cases"][1]["body"]:
            problems.append(f"seed {seed}: first two cases do not share their four-year exhibit")
        if len(d["blanks"]) != 8 or len(d["vis"]["values"]) != (8 if d["vis"]["kind"] == "compare" else 4):
            problems.append(f"seed {seed}: Report field count is invalid")
        a_total, b_total = (q["ans"] for q in d["an"][2]["parts"])
        expected_report = [d["targetArea"], ["meet" if a_total >= d["targetArea"] else "fall short of"], a_total,
                           d["aValues"][d["reportFocus"]], ["more" if b_total > a_total else "less" if b_total < a_total else "the same"],
                           b_total, ["meet" if b_total >= d["targetArea"] else "fall short of"], ["reduce"]]
        if [b["ans"] for b in d["blanks"]] != expected_report:
            problems.append(f"seed {seed}: written summary does not match the study")
        if d["vis"]["kind"] == "compare" and d["vis"]["values"] != [value for i, baseline in enumerate(d["y4"]) for value in (baseline, d["aValues"][i])]:
            problems.append(f"seed {seed}: baseline-versus-Proposal-A visual values are invalid")
        if [len(q["parts"]) for q in d["an"]] != [2, 4, 2]:
            problems.append(f"seed {seed}: Redrock analysis does not have the expected linked fields")
        if d["targetArea"] <= d["totals"][3] or abs(d["an"][0]["parts"][1]["ans"] - (d["targetArea"] - d["totals"][3])) > .11:
            problems.append(f"seed {seed}: management target gap is invalid")
        if abs(d["an"][2]["parts"][0]["ans"] - sum(d["aValues"])) > .11:
            problems.append(f"seed {seed}: Proposal A total differs from group answers")
        if abs(d["an"][2]["parts"][1]["ans"] - sum(d["bValues"])) > .11:
            problems.append(f"seed {seed}: Proposal B total differs from exhibit adjustments")
        for c in d["cases"]:
            if c["type"] == "mc":
                texts = [o["text"] for o in c["options"]]
                if len(set(texts)) != len(texts):
                    problems.append(f"seed {seed}: duplicate choices in {c['kind']}")
                if sum(o["id"] == c["ans"] for o in c["options"]) != 1:
                    problems.append(f"seed {seed}: missing unique answer in {c['kind']}")
        w = gen_sea_wolf(seed)
        for s in w["sites"]:
            sites += 1
            planted = [w["byId"][i] for i in s["planted"]]
            planted_score = score_site(s, planted)
            if planted_score["ded"]:
                problems.append(f"seed {seed} {s['name']}: planted team misses a requirement")
            if len({m["name"] for m in s["pool"]}) != POOL_SIZE:
                problems.append(f"seed {seed} {s['name']}: duplicate names or wrong pool size")
            if any(s["pool"].index(m) > 5 for m in planted):
                problems.append(f"seed {seed} {s['name']}: planted microbe outside first six slots")
            if best_in(s, s["pool"])["score"] < planted_score["score"]:
                problems.append(f"seed {seed} {s['name']}: solver missed the planted team")
            perfect_counts.append(count_perfect(s, s["pool"]))
            for pad, counter in ((1, "tight"), (2, "wide")):
                f = {"selected": ["a0", "a1"], "r": [[max(1, a - pad), min(10, b + pad)] for a, b in s["ranges"]], "traitModes": {}}
                shown = [m["id"] for m in filter_pool(s, s["pool"], f)[:10]]
                if not all(p in shown for p in s["planted"]):
                    if counter == "tight":
                        tight_hidden += 1
                    else:
                        wide_hidden += 1
    perfect_counts.sort()
    n = len(perfect_counts)
    print(f"seeds {lo}..{hi}: {hi - lo + 1} scenarios, {sites} Sea Wolf sites")
    print(f"compliant teams per pool: min {perfect_counts[0]}, median {statistics.median(perfect_counts)}, max {perfect_counts[-1]}")
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
