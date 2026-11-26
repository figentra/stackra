# Threat model: @stackra/media

<!--
Stackra file contract:
Purpose: the threat model of @stackra/media: buckets, signed direct uploads and their claim, private and public files,
         malware scanning, image transforms, text extraction and OCR, and C2PA content credentials.
Boundary: documentation only; the code wins on any difference. A change that adds an asset, a trust boundary or an
          external call updates this file in the same pull request (constitution SEC10).
Runtime: none
Governing contract: constitution SEC10; ADR 0222; ADR 0465; ADR 0234; ADR 0207 (amendment of 2026-11-26: the ASVS
                    level); STA-316.
-->

ASVS level: L1 for every chapter; V12 (files and resources) is this package's own (ADR 0207, amendment of 2026-11-26).
Reviewed: 2026-11-26 (STA-316).

Users upload files straight to object storage with a short-lived signed URL; a service claims the upload into a
bucket, transforms images and extracts text. The bytes never pass through a service. The threats are malicious or
oversized files, a file claimed into the wrong place, and private files reachable by anyone.

## Assets

| Asset                            | Where it lives                                                                | Class      |
| -------------------------------- | ----------------------------------------------------------------------------- | ---------- |
| Uploaded files                   | the `FileSystem` disk: `uploads/` until claimed, then `<visibility>/<bucket>` | `pii`      |
| Signed upload URLs               | `upload.create` output, returned to the caller only                           | `secret`   |
| Upload records                   | `uploads/<id>.json`, beside the object, unreachable by the client             | `internal` |
| C2PA signing certificate and key | `MEDIA_C2PA_SIGNING_CERTIFICATE`, `MEDIA_C2PA_SIGNING_KEY`, read blind        | `secret`   |
| Scans sent to OCR                | the in-region OCR service only, which keeps nothing                           | `pii`      |

## Trust boundaries

1. The client to `media.upload.create@1` (L2), then directly to object storage with the signed URL.
2. An action claiming the upload token into a bucket.
3. The service reading stored bytes for scanning, transforms and extraction.
4. The CDN serving `public/*`; private files through `temporaryUrl` only.

## Threats and controls

| Threat                                                  | Control today                                                                                                                                 | Open work                                                                |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| A file of a forbidden type or size is stored            | The bucket's types and size are checked before signing and again at claim; a mismatch deletes the file and its record (`UploadRejectedError`) | An Encore bucket signs no type header, so the claim trusts the sent type |
| An active SVG or HTML file runs script from our origin  | SVG is not a media type; files are served from the CDN, not the app origin                                                                    | —                                                                        |
| Malware is uploaded and served to other users           | A `FileScanner` port (GuardDuty tags, ClamAV `INSTREAM`) gives `clean`, `infected`, `pending`, `failed`                                       | Serve no file before its scan passes, STA-669                            |
| A token is claimed into another bucket, twice, or late  | The claim refuses another bucket, an expired record and a missing file; the record is deleted on claim, so a second claim finds nothing       | —                                                                        |
| A private file is fetched by anyone who has its address | Private files are not under `public/*`, which is all the CDN serves; reads use `temporaryUrl` with a short lifetime                           | Parent visibility checked before an attachment is served, STA-1960       |
| Location or device data leaks through image metadata    | `ImageTransformer` re-encodes without metadata                                                                                                | —                                                                        |
| A crafted image or PDF exhausts the service             | Size limits per bucket before upload; transforms and extraction run server-side on stored bytes                                               | Load shedding and bulkheads, STA-1467                                    |
| A forged or untrusted content credential is accepted    | C2PA manifests are verified with the c2pa-rs engine                                                                                           | Refuse Valid-but-not-Trusted manifests, STA-2791                         |
| Scans leave the region for OCR                          | OCR goes only to `media.ocr.endpoint`, the in-region service                                                                                  | —                                                                        |
