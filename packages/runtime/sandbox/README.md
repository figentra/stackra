# @stackra/sandbox

Stackra sandbox: the `Sandbox` service that runs one code step of a tenant's automation in QuickJS-WASM, the only place
tenant code runs (ADR 0154), and the `SandboxFetchProxy` port its `fetch` goes through.

**Tier:** `tier:lib` (`packages/runtime/sandbox`). Entries `.` and `./contracts`. Depends on `@stackra/contracts`,
`@stackra/container`, `@stackra/errors` and `quickjs-emscripten`.

## What is here

| Symbol                                                             | Entry         | Use                                                                          |
| ------------------------------------------------------------------ | ------------- | ---------------------------------------------------------------------------- |
| `Sandbox`                                                          | `.`           | `run({ code, input, limits, allowedOrigins, reference })` gives the output   |
| `SandboxCodeFailedError`                                           | `.`           | `sandbox_code_failed` (412): the code did not compile, threw, or is not JSON |
| `SandboxLimitExceededError`                                        | `.`           | `sandbox_limit_exceeded` (412): `limit` is `time`, `memory` or `output`      |
| `SandboxRequest`, `SandboxLimits`, `SandboxLimit`, `SandboxResult` | `.`           | the run's input, its bounds and what it gives back                           |
| `SandboxFetchProxy`                                                | `./contracts` | the audited egress the host binds; the only network a run has                |
| `SandboxFetchRequest`, `SandboxFetchResponse`                      | `./contracts` | what the proxy receives and answers                                          |

## Running a code step

```ts
import { Duration } from "@stackra/contracts";
import type { Sandbox } from "@stackra/sandbox";

const { output, logs, codeMs } = await this.sandbox.run({
  code: step.code, // the body of `async function (input) { ... }`
  input: run.results.previous,
  limits: {
    time: Duration.seconds(plan.codeSeconds),
    memoryBytes: plan.codeMemoryBytes,
    outputBytes: plan.codeOutputBytes,
  },
  allowedOrigins: settings.automationOrigins,
  reference: ctx.stepKey,
});
```

- **Code**: the body of an async function of `input`; what it returns is the output. JavaScript only: a TypeScript
  step is compiled to JavaScript before it is stored.
- **JSON in and out**: `input` is any JSON value; the returned value must have a JSON form (`undefined` gives `null`).
  It is read with the guest's own `JSON.stringify`, taken before the code runs, so replacing it changes nothing.
- **Guest globals**: the ECMAScript built-ins, `console.log` (each line comes back in `logs`) and `fetch`. No
  filesystem, process, module loader or timers. Each run gets a new QuickJS runtime, disposed when it ends.
- **Limits are data**: `time` (wall time, waits on `fetch` included), `memoryBytes` (the runtime's heap; deep
  recursion counts as memory) and `outputBytes` (the result's JSON and every logged line together). The caller reads
  them from the tenant's plan; this package holds no tier values.
- **Metering**: every run reports `codeMs`, in the result or in either refusal's details. The caller records it as
  `automation.code_ms` (ADR 0154 decision 8).

## Network

`fetch(url, { method, headers, body })` in the code resolves to a plain `{ status, headers, body }` (the body as text).
The URL's origin must be in the run's `allowedOrigins`, else the call rejects at once with
`fetch: <origin> is not an allowed origin`. An allowed request goes to the `SandboxFetchProxy` the host binds, with the
run's `reference` for the audit and an `AbortSignal` that fires when the run ends first. A proxy rejection reaches the
code as a rejected `fetch`.
