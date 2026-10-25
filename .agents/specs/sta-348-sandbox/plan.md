# Plan: `@stackra/sandbox`

**Spec**: `.agents/specs/sta-348-sandbox/spec.md`

## Design

- `./contracts`: the `SandboxFetchProxy` port (`fetch(request, reference, signal)`) and its request and response types.
- `.`: `Sandbox` (injects `SandboxFetchProxy`), `SandboxCodeFailedError`, `SandboxLimitExceededError` and the request,
  limits, limit and result types.
- `run`: validate the time limit and origins; new QuickJS runtime and context; take the guest's `JSON.parse` and
  `JSON.stringify`; install `console.log` (budgeted against `outputBytes`) and `fetch` (deferred guest promise, allow-list
  check, proxy call, drain jobs on settle); set the memory limit, a fixed stack bound and an interrupt at the deadline;
  compile `async function (input) { code }`, call it, `resolvePromise` and race it against a stop (timer, job failure,
  host error). Classify failures on the host: deadline, output budget, `out of memory`/`stack overflow`, else the
  code's error. Always abort the proxy signal, dispose pending deferreds, held handles, the context and the runtime.
