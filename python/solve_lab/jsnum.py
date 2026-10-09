"""Helpers that reproduce JavaScript number behaviour where it matters.

Python rounds half to even and prints floats differently from JavaScript. The
scenario text must match the JS byte for byte, so these helpers mimic:

* ``Math.round``                      -> :func:`js_round`
* ``Number.prototype.toString``       -> :func:`jstr`
* ``toLocaleString('en-US', {max 1})`` -> :func:`fmt`
"""
import math
import re

_NUM = re.compile(r"[,\s%€]")


def js_round(x: float) -> int:
    """Math.round: halves round toward +infinity."""
    return math.floor(x + 0.5)


def f1(n: float) -> float:
    """Round to one decimal place the way the JS helper does."""
    return js_round(n * 10) / 10


def jstr(x) -> str:
    """Render a number like JavaScript would in a template string."""
    if isinstance(x, bool):
        return "true" if x else "false"
    if isinstance(x, int):
        return str(x)
    if float(x).is_integer() and abs(x) < 1e21:
        return str(int(x))
    return repr(float(x))


def fmt(n: float) -> str:
    """en-US formatting with at most one decimal and thousands separators."""
    r = js_round(n * 10) / 10
    s = f"{r:,.1f}"
    return s[:-2] if s.endswith(".0") else s


def num(v):
    """Parse a user answer like the JS ``num`` helper. Returns None if blank."""
    if v is None:
        return None
    try:
        return float(_NUM.sub("", str(v)))
    except ValueError:
        return None


def near(v, ans: float, tol: float) -> bool:
    x = num(v)
    return x is not None and abs(x - ans) <= tol + 1e-9
