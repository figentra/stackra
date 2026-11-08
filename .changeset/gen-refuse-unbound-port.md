---
"@stackra/gen": patch
---

`stackra gen` refuses (`port_unbound`) a class whose constructor takes a port that no driver binds in the member, instead of letting every container-built test fail with `UnresolvedPortError`.
