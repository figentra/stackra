/**
 * Stackra file contract:
 * Purpose: `serveSandboxChild`, the body of a sandbox process: it says it serves once listening (the pool starts a
 *          run's clock then), runs each request the pool sends through `Sandbox` (JavaScript) or `PythonSandbox`
 *          (Python, loaded on the first Python request, after which it says it serves again so the load is never
 *          charged to the run), relays the guest's fetches to the pool, and answers with the result, the refusal or
 *          the failure.
 * Boundary: node only; called once at the top of a process `SandboxPool` spawns, never in a host. It holds no state
 *           between JavaScript runs beyond the loaded WebAssembly module (each run gets its own QuickJS runtime); the
 *           pool replaces a process after its Python run. It exits when the pool's channel closes, so a dead pool
 *           leaves no process behind.
 * Runtime: node
 * Governing contract: ADR 0434 (decisions 1 and 2); ADR 0154 (decisions 1 to 8).
 */
import {
  Sandbox,
  SandboxCodeFailedError,
  SandboxLimitExceededError,
  type SandboxRequest,
  type SandboxResult,
} from "#core/index";
import { IpcFetchProxyDriver } from "#node/drivers/ipc-fetch-proxy.driver";
import { PythonSandbox } from "#node/services/python-sandbox.service";
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
  const proxy = new IpcFetchProxyDriver().connect(send);
  const sandbox = new Sandbox(proxy);
  const python = new PythonSandbox(proxy);
  /** A Python run waits for Pyodide, then says it serves again: the pool restarts the run's clock there. */
  const runPython = async (request: SandboxRequest): Promise<SandboxResult> => {
    await python.load();
    send({ type: "ready" });
    return python.run(request);
  };
  process.on("message", (message: PoolRequest) => {
    if (message.type !== "run") {
      proxy.settle(message);
      return;
    }
    const { request } = message;
    (request.language === "python" ? runPython(request) : sandbox.run(request)).then(
      (result) => send({ type: "result", result }),
      (error: unknown) => send(replyOf(error)),
    );
  });
  process.on("disconnect", () => process.exit(0));
  send({ type: "ready" });
}
