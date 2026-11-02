---
"@stackra/cli": minor
"@stackra/console": patch
---

`stackra create <directory>` makes a new Stackra app in an empty folder: the banner, then the name, npm scope, edition
and package manager (each also a flag; `--yes` takes the defaults), the `@stackra/starter` profile from the Stackra
registry (or `--starter <dir|tgz>`), the doctor's checks for what the profile needs, then install, `stackra gen` shown
as a tree of what it wrote, type-check, tests and the first commit. `@stackra/console/node` exports `tarballSpecs`.
