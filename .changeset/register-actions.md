---
"@stackra/gen": minor
"@stackra/iam": minor
"@stackra/repo-checks": minor
---

Gen writes one `registerActions([...])` in each member's `#stackra/registrations`, a row per action and query with its
locked key, permission, risk, effects and input schema, so the pipeline validates input and checks the permission of
every call. `IamAccessControlDriver` now refuses a call with no registered permission instead of letting it through,
and lets an anonymous caller past `require` and `authorize` only for a class whose `actors` list `anonymous`; the
manifest marks such a call `anonymous: true` and its OpenAPI operation takes no security. `stackra validate` lists
every anonymous-callable call, and a test pins today's five (STA-2025).
