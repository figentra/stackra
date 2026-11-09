---
"@stackra/actions": minor
"@stackra/app": minor
"@stackra/gen": minor
---

An action whose actors are exactly `[ActorKind.Anonymous]` may declare `credentials: "ignore"`, for a public page whose visitors may also be signed in elsewhere. The pipeline then runs a signed-in caller's call as a fresh anonymous actor and drops what the credential gave, and `serveGuardedCall` never verifies or holds that credential, so no user token is forwarded. Without the option such an action still refuses a signed-in caller. `Action({...})` throws, and gen refuses `credentials_ignore_not_anonymous`, when the actors are anything else.
