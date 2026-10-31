# @stackra/sandbox

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [9085c41]
  - @stackra/errors@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/container@0.2.0

## 0.1.0

### Minor Changes

- b9544f1: Add `@stackra/sandbox`: the `Sandbox` service that runs a tenant's automation code step in QuickJS-WASM (a fresh
  runtime per run, JSON in and out, no filesystem, time, memory and output limits passed as plan data, `fetch` only to
  allow-listed origins through the `SandboxFetchProxy` port), with `codeMs` on every run for metering and the
  `sandbox_code_failed` and `sandbox_limit_exceeded` refusals.
- 7ddfd45: Add the `./node` entry: `SandboxPool` runs code steps in a fixed pool of child processes with fetches relayed to the
  host's proxy and a watchdog, and `compileTypeScriptStep` compiles a TypeScript step with Node's type stripping
  (STA-720, ADR 0434).
- 7578519: Run Python code steps in Pyodide inside `SandboxPool` processes (ADR 0434 decision 1): `SandboxRequest.language`
  (`SandboxLanguage`, `javascript` by default), the same limits, refusals and fetch proxy as JavaScript, Pyodide loaded
  once per process on its first Python request and the process replaced after its Python run. The pool now starts its
  processes with an empty environment, checks every relayed fetch's origin against the run's allow-list, audits it under
  the run's own reference, and lets a process restart its run's clock only once. `Sandbox.run` refuses a Python request.
  `fetch(url, init)` with a non-object `init` is now refused (`fetch: the options are an object`).

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 232d7a1: `SandboxPool` kills and replaces a process that has not sent `ready` within the new `startupMs` pool option (30 seconds
  by default) and refuses the run queued on it with `sandbox_code_failed`. A run's watchdog still arms on `ready`, so
  start-up is never charged to a run (STA-1332).
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [914465a]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [3b19f6d]
- Updated dependencies [150fa18]
- Updated dependencies [e756399]
- Updated dependencies [d19a3d5]
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/errors@0.1.0

Written by Changesets on release; never edited by hand.
