---
"@stackra/runway": minor
---

`runway evidence` judges `rollout` per target. A production Workers member with more than one traffic step and no
Durable Object migration is `true`; a migrating or single-step member, and every other declared target, is `false`; an
unknown is `null`. `rolloutDetail` adds `steps` and `floorReason`; `release.strategy` is no longer read.

Every Worker now moves production traffic in `[10, 50, 100]` steps by default. The `public-site`, `internal-tool` and
`cache` presets stay at one step, and a member can name its own. A Worker that was never deployed moves at once, since
there is no version to split with.
