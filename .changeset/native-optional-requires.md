---
"@stackra/tsdown-config": patch
"@stackra/ui": patch
"@stackra/identity": patch
---

<!-- Purpose: release note for `optionalRequires`. Boundary: changelog text only. Runtime: none. Governing contract: ADR 0025; STA-1722. -->

`library({ optionalRequires })` rewrites a native entry's shimmed `__require("expo-…")` of a listed optional peer back
to a literal `require` call, so Metro sees and bundles the peer; 0.2.0's `native.mjs` called it through the
`__require` shim, which Metro never resolves, so haptics, clipboard, pickers, video and Apple sign-in stayed off. Any
other `require` in a chunk fails the build.
