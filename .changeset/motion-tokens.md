---
"@stackra/tokens": minor
---

Two motion steps join `STACKRA_THEME` (ADR 0329): `reveal` (400ms, `cubic-bezier(0.22, 1, 0.36, 1)`), for an entrance,
and `stagger` (40ms), the delay between items revealed in a row. The web stylesheet renders `--duration-reveal`,
`--ease-reveal`, `--duration-stagger` and `--ease-stagger`, and sets both durations to `0ms` under
`prefers-reduced-motion: reduce`. `motionTiming(theme, name)` reads a step as milliseconds and a cubic bezier for
animation libraries in JavaScript, and throws a `RangeError` for a missing step or a timing it cannot read.
