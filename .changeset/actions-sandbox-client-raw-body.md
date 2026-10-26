---
"@stackra/actions": minor
---

Add the sandbox flag (`CallOptions.sandbox`, `CallDescriptor.sandbox`, `ctx.sandbox`) and the network client
(`CallOptions.client`, `ctx.client`, the `CallClient` type) to the call, a raw-body query output (`rawBody`,
`isRawBody`, `RawBody`), and let `toHaveAudited` assert the fields a `fakeActionContext()` passed to `ctx.audit`
(STA-1248).
