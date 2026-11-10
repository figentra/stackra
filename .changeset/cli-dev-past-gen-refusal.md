---
"@stackra/cli": patch
---

`stackra dev --surface` and `stackra dev --product` go on when `stackra gen` refuses a member. gen already runs every
member and writes what it can before it exits 1, so one member's refusal no longer stops every surface: dev names the
refusal on stderr and serves with what gen wrote. Any other gen failure still stops dev, and a surface whose own
config gen did not write still stops as before. `stackra build` and `stackra gen --check` keep stopping on a refusal.
