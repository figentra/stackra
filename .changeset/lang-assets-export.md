---
"@stackra/access-log": patch
"@stackra/achievements": patch
"@stackra/cli": patch
---

`@stackra/access-log` and `@stackra/achievements` export `./assets/*`, so a host's generated i18n can import their
`assets/lang` catalogues (TS2307 before). `stackra validate --repository` refuses a package with `assets/lang/` that
does not export `./assets/*` or leaves `assets` out of `files` (STA-1798).
