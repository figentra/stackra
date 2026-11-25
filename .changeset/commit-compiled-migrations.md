---
"@stackra/gen": minor
"@stackra/runway": minor
---

A service's compiled migrations are committed, and an Encore deploy applies exactly the committed SQL (STA-2788). `stackra gen` still writes `.stackra/migrations/*.sql` and the Encore copy in `stackra-encore/<member>/migrations/`, but both are now committed output, like `stackra.manifest.json`: `stackra gen --check` fails on a changed, missing or leftover file, a write run removes leftovers in both folders, and a manifests pass no longer deletes them. Runway's Encore Cloud deploy ships those files as the source commit holds them and refuses a working tree whose gen wrote different, extra or missing SQL, so the SQL a pull request shows (and Squawk lints) is the SQL Encore runs. To adopt: stop ignoring `**/.stackra/migrations/` and `**/stackra-encore/*/migrations/` in `.gitignore` (see Stackra's own), run `stackra gen` in every service and commit the compiled migrations before the next deploy; until then the deploy refuses.
