---
"@stackra/repo-checks": minor
---

`stackra validate --repository` holds a service to what Encore needs at the member root: `dependencies.encore.dev` is the one allowed literal and must equal the default catalog's `encore.dev` (`catalog:` is refused), and its tsconfig carries `baseUrl` "." and `paths` equal to its package.json `imports`. A repository with services must gitignore `services/*/encore.app`. New exports: `checkEncoreService`, `catalogEncoreVersion`, `pathsOfImports`.
