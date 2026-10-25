---
"@stackra/tokens": minor
---

The glass material (ADR 0320). `Theme` gains a required `materials` block. It holds three levels (`thin`,
`regular`, `thick`): each one's fill share of `surface` per colour mode, a px blur and a saturation, plus the edge and
rim-light shares. `defineTheme` validates the block.

`renderWebCss` writes the material:

- the levels' fills and filters in the colour blocks;
- the factors of the four modes (`solid`, `frosted`, `glass`, `liquid`) on `[data-material]`, with liquid's sheen
  scaled by the colour scheme's rim-light share, and each mode's `thickFloor`, which makes the thick level solid in
  liquid so muted text keeps 4.5:1 on it;
- solid fallbacks for reduced transparency, more contrast and a missing `backdrop-filter`, and a static opaque
  material where `color-mix()` is unsupported;
- the `.material`, `.material-thin` and `.material-thick` classes.

New exports: `MaterialLevel`, `MaterialMode`, `ThemeMaterials` and the part types from `./contracts`, and
`MATERIAL_MODES` from `.`. A product theme must add a `materials` block.
