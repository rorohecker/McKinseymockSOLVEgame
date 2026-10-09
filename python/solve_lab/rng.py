"""Seeded random numbers identical to the JavaScript ``RNG`` in the app."""
import math

_M = 0xFFFFFFFF


def _imul(a: int, b: int) -> int:
    return (a * b) & _M


def mulberry32(seed: int):
    """Return a function that yields floats in [0, 1), same stream as the JS."""
    state = [seed & _M]

    def nxt() -> float:
        state[0] = (state[0] + 0x6D2B79F5) & _M
        x = state[0]
        t = _imul(x ^ (x >> 15), 1 | x)
        t = ((t + _imul(t ^ (t >> 7), 61 | t)) & _M) ^ t
        return ((t ^ (t >> 14)) & _M) / 4294967296

    return nxt


class RNG:
    def __init__(self, seed: int):
        self.f = mulberry32(seed)

    def int(self, a: int, b: int) -> int:
        return a + math.floor(self.f() * (b - a + 1))

    def pick(self, items):
        return items[math.floor(self.f() * len(items))]

    def chance(self, p: float) -> bool:
        return self.f() < p

    def shuffle(self, items):
        a = list(items)
        for i in range(len(a) - 1, 0, -1):
            j = math.floor(self.f() * (i + 1))
            a[i], a[j] = a[j], a[i]
        return a
