"""Sea Wolf scenario generator, scorer, filter and solver (port of app/index.html)."""
from itertools import combinations

from .jsnum import jstr, js_round
from .rng import RNG

TRAITS = ["Heat Resistant", "Pressure Resistant", "Phosphorous Removal", "Nitrogen Fixing",
          "Salt Tolerant", "Acid Tolerant", "Light Sensitive", "Biofilm Forming"]
ATTRS = ["Permeability", "Mobility", "Energy"]
G1 = ["Lior", "Ryn", "Xylo", "Orun", "Kael", "Vesk", "Tavi", "Ilo", "Brun", "Nyx",
      "Zeph", "Quor", "Marl", "Sev", "Dren", "Palo", "Yarr", "Oska", "Tull", "Evra"]
G2 = ["Volvox", "Bacil", "Phage", "Nema", "Spira", "Coccus", "Vibrio", "Algae", "Fungi",
      "Archa", "Diatom", "Cyan"]
CONTAMINANTS = ["Hydrocarbon slick", "Heavy-metal sediment", "Plastic leachate",
                "Nutrient runoff", "Pesticide plume"]
POOL_SIZE = 28


def _cl(x):
    return max(1, min(10, x))


def gen_sea_wolf(seed: int):
    R = RNG(seed * 17 + 3)
    used, counter = set(), [0]

    def mk(a, trait):
        while True:
            name = R.pick(G1) + " " + R.pick(G2)
            if name not in used:
                break
        used.add(name)
        m = {"id": f"m{counter[0]}", "name": name, "a": a, "trait": trait}
        counter[0] += 1
        return m

    contam = R.shuffle(CONTAMINANTS)[:3]
    drop = R.int(0, 2)
    drop_which = "undesired" if R.chance(0.5) else "desired"
    specs = []
    for i in range(3):
        tr = R.shuffle(TRAITS)
        s = {"idx": i, "name": f"Site {i + 1}", "contam": contam[i], "desired": tr[0], "undesired": tr[1]}
        if i == drop:
            s[drop_which] = None
        s["avg"] = [R.int(2, 9) for _ in range(3)]
        s["ranges"] = [[a - 1, a + 1] for a in s["avg"]]
        specs.append(s)

    def neutral(s):
        return R.pick([t for t in TRAITS if t != s["undesired"]])

    def triple(a):
        while True:
            v = [_cl(a + R.int(-3, 3)) for _ in range(3)]
            if abs(sum(v) - 3 * a) <= 1:
                return v

    by_id = {}
    for si, s in enumerate(specs):
        vals = [triple(a) for a in s["avg"]]
        pl = []
        for t in range(3):
            trait = s["desired"] if (t == 0 and s["desired"]) else neutral(s)
            pl.append(mk([vals[i][t] for i in range(3)], trait))
        s["planted"] = [m["id"] for m in pl]
        rest = []
        for _ in range(3):  # tempting traps carrying the forbidden trait
            attrs = [_cl(a + R.int(-1, 1)) for a in s["avg"]]
            trait = s["undesired"] or neutral(s)
            rest.append(mk(attrs, trait))
        if si < 2:  # a microbe that suits the next site (carry-over bait)
            nx = specs[si + 1]
            attrs = [_cl(a + R.int(-1, 1)) for a in nx["avg"]]
            rest.append(mk(attrs, neutral(nx)))
        while len(rest) + 3 < POOL_SIZE:
            attrs = [R.int(1, 10) for _ in range(3)]
            rest.append(mk(attrs, R.pick(TRAITS)))
        shuffled = R.shuffle(rest)
        slots = R.shuffle([0, 1, 2, 3, 4, 5])[:3]
        pool = [None] * POOL_SIZE
        for t, sl in enumerate(slots):
            pool[sl] = pl[t]
        ri = 0
        for i in range(POOL_SIZE):
            if pool[i] is None:
                pool[i] = shuffled[ri]
                ri += 1
        s["pool"] = pool
        for m in pool:
            by_id[m["id"]] = m
    return {"seed": seed, "sites": specs, "byId": by_id}


def score_site(site, trio):
    sums = [sum(m["a"][i] for m in trio) for i in range(3)]
    avg = [s / 3 for s in sums]
    ded = []
    for i, s in enumerate(sums):
        lo, hi = site["ranges"][i]
        if s < 3 * lo or s > 3 * hi:
            ded.append(f"{ATTRS[i]} average {jstr(js_round(avg[i] * 100) / 100)} is outside {lo}–{hi}")
    if site["desired"] and not any(m["trait"] == site["desired"] for m in trio):
        ded.append(f"No microbe carries the desired trait ({site['desired']})")
    if site["undesired"]:
        for m in trio:
            if m["trait"] == site["undesired"]:
                ded.append(f"{m['name']} carries the undesired trait ({site['undesired']})")
    return {"score": max(0, 100 - 20 * len(ded)), "avg": avg, "ded": ded}


def best_in(site, pool):
    """Brute force the best 3-microbe team in a pool (study / validation tool)."""
    best = {"score": -1, "trio": None}
    for trio in combinations(pool, 3):
        s = score_site(site, list(trio))["score"]
        if s > best["score"]:
            best = {"score": s, "trio": list(trio)}
        if s == 100:
            return best
    return best


def count_perfect(site, pool):
    return sum(1 for t in combinations(pool, 3) if score_site(site, list(t))["score"] == 100)


def filter_pool(site, pool, f):
    """f = {'r': [[min|None, max|None] x3], 'useD': bool, 'exU': bool}"""
    out = []
    has_range = any(x[0] is not None or x[1] is not None for x in f["r"])
    for m in pool:
        attr_ok = (not has_range) or all(
            (x[0] is None or m["a"][i] >= x[0]) and (x[1] is None or m["a"][i] <= x[1])
            for i, x in enumerate(f["r"]))
        passed = attr_ok or (f["useD"] and site["desired"] and m["trait"] == site["desired"])
        if passed and not (f["exU"] and site["undesired"] and m["trait"] == site["undesired"]):
            out.append(m)
    return out
