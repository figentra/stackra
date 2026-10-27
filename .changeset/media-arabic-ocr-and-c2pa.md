---
"@stackra/media": minor
---

New `PaddleOcrTextExtractorDriver` (`./node`, `TextExtractor` `paddle_ocr`): OCR with Arabic through the self-hosted
PaddleOCR service at `media.ocr.endpoint` (set per region), boxes put in logical reading order, hints outside
`media.ocr.languages` refused. New `C2paContentCredentialsDriver` (`./node`, `ContentCredentials` `c2pa`): signs and
reads C2PA manifests with c2pa-rs, the certificate chain and key from the secrets `MEDIA_C2PA_SIGNING_CERTIFICATE` and
`MEDIA_C2PA_SIGNING_KEY`. New settings `media.ocr`, `media.c2pa`, `c2paSigningCertificate` and `c2paSigningKey`. New
dependency `@contentauth/c2pa-node` (catalog `media`). Both drivers are certification pending.
