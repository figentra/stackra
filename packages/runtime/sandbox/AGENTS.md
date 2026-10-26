# AGENTS — @stackra/sandbox

The sandboxed code step: the `Sandbox` service, its two refusals and the `SandboxFetchProxy` port (ADR 0154). Member at
`packages/runtime/sandbox` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`,
`./contracts` and `./node` (the process pool and the TypeScript step compiler).

## Where code goes

| You are writing…                | It goes in…                                    |
| ------------------------------- | ---------------------------------------------- |
| The port or a type it uses      | `src/contracts/{ports,types}/`                 |
| A refusal                       | `src/core/errors/`                             |
| The service                     | `src/core/services/`                           |
| A request, limit or result type | `src/core/types/`                              |
| Process pool or Node-only code  | `src/node/{services,functions,drivers,types}/` |
| A test                          | `__tests__/<name>.test.ts` beside it           |

## Entries and barrels

- `src/{core,contracts,node}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add every new
  public file to its barrel and to that entry's `index.test.ts`.
- `src/contracts/` is the leaf; `core` imports it through `#contracts/index`.

## This package

- Tenant code runs only here (ADR 0154 d1). Never give the guest a host object, a module loader, a timer or a
  filesystem; the only bridges are `console.log` and `fetch`, and both pass JSON or text.
- Every limit is the caller's data (plan catalogue). Add no default limit, tier value or allowed origin here. The one
  constant, the guest stack size, is an engine bound that keeps recursion inside QuickJS.
- Every guest handle is disposed before the runtime is: QuickJS aborts on a leaked object. Once a run stops, no guest
  job runs again (`closed`), so nothing settles into a disposed runtime.
- A limit is classified on the host (the clock, the output budget, QuickJS's own `out of memory` and `stack overflow`
  errors), never by trusting a value the code returns.
- Pyodide (Python) is a later engine of ADR 0154; it waits on the owner adding `pyodide` to the catalog (ADR 0434
  decision 1). The `SandboxMeter` port is an open owner question; the caller meters `codeMs`.
- The pool never runs a guest in the host process; a child process only runs `Sandbox` and relays `fetch`.
- No parameter properties and no `#private` fields: services typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data                         | Where                                 | Handling                                                                                    |
| ---------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------- |
| Step input and output        | the QuickJS heap, during a run        | Tenant data the caller passes; freed with the runtime; never logged by this package         |
| Logged lines, error text     | `SandboxResult.logs`, refusal details | Whatever the tenant's code prints; the caller stores them with the run, under its retention |
| Fetch requests and responses | the `SandboxFetchProxy` driver        | Sent through the host's audited egress; this package keeps none                             |
