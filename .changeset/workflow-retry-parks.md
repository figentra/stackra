---
"@stackra/workflow": minor
---

A failed step's retry no longer waits out its backoff in process. The run parks like a timed wait (the step waiting
with its next attempt's time and the failure it keeps), the caller answers at once with the output so far, and the
worker's tick runs the attempt when it is due. A backoff at or under the new config `workflow.retryInlineMax`
(default `"0s"`) still waits in process. A step that waits for a signal keeps waiting out its retry in process for now.
