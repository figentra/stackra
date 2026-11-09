---
"@stackra/runway": minor
---

The white-label job starter (ADR 0439 decision 8, STA-2074). `startWhiteLabelJob(request)` turns the OS event
`white_label.build.requested.v1` into the mobile job's variant and runs `runMobileJob` for the event's app.
`whiteLabelVariantOf(event)` carries the scope, the entitlement keys and the identity parts the scope sets; a null,
empty or blank part is dropped, so the runway entry's stays. An event with no scope or app is refused before the job
runs. `WhiteLabelBuildRequested` and `WhiteLabelJobRequest` are exported.
