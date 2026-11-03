---
"@stackra/experience": minor
---

The fifteen blocks of the Stackra landing. `./react` has the components `SiteHeader`, `HeroMachine`, `CtaRow`,
`Statement`, `ChapterTitle`, `Station`, `StepSwitcher`, `Surfaces`, `BentoGrid`, `TerminalStage`, `MonoDisplay`,
`AskAi`, `ProductCards`, `SiteFooter` and `PageDock`; `.` has each one's `Block` class (`HeroMachineBlock`,
`SurfacesBlock`, `TerminalStageBlock`, `PageDockBlock` and so on), each in its own folder so gen's key rule gives it
`experience.<name>` (`experience.hero_machine`). The classes declare the document props in shapes gen's schema reader
accepts: words as `LocalizedText`, nested shapes as `Schema` classes, closed choices as enums and numbers with `@Int`
or `@Num`. The hero draws its machine, the action window piped into web, desktop and phone surfaces; the dock narrates
the stations. They draw the blueprint direction (ruled sections, schematic windows, the station rail) on `@stackra/ui`
and its blueprint token roles; art is drawn by `Illustration` from token-coloured mask layers, a dither band's poster
comes per scheme, and every word comes in props.
