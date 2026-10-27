---
"@stackra/sandbox": patch
---

`SandboxPool` kills and replaces a process that has not sent `ready` within the new `startupMs` pool option (30 seconds
by default) and refuses the run queued on it with `sandbox_code_failed`. A run's watchdog still arms on `ready`, so
start-up is never charged to a run (STA-1332).
