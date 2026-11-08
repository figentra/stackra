---
"@stackra/cli": patch
---

`stackra gen` and `stackra gen --check` at a workspace root now print the warnings of every member, also members
that pass, and end with a line such as `gen: N warning(s) in M member(s)`. Before, a member's warnings only showed
when that member failed. Warnings never change the exit code.
