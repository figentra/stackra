---
"@stackra/typescript-config": patch
---

The base preset excludes `stackra-encore/`, the folder where `stackra gen` writes a service's Encore services. A
member on tsc's default include, such as a service on the `node` preset, would otherwise typecheck those files, and
through them encore.dev's own sources, which the strict options refuse.
