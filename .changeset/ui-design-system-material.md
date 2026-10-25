---
"@stackra/ui": minor
---

`DesignSystemProvider` takes a `material` prop, the glass material's mode (ADR 0320), and sets it on
`<html data-material>`. It defaults to `solid`, so product UI is opaque; a showcase surface passes `glass`, `frosted`
or `liquid`. Unmounting puts back what the document had.
