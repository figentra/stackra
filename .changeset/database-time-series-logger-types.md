---
"@stackra/database": patch
---

`TimeSeries` reads its options' field names as strings, and the observed MikroORM logger passes only a context with a
statement to MikroORM's own logger (a context without one is neither printed nor counted).
