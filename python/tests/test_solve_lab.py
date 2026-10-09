"""Run with:  python -m unittest discover -s tests -v   (from the python/ folder)"""
import pathlib
import shutil
import subprocess
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "python"))

from solve_lab import (RNG, best_in, filter_pool, gen_redrock, gen_sea_wolf,  # noqa: E402
                       score_redrock, score_site)
from solve_lab.jsnum import f1, fmt, jstr, js_round, near  # noqa: E402
from tools.validate import perfect_answers  # noqa: E402
from tools.parity_check import find_chrome  # noqa: E402


class JsNumbers(unittest.TestCase):
    def test_round_half_up(self):
        self.assertEqual(js_round(2.5), 3)
        self.assertEqual(js_round(-2.5), -2)  # like Math.round
        self.assertEqual(f1(12.25), 12.3)

    def test_formatting(self):
        self.assertEqual(fmt(12000), "12,000")
        self.assertEqual(fmt(12.5), "12.5")
        self.assertEqual(jstr(15.0), "15")
        self.assertEqual(jstr(12.5), "12.5")

    def test_near_parses_user_text(self):
        self.assertTrue(near("1,250 km", 1250, 0.5) is False)  # letters are not stripped
        self.assertTrue(near("12.4%", 12.5, 0.5))
        self.assertFalse(near("", 1, 0.5))
        self.assertTrue(near("€1,250", 1250, 0.5))
        self.assertFalse(near("5xyz", 5, 0.5))
        self.assertFalse(near("1,2", 12, 0.5))
        self.assertFalse(near("1e309", 1, 0.5))


class Rng(unittest.TestCase):
    def test_repeatable(self):
        a, b = RNG(7), RNG(7)
        self.assertEqual([a.int(1, 100) for _ in range(20)], [b.int(1, 100) for _ in range(20)])

    def test_shuffle_is_permutation(self):
        self.assertEqual(sorted(RNG(3).shuffle(range(10))), list(range(10)))


class Redrock(unittest.TestCase):
    def test_perfect_and_empty(self):
        for seed in range(1, 60):
            d = gen_redrock(seed)
            self.assertEqual(score_redrock(d, perfect_answers(d))["total"], 175)
            self.assertEqual(score_redrock(d, {})["total"], 0)

    def test_structure(self):
        d = gen_redrock(5)
        self.assertEqual(len(d["names"]), 4)
        self.assertEqual(len(d["cases"]), 6)
        self.assertEqual(sum(len(q["parts"]) for q in d["an"]), 6)
        self.assertEqual(len(d["vis"]["labels"]), 4)


class SeaWolf(unittest.TestCase):
    def test_planted_team_is_perfect(self):
        for seed in range(1, 60):
            w = gen_sea_wolf(seed)
            for s in w["sites"]:
                trio = [w["byId"][i] for i in s["planted"]]
                self.assertEqual(score_site(s, trio)["score"], 100)
                self.assertEqual(best_in(s, s["pool"])["score"], 100)

    def test_scoring_deductions(self):
        site = {"ranges": [[8, 10], [6, 8], [2, 4]], "desired": "Heat Resistant", "undesired": "Phosphorous Removal"}
        mk = lambda a, t: {"name": "x", "a": a, "trait": t}  # noqa: E731
        good = [mk([10, 2, 4], "Salt"), mk([4, 8, 3], "Salt"), mk([10, 10, 5], "Heat Resistant")]
        self.assertEqual(score_site(site, good)["score"], 100)
        bad = [mk([8, 6, 3], "Phosphorous Removal")] * 3  # no desired + 3 forbidden
        self.assertEqual(score_site(site, bad)["score"], 100 - 20 - 60)
        floor = [mk([1, 1, 1], "Phosphorous Removal")] * 3
        self.assertEqual(score_site(site, floor)["score"], 0)

    def test_two_characteristic_profiles(self):
        site = {"ranges": [[5, 7]] * 3, "desired": "A", "undesired": "B"}
        pool = [{"a": [6, 6, 6], "trait": "C"}, {"a": [1, 1, 1], "trait": "A"},
                {"a": [6, 6, 6], "trait": "B"}, {"a": [1, 1, 1], "trait": "C"}]
        f = {"selected": ["a0", "a1"], "r": [[5, 7]] * 3, "traitModes": {"A": "yes", "B": "no", "C": "yes"}}
        self.assertEqual([m["trait"] for m in filter_pool(site, pool, f)], ["C", "B"])
        f["selected"] = ["a0", "t:A"]
        self.assertEqual([m["trait"] for m in filter_pool(site, pool, f)], ["C", "A", "B"])
        f["selected"] = ["a0", "t:B"]
        self.assertEqual([m["trait"] for m in filter_pool(site, pool, f)], ["C"])
        f["selected"] = ["t:A", "t:B"]
        self.assertEqual([m["trait"] for m in filter_pool(site, pool, f)], ["A"])
        f["selected"] = ["a0"]
        self.assertEqual(filter_pool(site, pool, f), [])


@unittest.skipUnless(shutil.which("node") or find_chrome(), "Node.js or Chrome not installed")
class Parity(unittest.TestCase):
    def test_matches_html(self):
        r = subprocess.run([sys.executable, str(ROOT / "python" / "tools" / "parity_check.py"), "1", "60"],
                           capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)


if __name__ == "__main__":
    unittest.main()
