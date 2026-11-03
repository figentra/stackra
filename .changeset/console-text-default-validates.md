---
"@stackra/console": patch
---

A text prompt's default can be accepted with Enter when the field has a constraint: the Clack prompter checks the
default rather than the empty input (`--name must be at least 3 characters, got ""` no longer blocks it).
