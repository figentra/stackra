---
"@stackra/gen": patch
---

An action or query whose only actor is anonymous now gets its HTTP route, served with `auth: false`, instead of no
route at all. Only a call whose actors include no user, agent or anonymous caller (a system-only job) has none.
