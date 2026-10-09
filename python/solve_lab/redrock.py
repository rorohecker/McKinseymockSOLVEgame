"""Redrock Study scenario generator and scorer (port of app/index.html)."""
from .jsnum import f1, fmt, js_round, jstr, near
from .rng import RNG

PACKS = ["Silverbrook", "Granite Hollow", "Cedar Ridge", "Ashfall",
         "Marrow Creek", "Hollow Pine", "Stonebay", "Ember Flats"]
THEMES = [
    {"name": "Wildlife territory", "groups": "wolf packs", "group": "pack", "measure": "territory", "unit": "km²", "names": PACKS, "context": "An elk herd is moving inland.", "contextLabel": "Elk herd", "contextUnit": "animals"},
    {"name": "Wetland restoration", "groups": "wetland basins", "group": "basin", "measure": "restored habitat", "unit": "hectares", "names": ["North Basin", "Saltmeadow", "Reed Bend", "Tidal Flats", "Willow Reach", "South Marsh", "Old Lagoon", "Estuary Edge"], "context": "Seasonal flooding is changing which basins need attention.", "contextLabel": "Seedling count", "contextUnit": "seedlings"},
    {"name": "Forest protection", "groups": "forest corridors", "group": "corridor", "measure": "protected habitat", "unit": "hectares", "names": ["North Ridge", "Cedar Pass", "Ash Hollow", "Pine Edge", "West Spur", "River Gate", "Granite Slope", "High Meadow"], "context": "Dry conditions have changed the highest-risk corridors.", "contextLabel": "Survey trees", "contextUnit": "trees"},
]
LETTERS = ["a", "b", "c", "d"]


def _mc(R: RNG, texts, right_idx):
    o = R.shuffle([{"t": t, "r": i == right_idx} for i, t in enumerate(texts)])
    return {
        "options": [{"id": LETTERS[i], "text": x["t"]} for i, x in enumerate(o)],
        "ans": LETTERS[next(i for i, x in enumerate(o) if x["r"])],
    }


