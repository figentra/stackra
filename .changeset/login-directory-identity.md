---
"@stackra/identity": minor
---

Add the login directory writer (ADR 0451, STA-752): `loginDirectoryPrefix`, `LoginDirectoryStore`, `LoginIdentifierKind`,
`LoginIdentifier` and `LoginDirectoryKey` in `./contracts`; `LoginDirectoryWriterService`, `LoginDirectoryConfig` (with
`LoginDirectoryConfig$` and `LoginDirectoryOptions`, key `login_directory`, secret `IDENTITY_LOGIN_DIRECTORY_KEY`) and
`MemoryLoginDirectoryStoreDriver` in `.`.
