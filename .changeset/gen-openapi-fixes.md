---
"@stackra/gen": patch
---

`openapi.json` is valid OpenAPI 3.1 and says more: no root `$comment` (the notice is `x-stackra-generated`), a `bearer` security scheme required at the root, an `Idempotency-Key` header on every write, and refusals as one response per HTTP status with `code` and `category` enums. Public id patterns take the Crockford base32 body (no I, L, O or U); the client decoder and the break check still read the earlier body. A shape built on a consumed shape keeps that shape's fields in the manifest. Regenerate with `stackra gen`.
