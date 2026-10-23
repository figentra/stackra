---
"@stackra/ui": minor
---

Add `Badge` with `Badge.Anchor` to `./react` (HeroUI v3) and `./native` (adapted: HeroUI Native has no badge, so it is
drawn on its `Chip` at the web badge's sizes), with `BadgeVariant`, `BadgePlacement`, `BadgeContractProps` and
`BadgeAnchorContractProps` in `./contracts`. A badge is a count or dot pinned to a corner of another element: its
`placement` is named by reading direction (`top-end` is top left in Arabic), it is hidden from assistive technology
unless it has a `label`, and it never takes a press.
