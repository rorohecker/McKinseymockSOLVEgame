"""Redrock Study scenario generator and scorer (port of app/index.html)."""
from .jsnum import f1, fmt, js_round, jstr, num
from .rng import RNG

PACKS = ["Silverbrook", "Granite Hollow", "Cedar Ridge", "Ashfall",
         "Marrow Creek", "Hollow Pine", "Stonebay", "Ember Flats"]
THEMES = [
    {"name": "Wildlife territory", "groups": "wolf packs", "group": "pack", "measure": "territory", "unit": "km²", "names": PACKS, "context": "An elk herd is moving inland.", "contextLabel": "Elk herd", "contextUnit": "animals"},
    {"name": "Wetland restoration", "groups": "wetland basins", "group": "basin", "measure": "restored habitat", "unit": "hectares", "names": ["North Basin", "Saltmeadow", "Reed Bend", "Tidal Flats", "Willow Reach", "South Marsh", "Old Lagoon", "Estuary Edge"], "context": "Seasonal flooding is changing which basins need attention.", "contextLabel": "Seedling count", "contextUnit": "seedlings"},
    {"name": "Forest protection", "groups": "forest corridors", "group": "corridor", "measure": "protected habitat", "unit": "hectares", "names": ["North Ridge", "Cedar Pass", "Ash Hollow", "Pine Edge", "West Spur", "River Gate", "Granite Slope", "High Meadow"], "context": "Dry conditions have changed the highest-risk corridors.", "contextLabel": "Survey trees", "contextUnit": "trees"},
    {"name": "Coastal resilience", "groups": "shoreline sectors", "group": "sector", "measure": "stabilised coast", "unit": "hectares", "names": ["North Dune", "Shell Point", "Outer Beach", "Harbour Edge", "Salt Reach", "East Spit", "Bay Mouth", "Tern Cove"], "context": "Storm exposure differs between sectors.", "contextLabel": "Nesting birds", "contextUnit": "birds"},
    {"name": "River recovery", "groups": "river reaches", "group": "reach", "measure": "restored bank", "unit": "hectares", "names": ["Upper Fork", "Willow Bend", "Mill Reach", "Stone Run", "South Channel", "Pine Crossing", "Lower Gate", "Heron Pool"], "context": "Runoff is changing conditions along the river.", "contextLabel": "Survey fish", "contextUnit": "fish"},
    {"name": "Grassland restoration", "groups": "prairie zones", "group": "zone", "measure": "restored grassland", "unit": "hectares", "names": ["North Plain", "Dry Hollow", "Bison Ridge", "Clover Flat", "West Meadow", "Long Draw", "South Rise", "Creek Edge"], "context": "Seasonal grazing pressure varies by zone.", "contextLabel": "Seed plots", "contextUnit": "plots"},
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
    m = _mc(R, [jstr(g) + "%", jstr(f1(g / (100 + g) * 100)) + "%", jstr(f1(g + g * g / 100)) + "%", jstr(f1(g * 100 / (100 - g))) + "%"], 0)
    out.append({
        "kind": "Growth", "title": "Visitors at the ranger station",
        "body": f"<p>The ranger station logged <b>{fmt(a)}</b> visitors in Year 1 and <b>{fmt(b)}</b> in Year 2.</p>",
        "q": "By what percentage did visitors increase?", "type": "mc", **m,
        "explain": f"({fmt(b)} − {fmt(a)}) ÷ {fmt(a)} = {jstr(g)}%. The other percentages use Year 2 as the base or apply a second change.",
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
    m = _mc(R, ["Statements 1 and 2", "Statements 1 and 3", "Statements 2 and 3", "All three statements"], 0)
    out.append({
        "kind": "Data judgement", "title": "What does the table show?",
        "body": f'<div class="tblbox"><table><tr><th>Year</th><th class="n">Seal sightings</th><th class="n">Survey hours</th></tr><tr><td>Year 1</td><td class="n">{fmt(s1)}</td><td class="n">{jstr(h1)}</td></tr><tr><td>Year 2</td><td class="n">{fmt(s2)}</td><td class="n">{jstr(h2)}</td></tr></table></div><ol><li>Recorded sightings rose by 25%.</li><li>Sightings per survey hour fell.</li><li>Sightings per survey hour fell by 25%.</li></ol>',
        "q": "Which statements does the table support?", "type": "mc", **m,
        "explain": f"Recorded sightings rose by 25%, but survey hours rose by 50%. Sightings per hour fell from {jstr(f1(r1))} to {jstr(f1(s2 / h2))}, a decline of about 16.7%, so statement 3 is too large.",
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
    p = R.pick([10, 15, 20]); q = R.pick([5, 10, 15]); base = R.pick([200, 300, 400])
    net = f1(p - q - p * q / 100); cross = p * q / 100
    m = _mc(R, [jstr(net) + "%", jstr(f1(p - q)) + "%",
                jstr(f1(p - q + cross)) + "%", jstr(f1(p - q - 2 * cross)) + "%"], 0)
    out.append({
        "kind": "Sequential change", "title": "Habitat after two seasons",
        "body": f"<p>A habitat index began at <b>{base}</b>. It rose <b>{p}%</b> in spring, then fell <b>{q}%</b> from the spring level in autumn.</p>",
        "q": "What was the net percentage change from the original index?", "type": "mc", **m,
        "explain": f"Multiply the changes: (1 + {p}/100) × (1 − {q}/100) − 1 = {jstr(net)}%. Simply subtracting the rates ignores their different bases.",
    })
    base = R.pick([4, 8, 12]); values = [base, base + 2, base + 4, base + 6]
    counts = [R.pick([2, 3, 4]) for _ in values]
    ordered = [v for i, v in enumerate(values) for _ in range(counts[i])]
    middle = (ordered[(len(ordered) - 1) // 2] + ordered[len(ordered) // 2]) / 2
    rows = "".join(f'<tr><td class="n">{v}</td><td class="n">{counts[i]}</td></tr>' for i, v in enumerate(values))
    out.append({
        "kind": "Median", "title": "Samples per survey plot",
        "body": f'<div class="tblbox"><table><tr><th class="n">Samples in a plot</th><th class="n">Number of plots</th></tr>{rows}</table></div>',
        "q": "What is the median number of samples per plot?", "type": "num",
        "ans": middle, "tol": 0.1,
        "explain": f"Expand each sample count by its number of plots. Of {len(ordered)} plots, the middle observation{'s' if len(ordered) % 2 == 0 else ''} give{'s' if len(ordered) % 2 else ''} a median of {jstr(middle)}.",
    })
    prevalence = R.pick([15, 25, 35]); sensitivity = R.pick([80, 90]); false_positive = R.pick([8, 12])
    detected = prevalence * sensitivity / 100
    incorrect = (100 - prevalence) * false_positive / 100
    answer = f1(detected / (detected + incorrect) * 100)
    m = _mc(R, [jstr(answer) + "%", jstr(prevalence) + "%", jstr(sensitivity) + "%", jstr(f1(detected)) + "%"], 0)
    out.append({
        "kind": "Conditional probability", "title": "Testing water samples",
        "body": f"<p><b>{prevalence}%</b> of sites have contamination. A rapid test detects contamination at <b>{sensitivity}%</b> of contaminated sites and incorrectly tests positive at <b>{false_positive}%</b> of clean sites.</p>",
        "q": "Among positive tests, what percentage are from contaminated sites?", "type": "mc", **m,
        "explain": f"Out of 100 sites, {jstr(f1(detected))} true positives and {jstr(f1(incorrect))} false positives are expected. Divide {jstr(f1(detected))} by their sum: {jstr(answer)}%.",
    })
    baseline = R.pick([240, 320, 400]); increase = R.pick([10, 15, 20]); saving = R.pick([5, 8, 12])
    answer = f1(baseline * (1 + increase / 100) * (1 - saving / 100))
    out.append({
        "kind": "Sequential budget", "title": "Monitoring budget revision",
        "body": f"<p>The monitoring budget was <b>{baseline}</b> thousand euros. New equipment raises the forecast by <b>{increase}%</b>. A later efficiency plan saves <b>{saving}%</b> of that raised forecast.</p>",
        "q": "What is the revised budget, in thousand euros?", "type": "num", "ans": answer, "tol": 0.1,
        "explain": f"Apply both changes in order: {baseline} × (1 + {increase}/100) × (1 − {saving}/100) = {jstr(answer)} thousand euros.",
    })
    animals = R.pick([120, 160, 200]); habitat = R.pick([300, 400, 500]); move = R.pick([10, 15, 20]); gain = R.pick([5, 10, 15])
    left = animals * (1 - move / 100); new_habitat = habitat * (1 + gain / 100); answer = f1(new_habitat / left)
    out.append({
        "kind": "Changing denominator", "title": "Habitat per animal",
        "body": f"<p>A reserve has <b>{habitat}</b> hectares of habitat and <b>{animals}</b> animals. Habitat expands by <b>{gain}%</b>, while <b>{move}%</b> of animals move to another reserve.</p>",
        "q": "How many hectares of habitat are there per remaining animal?", "type": "num", "ans": answer, "tol": 0.1,
        "explain": f"New habitat is {jstr(f1(new_habitat))} hectares; {jstr(f1(left))} animals remain. Divide to get {jstr(answer)} hectares per animal.",
    })
    sectors = R.shuffle(["Cedar Reach", "North Meadow", "Slate Basin", "Willow Pass", "East Hollow"])[:3]
    growth = [R.pick([720, 840, 960])]
    for step in [R.pick([40, 60, 80]), R.pick([30, 50, 70]), R.pick([40, 60, 90])]:
        growth.append(growth[-1] + step)
    middle = [R.pick([680, 800, 920])]
    for step in R.shuffle([R.pick([30, 50, 70]), -R.pick([40, 60, 80]), R.pick([20, 40, 60])]):
        middle.append(middle[-1] + step)
    lower = [R.pick([620, 740, 860])]
    for step in R.shuffle([-R.pick([20, 40, 60]), R.pick([30, 50, 70]), -R.pick([30, 50, 70])]):
        lower.append(lower[-1] + step)
    rows = [growth, middle, lower]
    declines = [(row[i] - value) / row[i] * 100 for row in (middle, lower) for i, value in enumerate(row[1:]) if value < row[i]]
    table_rows = "".join(f'<tr><td>{sectors[i]}</td>' + "".join(f'<td class="n">{fmt(v)}</td>' for v in row) + '</tr>' for i, row in enumerate(rows))
    table = '<div class="tblbox"><table><tr><th>Survey sector</th><th class="n">Year 1</th><th class="n">Year 2</th><th class="n">Year 3</th><th class="n">Year 4</th></tr>' + table_rows + '</table></div>'
    growth_answer = f1((growth[3] - growth[0]) / growth[0] * 100)
    decline_answer = f1(sum(declines) / len(declines))
    linked = [
        {"kind": "Four-year growth", "title": "Survey coverage by sector", "body": table,
         "q": f"What was the percentage growth for {sectors[0]} from Year 1 to Year 4?", "type": "num", "unit": "%", "ans": growth_answer, "tol": .1,
         "explain": f"Use the original Year 1 value as the denominator: ({growth[3]} − {growth[0]}) ÷ {growth[0]} × 100 = {jstr(growth_answer)}%."},
        {"kind": "Average decline", "title": "Survey coverage by sector", "body": table,
         "q": f"Across {sectors[1]} and {sectors[2]}, find every year-to-year decline. What is the average percentage decrease across those declines?", "type": "num", "unit": "%", "ans": decline_answer, "tol": .1,
         "explain": f"Calculate each decline as (earlier − later) ÷ earlier × 100, then average the {len(declines)} decline percentages: {', '.join(jstr(f1(v)) + '%' for v in declines)} → {jstr(decline_answer)}%."},
    ]
    # Keep every run multi-step without fixing the order or the exact case mix.
    advanced = {"Weighted average", "Data judgement", "Sequential change", "Median",
                "Conditional probability", "Sequential budget", "Changing denominator"}
    shuffled = R.shuffle(out)
    chosen = [c for c in shuffled if c["kind"] in advanced][:3] + [c for c in shuffled if c["kind"] not in advanced][:1]
    return linked + R.shuffle(chosen)


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
    a_order = R.shuffle([0, 1, 2, 3]); a_focus = a_order[:2]; a_reserve = R.pick([24, 36, 48, 60])
    pctA = [R.int(18, 42) if i in a_focus else 0 for i, _ in enumerate(names)]
    a_rules = [f"+{pctA[i]}%" if i in a_focus else f"+{a_reserve // 2} {theme['unit']} shared reserve" for i, _ in enumerate(names)]
    a_values = [f1(v * (1 + pctA[i] / 100)) if i in a_focus else v + a_reserve / 2 for i, v in enumerate(y4)]
    b_order = R.shuffle([0, 1, 2, 3]); b_fixed = R.pick([50, 60, 70, 80, 90]); b_increase = R.pick([30, 35, 40, 45, 50]); b_reduction = R.pick([4, 6, 8, 10])
    b_rules = [f"+{b_fixed} {theme['unit']}" if i == b_order[0] else f"+{b_increase}%" if i == b_order[1] else f"−{b_reduction}%" if i == b_order[2] else "No change" for i, _ in enumerate(names)]
    b_values = [v + b_fixed if i == b_order[0] else f1(v * (1 + b_increase / 100)) if i == b_order[1] else f1(v * (1 - b_reduction / 100)) if i == b_order[2] else v for i, v in enumerate(y4)]
    kmB = [f1(v - y4[i]) for i, v in enumerate(b_values)]

    def cA():
        return f1(sum(a_values))

    def cB():
        return f1(sum(b_values))
    resource = js_round(totals[3] * R.pick([1.5, 1.6, 1.7, 1.8])) + 50
    target_pct = R.pick([65, 70, 75, 80])
    target_area = f1(resource * target_pct / 100)
    elk = R.pick([3800, 4200, 4600, 5100])
    report_focus = b_order[2]
    an = [
        {"title": "Baseline and target", "prompt": f"Calculate the current total and the additional {theme['unit']} required to reach the management target.", "parts": [
            {"key": "an0a", "text": f"Using Exhibit 1, what was the total {theme['measure']} of all four {theme['groups']} in Year 4?", "unit": theme["unit"], "ans": totals[3]},
            {"key": "an0b", "text": f"How many additional {theme['unit']} are needed to reach {target_pct}% of the {resource} {theme['unit']} management zone?", "unit": theme["unit"], "ans": f1(target_area - totals[3])}]},
        {"title": "Proposal A by group", "prompt": f"Calculate the updated {theme['measure']} for every {theme['group']} under Proposal A. Apply each group's own rule to its Year 4 baseline.", "parts": [
            {"key": "an1" + "abcd"[i], "text": name, "unit": theme["unit"], "ans": a_values[i]} for i, name in enumerate(names)]},
        {"title": "Compare proposal totals", "prompt": f"Calculate the total {theme['measure']} under both proposals. Keep the Year 4 baseline separate from each proposal's changes.", "parts": [
            {"key": "an2a", "text": "Proposal A total", "unit": theme["unit"], "ans": cA()},
            {"key": "an2b", "text": "Proposal B total", "unit": theme["unit"], "ans": cB()}]},
    ]
    kind = R.pick(["compare", "share", "trend", "waterfall"])
    vis = {
        "kind": kind,
        "instr": {"compare": f"Compare baseline {theme['measure']} with Proposal A for each {theme['group']} ({theme['unit']}).",
                  "share": f"Show each {theme['group']}'s share of total Year 4 {theme['measure']} (%).",
                  "trend": f"Show how total {theme['measure']} changed from Year 1 to Year 4 ({theme['unit']}).",
                  "waterfall": f"Show how the four Proposal B adjustments change the Year 4 total ({theme['unit']})."}[kind],
        "labels": ["Year 1", "Year 2", "Year 3", "Year 4"] if kind == "trend" else [label for n in names for label in (n + " · baseline", n + " · Proposal A")] if kind == "compare" else list(names),
        "values": [value for i, v in enumerate(y4) for value in (v, a_values[i])] if kind == "compare" else [f1(v / totals[3] * 100) for v in y4] if kind == "share" else kmB if kind == "waterfall" else totals,
        "right": {"compare": "bar", "share": "pie", "trend": "line", "waterfall": "waterfall"}[kind],
    }
    meets = lambda x: "meet" if x >= target_area else "fall short of"  # noqa: E731
    blanks = [
        {"key": "rp0", "type": "num", "ans": target_area, "prompt": f"Management target ({theme['unit']})", "why": "Multiply the management zone by the target percentage."},
        {"key": "rp1", "type": "sel", "ans": [meets(cA())], "options": ["meet", "fall short of"], "prompt": "Proposal A versus target", "why": "Compare Proposal A total with the management target."},
        {"key": "rp2", "type": "num", "ans": cA(), "prompt": f"Proposal A total ({theme['unit']})", "why": "Add the four updated Proposal A group values."},
        {"key": "rp3", "type": "num", "ans": a_values[report_focus], "prompt": f"Proposal A area for {names[report_focus]} ({theme['unit']})", "why": "Apply this group’s Proposal A rule to its Year 4 baseline."},
        {"key": "rp4", "type": "sel", "ans": ["more" if cB() > cA() else "less" if cB() < cA() else "the same"], "options": ["more", "less", "the same"], "prompt": "Proposal B compared with Proposal A", "why": "Compare the two proposal totals."},
        {"key": "rp5", "type": "num", "ans": cB(), "prompt": f"Proposal B total ({theme['unit']})", "why": "Apply all four Proposal B rules and add the results."},
        {"key": "rp6", "type": "sel", "ans": [meets(cB())], "options": ["meet", "fall short of"], "prompt": "Proposal B versus target", "why": "Compare Proposal B total with the management target."},
        {"key": "rp7", "type": "sel", "ans": ["reduce"], "options": ["increase", "reduce", "maintain"], "prompt": f"Proposal B effect on {names[report_focus]}", "why": "This group has the percentage-reduction rule in Exhibit 2."},
    ]
    return {"seed": seed, "theme": theme, "names": names, "terr": terr, "totals": totals, "y4": y4,
            "pctA": pctA, "kmB": kmB, "aRules": a_rules, "bRules": b_rules, "aReserve": a_reserve, "aValues": a_values, "bValues": b_values, "reportFocus": report_focus, "resource": resource, "targetPct": target_pct, "targetArea": target_area, "elk": elk, "an": an, "vis": vis,
            "blanks": blanks, "cases": gen_cases(R)}


def score_redrock(d, A, tolerance=0.5):
    """Return {'items': [...], 'total': float, 'max': float} (175 points)."""
    items = []

    def add(sec, label, your, correct, pts, mx):
        items.append({"sec": sec, "label": label, "your": "—" if your in ("", None) else your,
                      "correct": correct, "pts": pts, "max": mx})

    def numeric_points(value, answer, tol, maximum):
        parsed = num(value)
        if parsed is None:
            return 0
        error = abs(parsed - answer)
        if error <= tol + 1e-9:
            return maximum
        limit = max(4 * tol, abs(answer) * .02)
        return 0 if error >= limit else js_round(maximum * .6 * (limit - error) / (limit - tol) * 10) / 10

    analysis_max = 60 / sum(len(q["parts"]) for q in d["an"])
    for qi, q in enumerate(d["an"]):
        for pi, p in enumerate(q["parts"]):
            pts = numeric_points(A.get(p["key"]), p["ans"], tolerance, analysis_max)
            add("Analysis", f"Q{qi + 1}{'abcd'[pi]}", A.get(p["key"]), f"{fmt(p['ans'])} {p['unit']}", pts, analysis_max)
    for i, b in enumerate(d["blanks"]):
        v = A.get(b["key"])
        mx = 25 / len(d["blanks"])
        pts = numeric_points(v, b["ans"], tolerance, mx) if b["type"] == "num" else mx if v in b["ans"] else 0
        add("Report", f"Written blank {i + 1}", v, fmt(b["ans"]) if b["type"] == "num" else " / ".join(b["ans"]), pts, mx)
    vis = d["vis"]
    add("Report", "Chart type", A.get("vtype"), vis["right"], 15 if A.get("vtype") == vis["right"] else 0, 15)
    for i, v in enumerate(vis["values"]):
        mx = 15 / len(vis["values"])
        pts = numeric_points(A.get(f"v{i}"), v, tolerance, mx)
        add("Report", "Chart " + vis["labels"][i], A.get(f"v{i}"), fmt(v), pts if A.get("vtype") == vis["right"] else js_round(pts * .5 * 100) / 100, mx)
    for i, c in enumerate(d["cases"]):
        v = A.get(f"c{i}")
        if c["type"] == "mc":
            ok = v == c["ans"]
            your = next((o["text"] for o in c["options"] if o["id"] == v), "—")
            correct = next(o["text"] for o in c["options"] if o["id"] == c["ans"])
        else:
            your, correct = v, jstr(c["ans"])
        pts = (10 if ok else 0) if c["type"] == "mc" else numeric_points(v, c["ans"], min(c["tol"], tolerance), 10)
        add("Cases", f"Case {i + 1} · {c['kind']}", your, correct, pts, 10)
    return {"items": items, "total": js_round(sum(x["pts"] for x in items) * 100) / 100,
            "max": sum(x["max"] for x in items)}
