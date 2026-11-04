"""Builds the Angularians mark as flat paths from its construction, with real boolean operations.

  pip install shapely
  python3 build.py regular   # the header logo (24px and up): app/src/app/layout/logo-mark.ts
  python3 build.py small     # the favicon (16px) and the cards: a wider rim gap so it stays a full pixel
  python3 build.py regular --parts   # JSON: the rim and the body apart, for the animation

Prints the path data (`d`) of the mark in a 24 x 24 view box.

The mark: the Angular shield as a Viking one, an iron rim with rivets and boards inside, and the capital A of Norse Bold cut through it
from the tip of the shield out through its bottom, like the A of the Angular logo.
"""
import sys
from shapely.geometry import LineString, Polygon, box
from shapely.ops import unary_union
from shapely import affinity

VARIANT = sys.argv[1] if len(sys.argv) > 1 else 'regular'
# rim: the width of the iron rim; gap: between the rim and the boards, and between the boards; rivets: how many
# along the rim, and their radius (all in design units). The small variant has fewer, bigger rivets and wider gaps.
P = {'regular': dict(rim=1.2, gap=.26, rivets=22, rivet=.24), 'small': dict(rim=1.35, gap=.36, rivets=16, rivet=.3)}[VARIANT]
BOARDS = (8, 13, 18)                                 # design y of the gaps between the boards

SHIELD = Polygon([(12, .8), (22.6, 4.6), (21, 18.4), (12, 23.4), (3, 18.4), (1.4, 4.6)]).buffer(.5, join_style='round', quad_segs=8)

# The capital A of Norse Bold by Joel Carrouche (app/public/fonts; THIRD_PARTY_NOTICES.md),
# its outline in font units, y up. Under its crossbar the feet are cut off and the legs go on straight, out
# through the bottom of the shield.
A_RINGS = [[(279, 205), (287, 172), (296, 166), (288, 156), (292, 128), (305, 2), (322, -7), (335, -7), (409, 17), (398, 60), (383, 76), (389, 84), (379, 147), (354, 240), (354, 254), (306, 495), (294, 504), (301, 522), (269, 675), (265, 685), (262, 693), (263, 728), (246, 736), (164, 732), (154, 669), (145, 627), (138, 587), (149, 572), (131, 551), (101, 417), (101, 399), (95, 378), (92, 359), (72, 236), (73, 216), (62, 205), (52, 142), (25, 20), (60, -2), (122, -8), (133, 59), (126, 87), (135, 98), (146, 169), (166, 177), (175, 181), (242, 197), (262, 211), (263, 211), (277, 213), (279, 205)], [(187, 434), (182, 450), (192, 455), (212, 577), (227, 471), (231, 453), (235, 401), (255, 293), (227, 286), (162, 266), (163, 273), (175, 338), (174, 337), (187, 434)]]
CLIP, LONG = 130, -900
glyph = Polygon(A_RINGS[0], holes=A_RINGS[1:]).intersection(box(-100, CLIP, 600, 900))
legs = [Polygon([(50, CLIP), (141, CLIP), (141 + .163 * (LONG - CLIP), LONG), (50 + .178 * (LONG - CLIP), LONG)]),
        Polygon([(290, CLIP), (383, CLIP), (383 - .21 * (LONG - CLIP), LONG), (290 - .21 * (LONG - CLIP), LONG)])]
A = affinity.scale(unary_union([glyph, *legs]), 1, -1, origin=(0, 0))
TOP, BAR = -.4, 15                                   # design y of the A's top (above the tip) and of its crossbar
sa = (BAR - TOP) / (736 - 230)
A = affinity.scale(A, sa, sa, origin=(0, 0))
A = affinity.translate(A, 0, TOP + 736 * sa)
upper = A.intersection(box(-50, -50, 50, 18)).bounds  # centre it on the shield by its part above the bottom
A = affinity.translate(A, 12 - (upper[0] + upper[2]) / 2, 0)

body = SHIELD.buffer(-P['rim'], join_style='mitre')
rim = SHIELD.difference(body.buffer(P['gap'] / 2, join_style='mitre')).difference(A)
inside = body.buffer(-P['gap'] / 2, join_style='mitre').difference(A)
inside = inside.difference(unary_union([LineString([(-5, y), (30, y)]).buffer(P['gap'] / 2, cap_style='flat') for y in BOARDS]))
# Rivets along the middle of the rim, but only where they sit whole on it (none at the A).
middle = SHIELD.buffer(-P['rim'] / 2 + .02, join_style='mitre').exterior
dots = [middle.interpolate(i / P['rivets'], normalized=True).buffer(P['rivet'], quad_segs=4) for i in range(P['rivets'])]
safe = rim.buffer(-.12)
rim = rim.difference(unary_union([d for d in dots if safe.contains(d)]))
clean = lambda g: unary_union([p for p in getattr(g, 'geoms', [g]) if p.area > .35])
rim, inside = clean(rim), clean(inside)

# Fit into the 24 box with a 1-unit margin, by the shield's height.
minx, miny, maxx, maxy = SHIELD.bounds
sc = 22 / (maxy - miny)
fit = lambda g: affinity.translate(affinity.scale(g, sc, sc, origin=(0, 0)), 12 - sc * (minx + maxx) / 2, 1 - sc * miny)

def ring(coords):
    pts = list(coords)[:-1]
    fmt = lambda v: (f'{v:.2f}'.rstrip('0').rstrip('.')) or '0'
    return 'M' + 'L'.join(f'{fmt(x)} {fmt(y)}' for x, y in pts) + 'Z'
def path(g):
    polys = list(g.geoms) if hasattr(g, 'geoms') else [g]
    return ''.join(ring(p.exterior.coords) + ''.join(ring(h.coords) for h in p.interiors) for p in polys)

if '--parts' in sys.argv:
    import json
    print(json.dumps({'rim': path(fit(rim)), 'body': path(fit(inside))}))
else:
    mark = fit(unary_union([rim, inside]))
    d = path(mark)
    print(f'{VARIANT}: bounds={tuple(round(v, 2) for v in mark.bounds)} chars={len(d)}', file=sys.stderr)
    print(d)
