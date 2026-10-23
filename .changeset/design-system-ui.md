---
"@stackra/ui": minor
---

New package, part of the Stackra Design System (ADR 0302): one component API for the web and native apps, with the
contracts shared, HeroUI v3 on the web and HeroUI Native with Uniwind on native. This release carries the shared
contracts (`Size`, `Tone`, `Variant`, `ColorScheme`, `Direction`, the provider props and state), `directionOf`, and a
`DesignSystemProvider` with `useDesignSystem` on each runtime (`./react`, `./native`): colour scheme, locale and text
direction. The components follow.