def gen_cases(R: RNG):
    out = []

    # 1. growth
    g = R.pick([10, 12.5, 15, 20, 25, 30])
    a = R.pick([8, 10, 12, 14, 16, 18, 20]) * 1000
    b = a * (1 + g / 100)
    m = _mc(R, [jstr(g) + "%", jstr(f1(g / (100 + g) * 100)) + "%", fmt(b - a), jstr(100 + g) + "%"], 0)
    out.append({
        "kind": "Growth", "title": "Visitors at the ranger station",
        "body": f"<p>The ranger station logged <b>{fmt(a)}</b> visitors in Year 1 and <b>{fmt(b)}</b> in Year 2.</p>",
        "q": "By what percentage did visitors increase?", "type": "mc", **m,
        "explain": f"({fmt(b)} − {fmt(a)}) ÷ {fmt(a)} = {jstr(g)}%. Dividing by the Year 2 figure or reporting the raw change answers a different question.",
    })

    # 2. weighted average
    n1 = R.pick([6000, 8000, 9000, 12000]); p1 = R.pick([10, 12, 14, 15])
    n2 = R.pick([1500, 2000, 3000]); p2 = R.pick([20, 22, 24, 25])
    ans = (n1 * p1 + n2 * p2) / (n1 + n2)
    out.append({
        "kind": "Weighted average", "title": "Average ticket price",
        "body": f"<p>In the low season <b>{fmt(n1)}</b> visitors paid <b>€{p1}</b> each. In the high season <b>{fmt(n2)}</b> visitors paid <b>€{p2}</b> each.</p>",
        "q": "What was the average price paid per visitor over the year (€)?", "type": "num",
        "ans": f1(ans * 100) / 100, "tol": 0.05,
        "explain": f"Revenue €{fmt(n1 * p1 + n2 * p2)} ÷ {fmt(n1 + n2)} visitors = €{js_round(ans * 100) / 100:.2f}. The simple average of the two prices ignores the visitor mix.",
    })

    # 3. probability
    p1 = R.pick([70, 75, 80, 85, 90]); p2 = R.pick([80, 85, 90, 95])
    ans = 30 * p1 * p2 / 10000
    out.append({
        "kind": "Probability", "title": "Supply ferry crossings",
        "body": f"<p>The ferry sails only when the wind is calm (<b>{p1}%</b> of days) and the harbour is open (<b>{p2}%</b> of days). The two are independent.</p>",
        "q": "How many sailings should the island expect in a 30-day month?", "type": "num",
        "ans": f1(ans), "tol": 0.5,
        "explain": f"{p1}% × {p2}% = {jstr(f1(p1 * p2 / 100))}% of days. 30 × that share = {jstr(f1(ans))} sailings.",
    })

    # 4. ratio
    cs = R.shuffle([300, 330, 360, 390, 420, 450, 480])[:3]
    ns = [R.pick([100, 150, 200, 250, 300]) for _ in cs]
    nm = ["A", "B", "C"]
    best = cs.index(min(cs))
    rows = "".join(f'<tr><td>Programme {x}</td><td class="n">€{fmt(cs[i] * ns[i])}</td><td class="n">{ns[i]}</td></tr>' for i, x in enumerate(nm))
    out.append({
        "kind": "Ratio", "title": "Nesting programmes",
        "body": f'<div class="tblbox"><table><tr><th>Programme</th><th class="n">Budget</th><th class="n">Birds fledged</th></tr>{rows}</table></div>',
        "q": "Which programme produced the most fledged birds per euro spent?", "type": "mc",
        "options": [{"id": "abc"[i], "text": "Programme " + x} for i, x in enumerate(nm)],
        "ans": "abc"[best],
        "explain": f"Cost per bird: {', '.join(x + ' = €' + str(cs[i]) for i, x in enumerate(nm))}. The lowest cost per bird wins, regardless of budget size.",
    })

    # 5. chart choice
    def waterfall():
        s = R.pick([500, 600, 700]) * 1000; x = R.pick([20, 30, 40]) * 1000
        y = R.pick([40, 50, 60]) * 1000; z = R.pick([30, 50]) * 1000
        return {"t": f"The conservation budget moved from €{fmt(s)} to €{fmt(s + x - y - z)}: staff costs rose by €{fmt(x)}, equipment fell by €{fmt(y)} and grants fell by €{fmt(z)}. Which chart best shows how the old total became the new total?", "a": "Waterfall"}

    def line():
        return {"t": f"Boat arrivals were logged every month for {R.pick([18, 24, 36])} months. Which chart best shows how arrivals changed over time?", "a": "Line"}

    def pie():
        return {"t": "Visitor spending is split across lodging, food, guided tours and gifts, and sums to 100%. Which chart best shows each category as a share of the whole?", "a": "Pie"}

    def clustered():
        return {"t": f"Elk counts were taken in {R.pick([4, 5, 6])} sectors in both Year 1 and Year 2. Which chart best compares the two years sector by sector?", "a": "Clustered bar"}

    T = R.pick([waterfall, line, pie, clustered])()
    opts = ["Pie", "Line", "Waterfall", "Clustered bar"]
    m = _mc(R, opts, opts.index(T["a"]))
    out.append({
        "kind": "Chart choice", "title": "Choosing the chart",
        "body": f"<p>{T['t']}</p>", "q": "Select the best chart.", "type": "mc", **m,
        "explain": f"{T['a']} fits the message: waterfalls show a bridge between totals, lines show change over time, pies show shares of a whole, clustered bars compare groups side by side.",
    })

    # 6. data judgement
    h1 = R.pick([60, 80, 100]); h2 = h1 * 1.5; r1 = R.pick([2.5, 3, 3.5, 4])
    s1 = r1 * h1; s2 = s1 * 1.25
    m = _mc(R, ["Only statement 2", "Statements 1 and 2", "Only statement 1", "Statements 1 and 3"], 0)
    out.append({
        "kind": "Data judgement", "title": "What does the table prove?",
        "body": f'<div class="tblbox"><table><tr><th>Year</th><th class="n">Seal sightings</th><th class="n">Survey hours</th></tr><tr><td>Year 1</td><td class="n">{fmt(s1)}</td><td class="n">{jstr(h1)}</td></tr><tr><td>Year 2</td><td class="n">{fmt(s2)}</td><td class="n">{jstr(h2)}</td></tr></table></div><ol><li>The seal population grew by 25%.</li><li>Sightings per survey hour fell.</li><li>Extra survey hours caused more seals to appear.</li></ol>',
        "q": "Which statements does the table support?", "type": "mc", **m,
        "explain": f"Sightings per hour fell from {jstr(f1(r1))} to {jstr(f1(s2 / h2))}. Statement 1 compares counts taken with different effort; statement 3 claims a cause the table cannot show.",
    })
    old = R.pick([18, 24, 35, 42, 55]); now = old + R.pick([3, 5, 7, 10])
    out.append({
        "kind": "Percentage points", "title": "Wetland recovery rate",
        "body": f"<p>The share of wetland plots rated healthy rose from <b>{old}%</b> to <b>{now}%</b>.</p>",
        "q": "How many percentage points did the rate rise?", "type": "num",
        "ans": now - old, "tol": 0.1,
        "explain": f"Subtract the two percentages: {now}% minus {old}% = {now-old} percentage points. A relative percent change would divide by the starting {old}%.",
    })
    low = R.pick([20, 30, 40]); high = R.pick([70, 80, 90]); p = R.pick([20, 25, 40, 50, 60])
    ans = f1((p * high + (100 - p) * low) / 100)
    out.append({
        "kind": "Expected value", "title": "Storm-response planning",
        "body": f"<p>There is a <b>{p}%</b> chance that a storm requires <b>{high}</b> staff hours. Otherwise it requires <b>{low}</b> hours.</p>",
        "q": "What is the expected number of staff hours?", "type": "num",
        "ans": ans, "tol": 0.1,
        "explain": f"Weight each outcome by its chance: ({p}% x {high}) + ({100-p}% x {low}) = {jstr(ans)} hours.",
    })
    start = R.pick([400, 500, 600]); a = R.pick([40, 60, 80]); b = R.pick([20, 30, 50]); c = R.pick([10, 20, 40])
    ans = start + a - b - c
    out.append({
        "kind": "Waterfall entry", "title": "Restoration budget bridge",
        "body": f"<p>A restoration fund opened at <b>{start}</b> thousand euros. Grants added <b>{a}</b>, equipment used <b>{b}</b>, and travel used <b>{c}</b> thousand euros.</p>",
        "q": "Enter the ending total (thousand euros) for the waterfall chart.", "type": "num",
        "ans": ans, "tol": 0.1,
        "explain": f"Begin at {start}; add {a}, subtract {b}, then subtract {c}. Ending total = {ans} thousand euros.",
    })
    return R.shuffle(out)[:6]


