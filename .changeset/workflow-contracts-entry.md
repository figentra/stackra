---
"@stackra/workflow": minor
---

New `./contracts` entry holding `ServiceAcked`, `KeptRecords` and `KeptRecords$`. A service that only sends the ack
imports `@stackra/workflow/contracts` and gen hosts none of the workflow engine in it; the wire name stays
`workflow.service.acked.v1`. `.` still exports the same symbols (STA-2567).
