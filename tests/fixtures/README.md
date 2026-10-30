# Demo font fixture

`demo.svg`, `demo.ttf`, `demo.otf`, `demo.woff` and `demo.woff2` are the same
small icon font in five containers. They exist only for the test suite and the
documentation screenshots; Glyphary itself ships without a font.

## Provenance

- **Family:** Glyphary Demo, Regular, version 1.000
- **Outlines:** 25 icons from [Bootstrap Icons 1.11.3](https://github.com/twbs/icons), MIT.
  The outlines were rescaled to a 1000 UPM em box, converted (CFF → TrueType for
  `.ttf`/`.woff`/`.woff2`), renamed and remapped to `U+E900–U+E918`. No
  third-party font binary is copied into this repository, only these derived
  outlines.
- **License:** see `LICENSE.bootstrap-icons.txt`.

## Glyphs

| Code     | Name     | Code     | Name        | Code     | Name       |
| -------- | -------- | -------- | ----------- | -------- | ---------- |
| `U+E900` | house    | `U+E909` | arrow-right | `U+E912` | folder     |
| `U+E901` | search   | `U+E90A` | plus-lg     | `U+E913` | lock       |
| `U+E902` | x-lg     | `U+E90B` | list        | `U+E914` | music-note |
| `U+E903` | star     | `U+E90C` | envelope    | `U+E915` | pencil     |
| `U+E904` | heart    | `U+E90D` | calendar    | `U+E916` | trash      |
| `U+E905` | bell     | `U+E90E` | camera      | `U+E917` | sun        |
| `U+E906` | gear     | `U+E90F` | chat        | `U+E918` | moon       |
| `U+E907` | person   | `U+E910` | cloud       |          |            |
| `U+E908` | check-lg | `U+E911` | download    |          |            |

The font contains 27 glyphs in total: `.notdef`, `space` and the 25 icons above.
Glyphary filters `space` and non-characters, so the UI reports 25 glyphs.

## Regenerating

The fixtures are generated with [fontTools](https://github.com/fonttools/fonttools)
from the matching Bootstrap Icons SVG files: outlines are transformed by
`scale(62.5, -62.5)` and translated by `1000`, then written with `FontBuilder`
(TrueType), `setupCFF` (CFF) and `SVGFont`-style markup. Re-run that generator
if the icon set ever needs to change.
