---
"@stackra/cli": minor
---

New `stackra encore:prepare`: in a service, pins `encore.dev` to the default catalog's version and writes tsconfig `baseUrl` and `paths` from package.json `imports`, the two things Encore needs to build the app at the member root. Run `pnpm install` after a pin change.
