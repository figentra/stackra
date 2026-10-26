/**
 * Stackra file contract:
 * Purpose: `PoolRequest`, a message the pool sends a sandbox process: a run to start, or the answer to a `fetch` the
 *          process relayed.
 * Boundary: a type only; plain JSON over the process's IPC channel. A process runs one request at a time.
 * Runtime: node
 * Governing contract: ADR 0434 (decision 2).
 */
import type { SandboxFetchResponse } from "#contracts/index";
import type { SandboxRequest } from "#core/index";

/** Pool to process. */
export type PoolRequest =
  | { readonly type: "run"; readonly request: SandboxRequest }
  | { readonly type: "fetched"; readonly fetchId: number; readonly response: SandboxFetchResponse }
  | { readonly type: "fetch-failed"; readonly fetchId: number; readonly message: string };
