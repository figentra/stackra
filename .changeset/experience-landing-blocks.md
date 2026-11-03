---
"@stackra/experience": minor
---

The thirteen blocks of the Stackra landing. `./react` has the components `SiteHeader`, `HeroMachine`, `CtaRow`,
`Statement`, `ChapterTitle`, `Station`, `StepSwitcher`, `BentoGrid`, `TerminalStage`, `MonoDisplay`, `AskAi`,
`ProductCards` and `SiteFooter`; `.` has each one's `Block` class (`HeroMachineBlock` and so on), which declares the
document props as `LocalizedText` and derives the key (`web.hero_machine`). They draw the blueprint direction (ruled
sections, schematic windows, the station rail) on `@stackra/ui` and its blueprint token roles; art is drawn by
`Illustration` from token-coloured mask layers, and every word comes in props.
