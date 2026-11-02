---
"@stackra/gen": patch
---

Gen writes `.stackra/gen/i18n.ts` before it loads a member's resource classes, so a resource that takes its labels
from `#stackra/i18n` loads on a clean checkout instead of being refused as `resource_unloadable` (STA-1947).

The shared walk over a host's dependency manifests is renamed `dependencyContributionsOf` (was `contributionsOf`), so
it no longer shares a name with `@stackra/navigation/testing`'s `contributionsOf`.
