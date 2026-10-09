#!/usr/bin/env python3
"""Make a printable pen-and-paper worksheet (HTML) for one seed.

    python tools/make_worksheet.py 4242 --out worksheet_4242.html

Contains the Redrock exhibits, questions and cases, then each Sea Wolf site brief
with its full microbe pool. An answer key sits on the last page. Open the file in a
browser and print it. Practice use only.
"""
import argparse
import html
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "python"))

from solve_lab import ATTRS, best_in, gen_redrock, gen_sea_wolf  # noqa: E402
from solve_lab.jsnum import fmt  # noqa: E402

CSS = """body{font:14px/1.45 system-ui,sans-serif;max-width:820px;margin:24px auto;padding:0 16px;color:#111}
h1{font-size:26px}h2{border-bottom:2px solid #111;padding-bottom:4px;margin-top:32px}h3{margin-bottom:4px}
table{border-collapse:collapse;margin:8px 0}th,td{border:1px solid #999;padding:4px 10px;text-align:left}
td.n,th.n{text-align:right}.q{margin:10px 0}.line{display:inline-block;border-bottom:1px solid #111;width:110px}
@media print{.pb{page-break-before:always}}"""


def e(x):
    return html.escape(str(x))


def table(head, rows):
    h = "".join(f"<th>{e(c)}</th>" for c in head)
    r = "".join("<tr>" + "".join(f"<td>{e(c)}</td>" for c in row) + "</tr>" for row in rows)
    return f"<table><tr>{h}</tr>{r}</table>"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("seed", type=int)
    ap.add_argument("--out")
    a = ap.parse_args()
    d, w = gen_redrock(a.seed), gen_sea_wolf(a.seed)
    out = [f"<h1>Solve practice worksheet, seed {a.seed}</h1><p>Redrock: 35 minutes. Sea Wolf: 30 minutes. Use a basic calculator and scratch paper only.</p>"]
    theme = d["theme"]
    out.append(f"<h2>Redrock Study: {e(theme['name'])}</h2><h3>Objective</h3><p>Decide whether either proposal increases total {e(theme['measure'])} for the {e(theme['groups'])}.</p>")
    out.append(f"<h3>Exhibit 1: {e(theme['measure'])} ({e(theme['unit'])})</h3>" + table([theme["group"], "Year 1", "Year 2", "Year 3", "Year 4"], [[n, *d["terr"][i]] for i, n in enumerate(d["names"])]))
    out.append("<h3>Exhibit 2: proposals</h3>" + table([theme["group"], "A: % change to Year 4", f"B: {theme['unit']} change"], [[n, f"{d['pctA'][i]:+d}%", f"{d['kmB'][i]:+d}"] for i, n in enumerate(d["names"])]))
    out.append("<h3>Analysis</h3>")
    for qi, q in enumerate(d["an"]):
        for pi, p in enumerate(q["parts"]):
            out.append(f'<div class="q">Q{qi + 1}{"ab"[pi]}. {e(p["text"])} <span class="line"></span> {e(p["unit"])}</div>')
    out.append("<h3>Written report</h3>" + "".join(f'<div class="q">{e(b["prompt"])} <span class="line"></span></div>' for b in d["blanks"]))
    out.append(f"<h3>Chart</h3><p>{e(d['vis']['instr'])} Chart type: bar / pie / line / waterfall. Values for: {e(', '.join(d['vis']['labels']))}</p>")
    out.append('<h2 class="pb">Redrock cases (2 minutes each)</h2>')
    for i, c in enumerate(d["cases"]):
        opts = "".join(f"<div>({o['id']}) {e(o['text'])}</div>" for o in c.get("options", []))
        out.append(f"<h3>Case {i + 1}</h3>{c['body']}<p><b>{e(c['q'])}</b></p>{opts or '<span class=line></span>'}")
    for s in w["sites"]:
        out.append(f'<h2 class="pb">Sea Wolf, {e(s["name"])}: {e(s["contam"])}</h2>')
        out.append("<p>" + "; ".join(f"{ATTRS[i]} average {lo}-{hi}" for i, (lo, hi) in enumerate(s["ranges"])) + f"<br>Desired trait: {e(s['desired'] or 'none')}. Avoid: {e(s['undesired'] or 'none')}.</p>")
        out.append(table(["#", "Microbe", *ATTRS, "Trait"], [[i + 1, m["name"], *m["a"], m["trait"]] for i, m in enumerate(s["pool"])]))
        out.append("<p>Your team (three numbers): ____ ____ ____</p>")
    out.append('<h2 class="pb">Answer key</h2><h3>Redrock analysis</h3>')
    out.append(table(["Item", "Answer"], [[f"Q{qi + 1}{'ab'[pi]}", f"{fmt(p['ans'])} {p['unit']}"] for qi, q in enumerate(d["an"]) for pi, p in enumerate(q["parts"])]))
    out.append("<h3>Written report</h3>" + table(["Prompt", "Answer"], [[b["prompt"], fmt(b["ans"]) if b["type"] == "num" else " / ".join(b["ans"])] for b in d["blanks"]]))
    out.append(f"<p>Best chart: {e(d['vis']['right'])}. Values: {e(', '.join(fmt(v) for v in d['vis']['values']))}</p>")
    out.append("<h3>Cases</h3>" + table(["Case", "Answer", "Why"], [[i + 1, next((o["text"] for o in c["options"] if o["id"] == c["ans"]), None) if c["type"] == "mc" else fmt(c["ans"]), c["explain"]] for i, c in enumerate(d["cases"])]))
    key = []
    for s in w["sites"]:
        b = best_in(s, s["pool"])
        nums = [s["pool"].index(m) + 1 for m in b["trio"]]
        key.append([s["name"], b["score"], ", ".join(map(str, nums))])
    out.append("<h3>Sea Wolf (one perfect team per site)</h3>" + table(["Site", "Score", "Microbe numbers"], key))
    dest = pathlib.Path(a.out or f"worksheet_{a.seed}.html")
    dest.write_text(f"<!doctype html><meta charset=utf-8><title>Worksheet {a.seed}</title><style>{CSS}</style>" + "\n".join(out), encoding="utf-8")
    print("wrote", dest)


if __name__ == "__main__":
    main()
