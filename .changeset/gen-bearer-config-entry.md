---
"@stackra/gen": patch
---

A class gen names in a wiring comes from the entry that really exports it. `BearerConfig` is imported from
`@stackra/app/server`, both in the follow-the-system row and in a package manifest's driver, service and config
entries, which now name the entry whose barrel exports the class (`@stackra/app`'s configs live in `src/config` but are
exported from `./server`). Before, every service declaring `@stackra/app` failed typecheck on 0.21.0 with
`Module '"@stackra/app"' has no exported member 'BearerConfig'`. A new test checks every class gen names by hand
against the real package entry.
