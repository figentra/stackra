---
"@stackra/runway": minor
---

`runway validate` warns on every Mintlify field a root runway still sets (ADR 0514): `providers.mintlify`,
`targets.mintlify` and a `mintlify` destination. The docs app is a Fumadocs site on a Worker, deployed by
`cloudflare-workers`. The fields stay accepted for one release; the `mintlify` driver goes with them.