def gen_redrock(seed: int):
    R = RNG(seed * 13 + 7)
    theme = R.pick(THEMES)
    names = R.shuffle(theme["names"])[:4]
    terr = []
    for _ in names:
        v = R.int(38, 110)
        row = [v]
        for _y in range(1, 4):
            v = js_round(v * (1 + R.int(2, 14) / 100))
            row.append(v)
        terr.append(row)
    totals = [sum(r[y] for r in terr) for y in range(4)]
    y4 = [r[3] for r in terr]
    pctA = [R.int(-10, 20) for _ in names]
    kmB = [R.int(-12, 16) for _ in names]

    def cA():
        s = 0
        for i, v in enumerate(y4):
            s = s + v * (1 + pctA[i] / 100)
        return s

    def cB():
        s = 0
        for i, v in enumerate(y4):
            s = s + v + kmB[i]
        return s

    g = 0
    while abs(cA() - cB()) < 2 and g < 30:
        g += 1
        kmB[0] += 3
    j = R.int(0, 3); k = R.int(0, 3); elk = R.pick([3800, 4200, 4600, 5100])
    max4 = max(y4)
    largest = [n for i, n in enumerate(names) if y4[i] == max4]
    richer = "A" if cA() > cB() else "B"
    an = [
        {"title": "Study totals", "parts": [
            {"key": "an0a", "text": f"Using Exhibit 1, what was the total {theme['measure']} of all four {theme['groups']} in Year 4?", "unit": theme["unit"], "ans": totals[3]},
            {"key": "an0b", "text": f"What percentage of the Year 4 total did {names[j]} hold?", "unit": "%", "ans": f1(y4[j] / totals[3] * 100)}]},
        {"title": "Growth", "parts": [
            {"key": "an1a", "text": f"By what percentage did total {theme['measure']} change between Year 1 and Year 4?", "unit": "%", "ans": f1((totals[3] - totals[0]) / totals[0] * 100)},
            {"key": "an1b", "text": f"On average, by how many {theme['unit']} per year did {names[k]}'s {theme['measure']} grow between Year 1 and Year 4?", "unit": theme["unit"] + " / yr", "ans": f1((terr[k][3] - terr[k][0]) / 3)}]},
        {"title": "Proposal comparison", "parts": [
            {"key": "an2a", "text": f"Applying Proposal A (percentage change to each {theme['group']}'s Year 4 {theme['measure']}), what would the total be?", "unit": theme["unit"], "ans": f1(cA())},
            {"key": "an2b", "text": f"By how many {theme['unit']} does the larger proposal exceed the other?", "unit": theme["unit"], "ans": f1(abs(cA() - cB()))}]},
    ]
    kind = R.pick(["compare", "share", "trend", "waterfall"])
    vis = {
        "kind": kind,
        "instr": {"compare": f"Show how the four {theme['groups']} compare in Year 4 {theme['measure']} ({theme['unit']}).",
                  "share": f"Show each {theme['group']}'s share of total Year 4 {theme['measure']} (%).",
                  "trend": f"Show how total {theme['measure']} changed from Year 1 to Year 4 ({theme['unit']}).",
                  "waterfall": f"Show how the four Proposal B adjustments change the Year 4 total ({theme['unit']})."}[kind],
        "labels": ["Year 1", "Year 2", "Year 3", "Year 4"] if kind == "trend" else list(names),
        "values": y4 if kind == "compare" else [f1(v / totals[3] * 100) for v in y4] if kind == "share" else kmB if kind == "waterfall" else totals,
        "right": {"compare": "bar", "share": "pie", "trend": "line", "waterfall": "waterfall"}[kind],
    }
    blanks = [
        {"key": "rp0", "type": "num", "ans": totals[3], "prompt": f"Total {theme['measure']} in Year 4 ({theme['unit']})", "why": "Add the four Year 4 figures."},
        {"key": "rp1", "type": "sel", "ans": largest, "options": list(names), "prompt": f"Largest {theme['group']} in Year 4", "why": "Compare the four Year 4 values."},
        {"key": "rp2", "type": "num", "ans": an[1]["parts"][0]["ans"], "prompt": f"Change in total {theme['measure']}, Year 1 to Year 4 (%)", "why": "Subtract Year 1 from Year 4, divide by Year 1, then multiply by 100."},
        {"key": "rp3", "type": "sel", "ans": [richer], "options": ["A", "B"], "prompt": "Proposal with the larger total", "why": "Compute the total after each proposal and select the larger."},
        {"key": "rp4", "type": "num", "ans": an[2]["parts"][1]["ans"], "prompt": f"Difference between proposal totals ({theme['unit']})", "why": "Subtract the smaller proposal total from the larger."},
        {"key": "rp5", "type": "num", "ans": totals[0], "prompt": f"Total {theme['measure']} in Year 1 ({theme['unit']})", "why": "Add the four Year 1 figures."},
        {"key": "rp6", "type": "num", "ans": f1(cB()), "prompt": f"Total after Proposal B ({theme['unit']})", "why": "Add each fixed Proposal B adjustment to its Year 4 value, then total the four."},
        {"key": "rp7", "type": "num", "ans": f1(cA() - totals[3]), "prompt": f"Change from Year 4 total under Proposal A ({theme['unit']})", "why": "Compute Proposal A total, then subtract the Year 4 baseline."},
    ]
    return {"seed": seed, "theme": theme, "names": names, "terr": terr, "totals": totals, "y4": y4,
            "pctA": pctA, "kmB": kmB, "elk": elk, "an": an, "vis": vis,
            "blanks": [{**b, "key": "rp" + str(i)} for i, b in enumerate(R.shuffle(blanks)[:5])], "cases": gen_cases(R)}


