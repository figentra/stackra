---
"@stackra/gen": minor
"@stackra/runway": minor
"@stackra/repo-checks": patch
---

A service's compiled migrations are committed, and an Encore deploy applies exactly the committed SQL (STA-2788). `stackra gen` still writes `.stackra/migrations/*.sql` and the Encore copy in `stackra-encore/<member>/migrations/`, but both are now committed output, like `stackra.manifest.json`: `stackra gen --check` fails on a changed, missing or leftover file, a write run removes leftovers in both folders, and a manifests pass no longer deletes them. Runway's Encore Cloud deploy ships those files as the source commit holds them and refuses a working tree whose gen wrote different, extra or missing SQL, so the SQL a pull request shows (and Squawk lints) is the SQL Encore runs. To adopt: stop ignoring `**/.stackra/migrations/` and `**/stackra-encore/*/migrations/` in `.gitignore` (see Stackra's own), run `stackra gen` in every service and commit the compiled migrations before the next deploy; until then the deploy refuses.

A package with migrations of its own also commits and ships their compiled SQL, `src/node/database/compiled-migrations/<module>_<NNNN>_<stem>[_<step>].{up,down}.sql`, each step byte for byte as a host service's stream holds it, checked by `stackra gen --check` the same way. A host's gen refuses a declared package installed from a registry whose shipped SQL differs from what its migrations compile to in the host (`migration_package_drift`), so the SQL a host applies is the SQL the package committed and Squawk linted; a package that ships no such folder (an earlier version) is compiled as before.

`stackra validate --repository` accepts `tools/scripts/squawk-baseline.jsonc` as JSONC (`MUST_STAY_JSONC`): its reader, the Quality Gate's dependency-free `squawk-baseline.mjs`, has no YAML parser.
