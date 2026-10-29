---
"@stackra/typescript-config": patch
---

The `library` and `react` presets (and so `decorators` and `decorators-react`) include `.stackra/entry`, the entries gen
writes, so tsdown's dts step emits their declarations instead of failing with "tsgo did not generate dts file".
