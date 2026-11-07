---
"@stackra/gen": patch
"@stackra/runway": patch
"@stackra/cli": patch
---

Fixes from typechecking os on 0.17.1. Runway's eleven commands and `stackra runway` are `bin` commands, so no member
hosts them (their classes are not exported from `@stackra/runway/node`), and gen hosts console commands only from a
member's runtime `dependencies`, never its devDependencies. A hosted package's entities carry no `~defaults` marker its
published types lack, and a package-base override no longer imports a field hatch it does not use.
