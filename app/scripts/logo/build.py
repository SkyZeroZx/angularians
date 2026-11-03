"""Builds the Angularians mark as one flat path from its construction, with real boolean operations.

  pip install shapely
  python3 build.py regular   # the header logo (24px and up): app/src/app/layout/logo-mark.ts
  python3 build.py small     # the favicon (16px): a wider stripe and gap so they stay a full pixel: app/public/favicon.svg

Prints the path data (`d`) of the mark in a 24 x 24 view box.
"""
import math, sys
from shapely.geometry import Polygon
from shapely.ops import unary_union
from shapely import affinity

VARIANT = sys.argv[1] if len(sys.argv) > 1 else 'regular'
# stripe: the red strip between the A's right leg and the cut; gap: between the two pieces (both perpendicular).
P = {'regular': dict(stripe=1.4, gap=1.1, sw=3.2), 'small': dict(stripe=1.75, gap=1.6, sw=3.5)}[VARIANT]

SHIELD = Polygon([(12, .8), (22.6, 4.6), (21, 18.4), (12, 23.4), (3, 18.4), (1.4, 4.6)]).buffer(.5, join_style='round', quad_segs=8)
K = 6.9 / 14.6                                     # slope of the A's legs (dx per dy)
s = math.hypot(1, K); n = (1 / s, -K / s)          # unit normal of the cut, pointing right
STEP, FOOT = 1.8, 26
cx = lambda y: 12 + (y - .8) * K                   # the cut: parallel to the right leg, through the shield's apex
left_side = Polygon([(-10, -10), (cx(-10), -10), (cx(40), 40), (-10, 40)])
right_side = Polygon([(cx(-10), -10), (40, -10), (40, 40), (cx(40), 40)])
extra = P['gap'] - K * STEP / s                    # the step already opens part of the gap
dl = (-n[0] * extra / 2, -n[1] * extra / 2 + STEP / 2)
dr = (n[0] * extra / 2, n[1] * extra / 2 - STEP / 2)

# The fit into the 24 box (1-unit margin) depends only on the shield pieces, so work it out first...
outline = unary_union([affinity.translate(SHIELD.intersection(left_side), *dl), affinity.translate(SHIELD.intersection(right_side), *dr)])
minx, miny, maxx, maxy = outline.bounds
sc = 22 / (maxy - miny)
fit = lambda g: affinity.translate(affinity.scale(g, sc, sc, origin=(0, 0)), 12 - sc * (minx + maxx) / 2, 1 - sc * miny)
to_design = lambda y_final: (y_final - (1 - sc * miny)) / sc - dl[1]   # a final y on the left piece -> design y

# ...then place the crossbar on whole pixels of the final grid (the left piece holds the A): 15 to 17 at 24px.
BAR_TOP, BAR_BOTTOM = to_design(15), to_design(17)
AY = .8 + P['stripe'] * s / K                      # the apex sits so the stripe has its width at the top
SW = P['sw']
ox = lambda y: (y - AY) * K
ix = lambda y: ox(y) - SW
A = Polygon([(12, AY), (12 + ox(FOOT), FOOT), (12 + ix(FOOT), FOOT), (12 + ix(BAR_BOTTOM), BAR_BOTTOM),
             (12 - ix(BAR_BOTTOM), BAR_BOTTOM), (12 - ix(FOOT), FOOT), (12 - ox(FOOT), FOOT)],
            holes=[[(12, AY + SW / K), (12 - ix(BAR_TOP), BAR_TOP), (12 + ix(BAR_TOP), BAR_TOP)]])

piece = affinity.translate(SHIELD.difference(A).intersection(left_side), *dl)
wing = affinity.translate(SHIELD.intersection(right_side), *dr)
mark = fit(unary_union([piece, wing]))

def ring(coords):
    pts = list(coords)[:-1]
    fmt = lambda v: (f'{v:.2f}'.rstrip('0').rstrip('.')) or '0'
    return 'M' + 'L'.join(f'{fmt(x)} {fmt(y)}' for x, y in pts) + 'Z'
polys = list(mark.geoms) if hasattr(mark, 'geoms') else [mark]
d = ''.join(ring(p.exterior.coords) + ''.join(ring(h.coords) for h in p.interiors) for p in polys)
print(f'{VARIANT}: pieces={len(polys)} bounds={tuple(round(v, 2) for v in mark.bounds)} apex={AY:.2f} chars={len(d)}', file=sys.stderr)
print(d)
