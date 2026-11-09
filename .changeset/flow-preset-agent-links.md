---
"@stackra/flow-preset": patch
---

The agents no longer name files that only core has, so a product's validate stops refusing them. A docs page is a link
to docs.stackra.figentra.com, a rule is named (the `linear` rule) rather than given its `.agents/rules/…` path, and
core-only files are named as core's, the same rewrite as Flow's bundled stackra preset (flow#198).
