---
"@stackra/tokens": minor
---

The stackra theme gains the champagne core beside the steel accent (ADR 0520, brand rules §39): palette roles `core`,
`core-strong`, `core-hover`, `core-pressed`, `core-soft` and `core-foreground`, held to the brand's hex and to AA in
`STACKRA_CONTRAST_PAIRS` (`core` 3:1 as large display text and art, `core-strong` 8.22:1 with paper). No existing value
changes, and no other theme needs the core. The web stylesheet registers every palette and syntax colour as a Tailwind
colour (`--color-<name>: var(--<name>)` in `@theme inline`), as the native one already did, so `text-core-strong` and
`bg-core-strong` resolve on both; it draws `.button--core`, HeroUI's primary on the core, falling back to the accent in a
theme without one. The native stylesheet writes `--radius-pill` as the web does (STA-2015).
