---
"@stackra/flow-preset": patch
"@stackra/renderers": patch
---

Figentra Flow's names, not the old ones (STA-2106): the preset's spec skill runs `fflow gate ci` and `fflow trace ci`,
its plan template no longer says "Vellum", and its keywords list `fflow`. The renderers' `generator` option names
`fflow` as its example. Flow's bundled `presets/stackra` gets the same text, so the copies stay byte for byte.
