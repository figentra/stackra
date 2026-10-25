---
"@stackra/media": minor
---

Add the `FileScanner` port with `ScanVerdict` and the `memory` (EICAR), `clamav` (clamd `INSTREAM`) and `guard_duty`
(GuardDuty Malware Protection tag) drivers, chosen by the new `media.scanner` and `media.clamav` settings (ADR 0354).
Add the `ImageTransformer`, `TextExtractor` (Arabic-capable OCR) and `ContentCredentials` (C2PA) ports in
`./contracts`.
