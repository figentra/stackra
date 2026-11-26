---
"@stackra/gen": minor
"@stackra/runway": patch
---

A service's runway queue settings now reach its generated Encore subscriptions (STA-2050). Each queue's subscription
gets an `ackDeadline` equal to the largest `visibilityTimeoutSeconds` any environment of the service's `runway.yaml`
gives the queue, so a job that runs longer than 30 seconds is no longer handed to a second worker. A `dlq: false` on a
job queue is the new warning `queue_dlq_unsupported`, since Encore always dead-letters a message once its retries run
out. Discovery fills the new `MemberIR.queueSettings`, and `QueueSettings` is exported. Runway's service environment
schema documents that a queue's settings size the Encore subscription its jobs ride.
