---
"@stackra/media": minor
---

`MediaLibrary.claim` checks a stored upload's bytes against the media type it declared (JPEG, PNG, GIF, WebP and PDF
signatures, the `ftyp` box for AVIF and MP4) and refuses a mismatch with `UploadRejectedError` reason `content`, deleting
the file, so an SVG or any other file renamed as an image is never accepted. `contentMatches` does the check (STA-2644).
