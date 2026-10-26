/**
 * Stackra file contract:
 * Purpose: `IpcFetchProxyDriver`, the `SandboxFetchProxy` inside a sandbox process: it relays each guest `fetch` to the
 *          pool over IPC and settles it with the pool's answer, so the audited egress stays in the host process.
 * Boundary: node only, internal to the pool's child; never bound in a host. An aborted run rejects what it still waits
 *           on. The `Sandbox` in the child has already checked the run's allow-list.
 * Runtime: node
 * Governing contract: ADR 0434 (decision 2); ADR 0154 (decision 5).
 */
import { Driver } from "@stackra/container";

import { SandboxFetchProxy } from "#contracts/index";
import type { SandboxFetchRequest, SandboxFetchResponse } from "#contracts/index";
import type { PoolReply } from "#node/types/pool-reply.type";
import type { PoolRequest } from "#node/types/pool-request.type";

/**
 * Relays fetches to the pool.
 *
 * @example
 * const proxy = new IpcFetchProxyDriver((message) => process.send?.(message));
 * process.on("message", (message: PoolRequest) => proxy.settle(message));
 */
export class IpcFetchProxyDriver extends Driver(SandboxFetchProxy) {
  private readonly send: (message: PoolReply) => void;

  private readonly waiting = new Map<
    number,
    { resolve: (response: SandboxFetchResponse) => void; reject: (error: Error) => void }
  >();

  private next = 0;

  /** @param send - posts a message to the pool. */
  constructor(send: (message: PoolReply) => void) {
    super();
    this.send = send;
  }

  /** See `SandboxFetchProxy.fetch`. */
  fetch(
    request: SandboxFetchRequest,
    reference: string,
    signal: AbortSignal,
  ): Promise<SandboxFetchResponse> {
    this.next += 1;
    const fetchId = this.next;
    return new Promise((resolve, reject) => {
      this.waiting.set(fetchId, { resolve, reject });
      signal.addEventListener("abort", () => {
        if (this.waiting.delete(fetchId)) reject(new Error("fetch: the run ended"));
      });
      this.send({ type: "fetch", fetchId, request, reference });
    });
  }

  /** Settles the fetch a pool answer names; other messages are ignored. */
  settle(message: PoolRequest): void {
    if (message.type === "run") return;
    const waiting = this.waiting.get(message.fetchId);
    if (waiting === undefined) return;
    this.waiting.delete(message.fetchId);
    if (message.type === "fetched") waiting.resolve(message.response);
    else waiting.reject(new Error(message.message));
  }
}
