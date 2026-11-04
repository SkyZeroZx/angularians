"""Builds docs/assets/wordmark.svg, the README's header: the mark and "ANGULARIANS" in Norse Bold, as outlines.

GitHub cannot load our font, so the word is drawn from its glyphs. Run after `pnpm dev` or `pnpm build` (which
download the font to app/public/fonts), from the repository root:

  pip install fonttools
  python3 app/scripts/logo/wordmark.py
"""
import re
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

FONT, LOGO_SVG, OUT = 'app/public/fonts/Norse-Bold.otf', 'app/public/logo.svg', 'docs/assets/wordmark.svg'
f = TTFont(FONT)
glyphs, cmap, hmtx = f.getGlyphSet(), f.getBestCmap(), f['hmtx']
CAP = 735                             # Norse's cap height, in font units
LOGO = 1.75 * CAP                     # the mark's box, as in the site's header
GAP, TRACK = 0.14 * CAP, 20           # between the mark and the word; between the letters
BASE = (LOGO + CAP) / 2               # the capitals centred on the mark's box

paths, x = [], LOGO + GAP
for ch in 'ANGULARIANS':
    name = cmap[ord(ch)]
    pen = SVGPathPen(glyphs)
    glyphs[name].draw(TransformPen(pen, (1, 0, 0, -1, x, BASE)))
    paths.append(pen.getCommands())
    x += hmtx[name][0] + TRACK
width = x - TRACK
mark = ''.join(re.findall(r' d="([^"]+)"', open(LOGO_SVG).read()))
open(OUT, 'w').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:.0f} {LOGO:.0f}" role="img" aria-label="Angularians">'
    f'<path fill="#e5194b" transform="scale({LOGO / 24:.4f})" d="{mark}"/>'
    f'<path fill="#e5194b" d="{" ".join(paths)}"/></svg>\n')
print(f'{OUT}: {width:.0f} x {LOGO:.0f}')
