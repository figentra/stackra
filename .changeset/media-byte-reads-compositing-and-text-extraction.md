---
"@stackra/media": minor
---

`MediaDisk.read(path)` gives the stored bytes for server-side work (memory and S3 disks; `FileNotFoundError` when
missing). New `SharpImageTransformerDriver` (`./node`, `ImageTransformer` on sharp): EXIF orientation, fit inside the
box without enlarging, composite `layers` (`ImageLayer`: `left`/`top` or `gravity`), re-encode without metadata. New
`DocumentTextExtractorDriver` (`./node`, `TextExtractor`): DOCX body and PDF text layer read in process, so the file
stays in region (R3-SO-13); it reports the language hints whose script it found. New dependencies sharp, unpdf and
fflate (catalog `media`). Breaking for a custom `MediaDisk` driver: it must implement `read`.
