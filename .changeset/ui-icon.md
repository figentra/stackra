---
"@stackra/ui": minor
---

Add `Icon` to `./react` (on `lucide-react`) and `./native` (on `lucide-react-native`), with `IconContractProps`,
`IconComponent`, `IconComponentProps` and `TextTone` from `./contracts` and `ICON_SIZES` from `.`. It draws any Lucide
icon, or any component that takes `size`, `color` and `strokeWidth`, at `sm` 16, `md` 20 or `lg` 24 px and in a colour
role of the theme; it is hidden from assistive technology unless it has a `label`, and `isMirroredInRtl` flips the icons
that point the reading way. The native `DesignSystemProvider` now mounts a `LucideProvider` (`md`, the theme foreground),
so `lucide-react-native` is a peer of the whole `./native` entry; `lucide-react` is an optional peer of `./react`.
