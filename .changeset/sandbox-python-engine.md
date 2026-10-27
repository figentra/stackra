---
"@stackra/sandbox": minor
---

Run Python code steps in Pyodide inside `SandboxPool` processes (ADR 0434 decision 1): `SandboxRequest.language`
(`SandboxLanguage`, `javascript` by default), the same limits, refusals and fetch proxy as JavaScript, Pyodide loaded
once per process on its first Python request and the process replaced after its Python run. The pool now starts its
processes with an empty environment, checks every relayed fetch's origin against the run's allow-list, audits it under
the run's own reference, and lets a process restart its run's clock only once. `Sandbox.run` refuses a Python request.
`fetch(url, init)` with a non-object `init` is now refused (`fetch: the options are an object`).
