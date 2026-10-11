"""Canonical scenario snapshot used for JS/Python parity checks and exports."""
from .redrock import gen_redrock, score_redrock
from .seawolf import gen_sea_wolf, score_site


def snapshot(seed: int):
    d = gen_redrock(seed)
    w = gen_sea_wolf(seed)
    answers = {}
    for q in d["an"]:
        for p in q["parts"]:
            answers[p["key"]] = str(p["ans"])
    for b in d["blanks"]:
        answers[b["key"]] = str(b["ans"]) if b["type"] == "num" else b["ans"][0]
    answers["vtype"] = d["vis"]["right"]
    for i, value in enumerate(d["vis"]["values"]):
        answers[f"v{i}"] = str(value)
    for i, case in enumerate(d["cases"]):
        answers[f"c{i}"] = str(case["ans"])
    exact = score_redrock(d, answers)
    near_answers = {**answers, "an0a": str(float(answers["an0a"]) + 1)}
    near_result = score_redrock(d, near_answers)
    return {
        "rr": {
            "theme": d["theme"], "names": d["names"], "terr": d["terr"], "totals": d["totals"], "y4": d["y4"],
            "pctA": d["pctA"], "kmB": d["kmB"], "elk": d["elk"],
            "an": [{"title": q["title"], "parts": [
                {k: p[k] for k in ("key", "text", "unit", "ans")} for p in q["parts"]]} for q in d["an"]],
            "vis": d["vis"], "blanks": d["blanks"], "cases": d["cases"],
        },
        "sw": {"sites": [{k: s[k] for k in ("name", "contam", "desired", "undesired", "avg",
                                            "ranges", "planted", "pool")} for s in w["sites"]]},
        "scores": {"rrExact": exact["total"], "rrNear": near_result["total"],
                   "swPlanted": [{k: score_site(s, [w["byId"][id] for id in s["planted"]])[k]
                                  for k in ("score", "precision", "ded")} for s in w["sites"]]},
    }
