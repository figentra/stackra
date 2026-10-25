---
"@stackra/filesystem": minor
---

Add the Google Cloud Storage disk: `GcsFileSystemDriver` in `./node` (`disk: gcs`), with the `filesystem.gcs`
settings (`bucket`, `projectId`), V4 signed temporary URLs and Application Default Credentials, for the in-country
GCP environments of ADR 0354.
