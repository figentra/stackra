---
"@stackra/gen": minor
"@stackra/actions": minor
---

**Route change for anonymous-only calls.** An action or query whose actors are exactly `[ActorKind.Anonymous]` (served
with `auth: false`) now defaults to the `public` API area, in gen and at runtime, so its route is `/public/...` and it
sits where no gate asks for a principal. A written `area` still wins, and a call with any other actor keeps the
service's area or `app`. Gen's identity lock accepts the move under the call's own area, as for STA-340. What a product
does on its bump: run `stackra gen` and commit the regenerated `stackra.manifest.json` and `openapi.json`.
