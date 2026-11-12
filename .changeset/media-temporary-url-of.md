---
"@stackra/media": minor
---

`MediaLibrary.temporaryUrlOf(bucket, path, expiresIn)` signs a temporary URL from a stored path of a bucket. A product that kept only an archive's path, not its `MediaFile`, can now link it without rebuilding the file (INVOICING). It signs only a file of the bucket it is given: a path outside `<visibility>/<bucket>/`, or one with a `..` segment, throws a `TypeError`.
