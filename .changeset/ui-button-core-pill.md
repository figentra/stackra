---
"@stackra/ui": minor
"@stackra/showcase": patch
---

Button gains `variant="core"` and `shape="pill"`, and Heading and Text gain `tone="core"`, for the Stackra champagne
core (STA-2016). `core` draws HeroUI's primary filled by the theme's `core-strong` (web `button--core`, native
`bg-core-strong`). A pill takes the theme's `--radius-pill`. Heading draws `core` at the looks h1 to h4 and
`core-strong` below; Text always draws `core-strong`. Until `@stackra/tokens` ships the core roles (STA-2015), a core
button draws as the primary and core text keeps its default colour. The showcase API pages carry the new props.
