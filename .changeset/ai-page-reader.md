---
"@stackra/ai": minor
---

Add the `PageReader` port (`./contracts`, ADR 0450): `read(url)` returns a `PageReading` (final URL, status, title,
language, readable text and schema.org `ProductHint`s) or a `PageReadRefusal` code. Add `MemoryPageReaderDriver` and
`HttpPageReaderDriver`, which checks every URL and redirect with `checkEgress` and takes its limits as a
`PageReaderPolicy` from settings, plus the shared `parsePage` (STA-904, STA-929).
