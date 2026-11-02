---
"@stackra/runway": minor
---

Add the `cloudflare-workers` provider (STA-1921, ADR 0352 decision 1). `CloudflareWorkersProviderDriver` in
`@stackra/runway/node` deploys every Worker member listed in `targets.cloudflare-workers.members` that ships under the
target's kind. For each member it builds with turbo and puts the real binding ids (by environment variable name) into
`wrangler.jsonc`, restoring the file afterwards. It then applies the D1 migrations and runs
`wrangler deploy --message <sha>` with the named vars. Last, it sets the named secrets with `wrangler secret bulk`, on
stdin only. `current` reads the commit back from `wrangler deployments list`, `verify` also checks each member's smoke
URL, and `rollback` returns each member to its recorded version. `CommandRunner` takes an optional `input` for
standard input, and `deploy()` takes an optional `kinds` filter.
