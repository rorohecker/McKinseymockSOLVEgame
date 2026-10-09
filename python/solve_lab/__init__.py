"""Python port of the Solve Practice Lab scenario generators.

The generators are a line-for-line port of the JavaScript in ``app/index.html``
and produce identical scenarios for the same seed. ``tools/parity_check.py``
proves that against the real HTML file using Node.
"""
from .rng import RNG, mulberry32
from .redrock import gen_redrock, score_redrock
from .seawolf import (ATTRS, TRAITS, best_in, filter_pool, gen_sea_wolf,
                      score_site)

__all__ = [
    "RNG", "mulberry32", "gen_redrock", "score_redrock", "gen_sea_wolf",
    "score_site", "best_in", "filter_pool", "ATTRS", "TRAITS",
]
