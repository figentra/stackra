---
"@stackra/database": patch
---

`usePostgres()` uses the integration-tier image as it is when Docker already has it under its tag (built before, or
preloaded), and otherwise builds it with the process's `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY` passed as build
arguments, so its `apt-get` reaches the mirrors on a machine whose only way out is a proxy (a testbed job, STA-2572).
