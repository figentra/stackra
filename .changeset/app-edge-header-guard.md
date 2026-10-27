---
"@stackra/app": minor
---

Add the signed edge-header guard (ADR 0437 decision 4): `EdgeHeaderGuard`, the first `RequestGuard`, accepts
the Worker's identity headers only with an HMAC under one of the active signing keys (two during a rotation), a
timestamp inside the 60-second window and an unseen request id, and refuses with `EdgeSignatureInvalidError`.
`signEdgeRequest` (`.`) fixes the signed bytes for the Worker and the API; the `EdgeSigningKeys` and
`EdgeNonceStore` ports (`./contracts`) ship with `memory` drivers.
