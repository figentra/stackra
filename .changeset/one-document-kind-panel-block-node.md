---
"@stackra/experience": minor
"@stackra/panel": minor
"@stackra/loyalty-kit": patch
---

One document-kind vocabulary and a unique block-node name (STA-1383).

- `@stackra/experience/contracts`: `ExperienceKind` gains `Dashboard` (`dashboard`), after `ThemeSection`.
- Breaking, `@stackra/panel`: `DocumentKind` is removed; `Document({ kind })` takes `ExperienceKind.Page` or
  `ExperienceKind.Dashboard` from `@stackra/experience/contracts` (same codes).
- Breaking, `@stackra/panel`: the `BlockNode` type (a panel document's table, widget or custom block) is
  `PanelBlockNode`, so `BlockNode` is only experience's renderer component.
