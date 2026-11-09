---
"@stackra/documents": minor
---

A print template takes an optional `brand` slot (`{ logo?, accent? }`, paths into the render data). The HTML and PDF
renderer places the logo (a PNG or JPEG `ImageAsset`) above the first block and colours the title and the table rules
with the accent (`#RRGGBB`). Every block renders exactly as it would without a brand, and an unusable value is ignored,
never refused. `ResolvedDocument` gains `brand` (STA-2644).
