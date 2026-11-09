---
"@stackra/branding": minor
---

`BrandReader#bytes(image)` reads a resolved brand image's original bytes from the media disk, so a surface that embeds
it (a printed document's logo) never fetches its URL. It returns `null` when the file has gone (STA-2644).
