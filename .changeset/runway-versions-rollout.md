---
"@stackra/runway": minor
---

The `cloudflare-workers` provider now ships each Worker as a version (ADR 0519, STA-1990): `wrangler versions upload`
with the commit as its message and the secrets on stdin, a smoke request routed to the version at 0% traffic by
`Cloudflare-Workers-Version-Overrides` (a failure moves no traffic), then `wrangler versions deploy`. A member may set
`rollout` (ascending percentages ending at 100); the `api` and `edge` presets use `[10, 50, 100]`, held five minutes
per step, in production only. A version with a Durable Object migration goes out at 100%. The first deploy of a new
Worker still needs one `wrangler deploy` by hand, since a version needs a deployment to split with. Rollback stays
`wrangler rollback` to the recorded version id.
