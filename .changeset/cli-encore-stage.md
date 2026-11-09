---
"@stackra/cli": minor
---

New command `stackra encore:stage` for a repository whose services share one Encore app: OS, commerce, pay and billing. Run it at the repository root after `stackra gen`. It writes the app root Encore builds at `.stackra/encore-app/`:

- it copies every service and the workspace packages they reach;
- it rewrites each copy's `#` imports as relative paths;
- it writes the root files: one `encore.app`, `encore.dev` pinned to the catalog version, and tsconfig `paths` to the staged package sources.

A `#` import that no `imports` map resolves fails the command. Build and deploy from that folder (Encore Cloud Root Directory `.stackra/encore-app`), in CI after gen. A single-service product keeps `stackra encore:prepare` and its member root.
