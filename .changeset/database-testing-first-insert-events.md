---
"@stackra/database": patch
---

The testing tier publishes an event a model records after its last flush, such as the first event recorded on the row
`insert` returned: at commit it takes what every model the transaction holds recorded, not only the changed ones.
