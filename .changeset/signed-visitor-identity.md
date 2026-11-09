---
"@stackra/app": minor
"@stackra/gen": minor
---

An anonymous caller keeps one visitor id across requests. `serveGuardedCall` resolves the visitor from a signed token
(the `stackra-visitor` header, else the httpOnly `stackra_visitor` cookie) through `VisitorIdentityService`, and an
answer to a new visitor, or one signed with the previous key, carries the token back. The token is an HMAC-SHA-256
over the `anon_` id with the `STACKRA_VISITOR_SIGNING_KEY` secret (`STACKRA_VISITOR_SIGNING_KEY_PREVIOUS` is accepted
for rotation). Until the secret is set, every anonymous call is a new visitor, as before. Gen's adapter fills the
new `visitor` seam.
