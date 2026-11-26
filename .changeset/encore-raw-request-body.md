---
"@stackra/app": patch
"@stackra/gen": patch
---

A Stackra service under `encore run` no longer crashes on a request with a body. The generated HTTP adapter turned
Encore's raw request into a web stream with `Readable.toWeb`, whose end-of-stream cleanup calls
`req.req.removeListener`; Encore keeps its native request, which is no emitter, in `req`, so every POST, PUT or
PATCH threw "stream.req.removeListener is not a function". `@stackra/app/server` now exports `nodeBodyStream`, which
reads the body through plain listeners with backpressure (the cap stays `HttpConfig.maxBodyBytes`), and the adapter
uses it (STA-2794).
