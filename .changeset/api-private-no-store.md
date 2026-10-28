---
"@stackra/app": minor
"@stackra/gen": patch
---

Add `apiCacheControl` to `@stackra/app/server` (ADR 0325 rule 22): an API answer to a signed-in request (an
`Authorization` header or any cookie) or an answer that sets a cookie is `private, no-store`, over the handler's own
header. The generated HTTP adapter (`answerHttp`) applies it to every answer (STA-1448).
