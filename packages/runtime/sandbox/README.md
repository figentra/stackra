<!--
Stackra file contract:
Purpose: the consumer guide of @stackra/sandbox: what it exports, how to run a JavaScript, Python or TypeScript code step, the process pool and the network rules.
Boundary: documentation only; packages/runtime/sandbox.
Runtime: none (Markdown)
Governing contract: ADR 0154; ADR 0434.
-->

# @stackra/sandbox

Stackra sandbox: the `Sandbox` service that runs one code step of a tenant's automation in QuickJS-WASM, the only place
tenant code runs (ADR 0154), the `SandboxPool` that runs steps in child processes (JavaScript, and Python in Pyodide),
and the `SandboxFetchProxy` port every `fetch` goes through.

**Tier:** `tier:lib` (`packages/runtime/sandbox`). Entries `.`, `./contracts` and `./node`. Depends on `@stackra/contracts`,
`@stackra/container`, `@stackra/errors`, `quickjs-emscripten` and `pyodide` (loaded only by a pool process that gets a
Python step).

## What is here

| Symbol                                                             | Entry         | Use                                                                          |
| ------------------------------------------------------------------ | ------------- | ---------------------------------------------------------------------------- |
| `Sandbox`                                                          | `.`           | `run({ code, input, limits, allowedOrigins, reference })` gives the output   |
| `SandboxCodeFailedError`                                           | `.`           | `sandbox_code_failed` (412): the code did not compile, threw, or is not JSON |
| `SandboxLimitExceededError`                                        | `.`           | `sandbox_limit_exceeded` (412): `limit` is `time`, `memory` or `output`      |
| `SandboxRequest`, `SandboxLimits`, `SandboxLimit`, `SandboxResult` | `.`           | the run's input, its bounds and what it gives back                           |
| `SandboxLanguage`                                                  | `.`           | `javascript` (default) or `python` (pool only)                               |
| `SandboxFetchProxy`                                                | `./contracts` | the audited egress the host binds; the only network a run has                |
| `SandboxFetchRequest`, `SandboxFetchResponse`                      | `./contracts` | what the proxy receives and answers                                          |
| `SandboxPool`, `SandboxPoolOptions`                                | `./node`      | runs in a fixed pool of child processes, fetches relayed to the host's proxy |
| `serveSandboxChild`                                                | `./node`      | the body of a pool process                                                   |
| `compileTypeScriptStep`                                            | `./node`      | a TypeScript step's types erased, once, when the step is saved               |

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

## Process isolation

```ts
pool.open({ size: settings.sandboxProcesses, graceMs: settings.sandboxGraceMs }); // deployment settings
const result = await pool.run(request); // same request, result and refusals as Sandbox.run
await pool.close();
```

`SandboxPool` keeps `size` child processes, each running one `Sandbox` run at a time, and queues the rest (a Python
run is a process's last, see below). A guest `fetch` is relayed back over IPC to the `SandboxFetchProxy` bound in the
host, so egress stays audited in one place. A run that outlives its time limit by `graceMs`, counted from when its process says it serves (start-up is never charged
to a run), has its process killed (`sandbox_limit_exceeded`, limit `time`); a process that dies mid-run refuses that
run only (`sandbox_code_failed`) and is replaced (ADR 0434).

## Python steps

```ts
const { output, logs, codeMs } = await pool.run({
  ...request,
  language: "python",
  code: step.code,
});
```

- **Code**: the body of `async def step(input)`; what it returns is the output (`None` gives `null`). It is wrapped
  as a syntax tree, so strings and line numbers stay as the tenant wrote them. `print` lines come back in `logs`;
  `await fetch(url, {"method", "headers", "body"})` gives a dict `{status, headers, body}` through the same allow-list
  and proxy. Only the Python standard library is there; no package is installed and no host file is mounted.
- **Only in the pool**: `Sandbox.run` refuses `language: "python"`. A process loads Pyodide (once, taking seconds) when
  its first Python request arrives and then says it serves again, so the load is never charged to the run.
- **One run per process**: one interpreter cannot keep runs apart (shared modules and builtins), and Pyodide's FFI can
  reach the process's JavaScript, so the process is the boundary. After a Python run the pool replaces the process.
  Processes start with an empty environment, the pool checks every relayed fetch's origin again, uses the run's own
  `reference` for the audit, and lets a process restart its run's clock only once. A host can tighten a process
  further with Node's permission flags through `execArgv`, and should give the pool's processes no direct egress.
- **Same limits**: `time` stops a step while it awaits; a loop that never awaits is stopped by the pool's watchdog at
  the limit plus `graceMs`. `memoryBytes` bounds the growth of WebAssembly memory during the run (`MemoryError` and
  `RecursionError` are `memory` too). `outputBytes` counts the result's JSON and every printed line. A raise, a syntax
  error, or a result with no strict JSON form (`NaN`, a set) is `sandbox_code_failed` with `Type: message`.

## TypeScript steps

`compileTypeScriptStep(source)` erases the types of a step body with Node's own type stripping and keeps every position,
so a failure still points at what the tenant wrote. Store both texts and run the JavaScript. TypeScript that needs code
generated (`enum`, `namespace`, parameter properties) is refused.

## Network

`fetch(url, { method, headers, body })` in the code resolves to a plain `{ status, headers, body }` (the body as text).
The URL's origin must be in the run's `allowedOrigins`, else the call rejects at once with
`fetch: <origin> is not an allowed origin`. An allowed request goes to the `SandboxFetchProxy` the host binds, with the
run's `reference` for the audit and an `AbortSignal` that fires when the run ends first. A proxy rejection reaches the
code as a rejected `fetch`.
