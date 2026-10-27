/**
 * Stackra file contract:
 * Purpose: `PoolReply`, a message a sandbox process sends the pool: that it serves, the run's result, its refusal or
 *          failure, or a guest `fetch` for the pool's audited proxy to send.
 * Boundary: a type only; plain JSON over the IPC channel. A refusal travels as its code and details and is rebuilt as
 *           the same refusal class in the pool; any other error travels as its name and message.
 * Runtime: node
 * Governing contract: ADR 0434 (decision 2); ADR 0154 (decision 5: egress only through the proxy).
 */
import type { SandboxFetchRequest } from "#contracts/index";
import type { SandboxLimit, SandboxResult } from "#core/index";

/** Process to pool. */
export type PoolReply =
  | { readonly type: "ready" }
  | { readonly type: "result"; readonly result: SandboxResult }
  | { readonly type: "limit"; readonly limit: SandboxLimit; readonly codeMs: number }
  | {
      readonly type: "failed";
      readonly failure: string;
      readonly logs: readonly string[];
      readonly codeMs: number;
    }
  | { readonly type: "error"; readonly name: string; readonly message: string }
  | {
      readonly type: "fetch";
      readonly fetchId: number;
      readonly request: SandboxFetchRequest;
      readonly reference: string;
    };
