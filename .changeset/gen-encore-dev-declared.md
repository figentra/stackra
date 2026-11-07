---
"@stackra/gen": minor
---

A service must declare `encore.dev`: gen refuses one whose generated Encore files import it undeclared
(`generated_dependency_missing`), since Encore Cloud installs it from the service's package.json when it builds the
deploy commit. Add `"encore.dev": "catalog:"` to each service and `encore.dev: 1.58.8` (the Encore CLI version) to the
catalog.
