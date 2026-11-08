---
"@stackra/database": patch
"@stackra/ui": patch
"@stackra/app": patch
"@stackra/notifications": patch
"@stackra/repo-checks": patch
---

Peers no longer fork a product's install. pnpm gives a package one variant per set of resolved peers, so an optional
peer one member installs and another does not split every dependent in two: a product with connectors (react-dom for
their tests) and a pglite service resolved two copies of @stackra/integrations, whose classes then failed each other's
checks. `@stackra/database`'s test-only packages (PGlite and its extensions, Faker, Testcontainers) are no longer peers:
its testing entry loads them from the member running the tests, as their devDependencies. `react-dom` is a required peer
of `@stackra/ui`, `@stackra/app` and `@stackra/notifications`. `stackra validate` refuses a test-only package as a
library's peer and an optional `react-dom` (`forking-peers`).
