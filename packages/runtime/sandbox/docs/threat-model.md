# Threat model: @stackra/sandbox

<!--
Stackra file contract:
Purpose: the threat model of @stackra/sandbox: running a tenant's automation code step (JavaScript in QuickJS-WASM,
         Python in Pyodide, TypeScript with types erased) in a pool of child processes, its limits, and its only
         network path through the host's `SandboxFetchProxy`.
Boundary: documentation only; the code wins on any difference. A change that adds an asset, a trust boundary or an
          external call updates this file in the same pull request (constitution SEC10).
Runtime: none
Governing contract: constitution SEC10; ADR 0154; ADR 0434; ADR 0207 (amendment of 2026-11-26: the ASVS level);
                    STA-1332; STA-316.
-->

ASVS level: L1 for every chapter; V10 (malicious code) is this package's own (ADR 0207, amendment of 2026-11-26).
Reviewed: 2026-11-26 (STA-316).

This is the only place tenant-written code runs. A run gets JSON in, gives JSON out, prints lines, and may call `fetch`
to allowed origins through the host's audited proxy. The threats are code that escapes its run, starves the host, or
reaches the network or another tenant's data.

## Assets

| Asset                            | Where it lives                                            | Class          |
| -------------------------------- | --------------------------------------------------------- | -------------- |
| The host process and its secrets | the service that owns the pool                            | `secret`       |
| Step input and output            | the run's QuickJS or Pyodide heap, freed with the runtime | `pii`          |
| Logged lines and error text      | `SandboxResult.logs`, stored by the caller with the run   | `confidential` |
| Fetch requests and responses     | relayed over IPC to the host's `SandboxFetchProxy`        | `pii`          |

## Trust boundaries

1. The tenant's code to the WASM runtime (QuickJS or Pyodide) inside a child process.
2. The child process to the host over IPC (results, logs, fetch relays).
3. The host's proxy to the internet, for allowed origins only.

## Threats and controls

| Threat                                               | Control today                                                                                                                                 | Open work                                  |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Code reaches the host's memory, files or environment | The code runs in QuickJS-WASM or Pyodide with only ECMAScript built-ins, `console.log` and `fetch`; no module loader, files or process access | Run the pool under an OS sandbox (STA-307) |
| One run reads another run's state                    | One `Sandbox` run at a time per process; a Python run is its process's last, since one interpreter cannot keep runs apart                     | —                                          |
| An infinite loop or memory bomb starves the host     | `time`, `memoryBytes` and output limits per run; a run past its time by `graceMs` has its process killed and replaced                         | —                                          |
| A process that hangs at start blocks the queue       | A process not serving within `startupMs` is killed and replaced; the queued run is refused                                                    | —                                          |
| Code calls internal hosts or exfiltrates data        | `fetch` only to the run's `allowedOrigins`, else rejected at once; allowed calls go through the host's audited `SandboxFetchProxy`            | —                                          |
| Code returns something that is not data              | Output must have a JSON form, else `sandbox_code_failed`                                                                                      | —                                          |
| TypeScript tricks the compiler into generating code  | `compileTypeScriptStep` only erases types and refuses `enum`, `namespace` and parameter properties                                            | —                                          |
