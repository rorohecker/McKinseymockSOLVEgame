"""Canonical scenario snapshot used for JS/Python parity checks and exports."""
from .redrock import gen_redrock
from .seawolf import gen_sea_wolf


def snapshot(seed: int):
    d = gen_redrock(seed)
    w = gen_sea_wolf(seed)
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
    }
