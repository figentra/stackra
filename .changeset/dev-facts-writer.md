---
"@stackra/runway": minor
"@stackra/cli": minor
"@stackra/repo-checks": patch
---

`writeDevFacts(root, lane)` in `@stackra/runway/node` writes `.stackra/dev/ports.json`, the file `readDevFacts` reads: each member runway's dev url, port, host, https, TLS files and Electron dev ports with the lane offset applied. `stackra dev` calls it before the member tool starts (lane from `STACKRA_LANE`, default 0). The app runway's `environments.<env>.desktop.devtools` is now read, so it leaves `RUNWAY_UNREAD_FIELDS` and its "Not read yet" schema note.
