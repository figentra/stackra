---
"@stackra/tokens": minor
---

<!--
Stackra file contract:
Purpose: the release note of stackra-213 (STA-1370) for @stackra/tokens: the neutral steel accent.
Boundary: release notes only.
Runtime: none (Markdown)
Governing contract: ADR 0177 (changesets); ADR 0463.
-->

The stackra theme's accent is neutral steel (ADR 0463, figentra/brand rules §31), superseding ADR 0319's steel blue.

- `accent` and `focus` are `oklch(0.546 0.03 252)` (`#647282`) light and `oklch(0.77 0.03 252)` (`#A7B6C7`) dark.
- `accent-hover` `#576574` / `#97A6B7`, `accent-pressed` `#495766` / `#8897A8`, `accent-soft` `#E6ECF3` / `#262C33`,
  `accent-soft-foreground` `#3C4958` / `#CED9E5`.
- Paper on the accent is 4.53:1 (light) and ink on the dark accent 9.42:1.
- The glass quiet buttons of ADR 0319 are unchanged. `assets/data/stackra/brand.json` gains the tagline
  ("One backend, every surface." / «أساس واحد، لكل واجهة.»).
