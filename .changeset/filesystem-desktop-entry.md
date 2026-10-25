---
"@stackra/filesystem": minor
---

Rename the `./electron` entry to `./desktop` (ADR 0345 decision 9). Import `ElectronFileSystemDriver` from
`@stackra/filesystem/desktop`; the `ElectronFileSystem` alias is gone.
