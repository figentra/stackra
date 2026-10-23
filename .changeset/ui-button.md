---
"@stackra/ui": minor
---

Add `Button`, `IconButton` and `CloseButton` to `./react` (HeroUI v3) and `./native` (HeroUI Native), with
`ButtonVariant`, `ButtonContractProps`, `IconButtonContractProps` and `CloseButtonContractProps` in `./contracts`. One
props API on both runtimes: `variant` (the seven HeroUI variants), `size`, `isDisabled`, `isLoading`, `isFullWidth`,
`startIcon`, `endIcon`, `label` and `onPress`; every other HeroUI prop, the native press feedback included, passes
through. `IconButton` and `CloseButton` require a `label`. A loading button refuses presses and keeps focus on web, and
reports `busy` with a spinner in the label colour on native, where the content also sits in a `LucideProvider`.
