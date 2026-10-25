---
"@stackra/sandbox": minor
---

Add `@stackra/sandbox`: the `Sandbox` service that runs a tenant's automation code step in QuickJS-WASM (a fresh
runtime per run, JSON in and out, no filesystem, time, memory and output limits passed as plan data, `fetch` only to
allow-listed origins through the `SandboxFetchProxy` port), with `codeMs` on every run for metering and the
`sandbox_code_failed` and `sandbox_limit_exceeded` refusals.
