---
"@stackra/gen": patch
---

`endpoint_area_mismatch` now accepts a public call under RFC 8615's `/.well-known/`. A well-known path is a convention across hosts, not an area route. Checkout's `GET /.well-known/stackra/frame-ancestors`, the edge's frame-ancestors callback, was refused before.

Only the public area gets this. A call in any other area under `/.well-known/` is still refused, and the method, collision and version checks apply as before.
