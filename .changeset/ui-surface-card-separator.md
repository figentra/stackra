---
"@stackra/ui": minor
---

Add `Surface`, `Card` and `Separator` to `./react` (HeroUI v3) and `./native` (HeroUI Native), with `SurfaceVariant`,
`SeparatorVariant`, `Orientation` and the four props contracts in `./contracts`. `variant` is the surface level on
`Surface` and `Card` and the colour level on `Separator`; `Card` has the parts `Header`, `Title`, `Description`,
`Content` (HeroUI Native's `Body`) and `Footer`, and `Card.Title` takes a heading `level` (default 3). Every other
HeroUI prop passes through. On native, `Separator` paints its level with the theme colour and HeroUI Native's own
`thin` and `thick` variants are not part of the type.