def score_redrock(d, A, tolerance=0.5):
    """Return {'items': [...], 'total': float, 'max': float} (175 points)."""
    items = []

    def add(sec, label, your, correct, pts, mx):
        items.append({"sec": sec, "label": label, "your": "—" if your in ("", None) else your,
                      "correct": correct, "pts": pts, "max": mx})

    for qi, q in enumerate(d["an"]):
        for pi, p in enumerate(q["parts"]):
            ok = near(A.get(p["key"]), p["ans"], tolerance)
            add("Analysis", f"Q{qi + 1}{'ab'[pi]}", A.get(p["key"]), f"{fmt(p['ans'])} {p['unit']}", 10 if ok else 0, 10)
    for i, b in enumerate(d["blanks"]):
        v = A.get(b["key"])
        ok = near(v, b["ans"], tolerance) if b["type"] == "num" else v in b["ans"]
        add("Report", f"Written blank {i + 1}", v, fmt(b["ans"]) if b["type"] == "num" else " / ".join(b["ans"]), 5 if ok else 0, 5)
    vis = d["vis"]
    add("Report", "Chart type", A.get("vtype"), vis["right"], 15 if A.get("vtype") == vis["right"] else 0, 15)
    for i, v in enumerate(vis["values"]):
        add("Report", "Chart " + vis["labels"][i], A.get(f"v{i}"), fmt(v), 3.75 if near(A.get(f"v{i}"), v, tolerance) else 0, 3.75)
    for i, c in enumerate(d["cases"]):
        v = A.get(f"c{i}")
        if c["type"] == "mc":
            ok = v == c["ans"]
            your = next((o["text"] for o in c["options"] if o["id"] == v), "—")
            correct = next(o["text"] for o in c["options"] if o["id"] == c["ans"])
        else:
            ok = near(v, c["ans"], min(c["tol"], tolerance))
            your, correct = v, jstr(c["ans"])
        add("Cases", f"Case {i + 1} · {c['kind']}", your, correct, 10 if ok else 0, 10)
    return {"items": items, "total": sum(x["pts"] for x in items), "max": sum(x["max"] for x in items)}
