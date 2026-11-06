---
"@stackra/documents": patch
---

The Word renderer decodes its Base64 output with `@stackra/support`'s `decodeBase64` instead of its own
copy, so the name `bytesOfBase64` has one home (`@stackra/outbox`) and the duplicate-export check passes.
