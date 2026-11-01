---
"@stackra/gen": patch
---

Gen's output now typechecks in consumers. The generated member module aliases a dependency's module class that shares
the member's own name (`PaymentsModule as StackraPaymentsModule`); a model that writes its own `[OptionalProps]` gets no
generated one that would redeclare it (TS2717); and a client leaves out an enum's schema constant nothing reads
(TS6133 under `noUnusedLocals`).
