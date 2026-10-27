/**
 * Stackra file contract:
 * Purpose: `serveSandboxChild`, the body of a sandbox process: it says it serves once listening (the pool starts a
 *          run's clock then), runs each request the pool sends through a fresh `Sandbox`, relays the guest's fetches
 *          to the pool, and answers with the result, the refusal or the failure.
 * Boundary: node only; called once at the top of a process `SandboxPool` spawns, never in a host. It holds no state
 *           between runs beyond the loaded WebAssembly module (each run gets its own QuickJS runtime). It exits when
 *           the pool's channel closes, so a dead pool leaves no process behind.
 * Runtime: node
 * Governing contract: ADR 0434 (decision 2); ADR 0154 (decisions 1 to 8).
 */
import { Sandbox, SandboxCodeFailedError, SandboxLimitExceededError } from "#core/index";
import { IpcFetchProxyDriver } from "#node/drivers/ipc-fetch-proxy.driver";
import type { PoolReply } from "#node/types/pool-reply.type";
import type { PoolRequest } from "#node/types/pool-request.type";

/** The reply for a run that threw `error`. */
function replyOf(error: unknown): PoolReply {
  if (error instanceof SandboxLimitExceededError)
    return { type: "limit", limit: error.limit, codeMs: error.codeMs };
  if (error instanceof SandboxCodeFailedError)
    return { type: "failed", failure: error.failure, logs: [...error.logs], codeMs: error.codeMs };
  if (error instanceof Error) return { type: "error", name: error.name, message: error.message };
  return { type: "error", name: "Error", message: String(error) };
}

/**
 * Serves the pool on this process's IPC channel.
 *
 * @example
 * // the module a pool process evaluates
 * (await import(module)).serveSandboxChild();
 * @throws TypeError when the process has no IPC channel (it was not spawned by a pool).
 */
export function serveSandboxChild(): void {
  const post = process.send?.bind(process);
  if (post === undefined)
    throw new TypeError("serveSandboxChild runs only in a process a SandboxPool spawned");
  const send = (message: PoolReply): void => {
    post(message);
  };
  const proxy = new IpcFetchProxyDriver(send);
  const sandbox = new Sandbox(proxy);
  process.on("message", (message: PoolRequest) => {
    if (message.type !== "run") {
      proxy.settle(message);
      return;
    }
    sandbox.run(message.request).then(
      (result) => send({ type: "result", result }),
      (error: unknown) => send(replyOf(error)),
    );
  });
  process.on("disconnect", () => process.exit(0));
  send({ type: "ready" });
}
