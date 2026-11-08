---
"@stackra/workflow": minor
---

A step's retry can come from settings: `@Step({ retry: { attempts, base, backoff, live } })`. `base` sets the first
wait (the queue's 10 s when absent) and `live(workflow)` reads values that replace the declared attempts, first wait
and curve each time the step fails, so a changed setting applies to the next retry. A bad or failed read keeps the
declared values.
