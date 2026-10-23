---
"@stackra/ui": minor
---

Add `Chip` and `StatusBadge` to `./react` and `./native`, with `ChipVariant`, `ChipContractProps` and
`StatusBadgeContractProps` in `./contracts`. A chip is display only: `variant`, `tone`, `size`, `startIcon` and
`endIcon`, drawn the same on both runtimes with no props (`secondary`, `default`, `md`), and it takes no press handler.
`StatusBadge` is a neutral chip with a dot in the state's tone before its text, and never a live region.
