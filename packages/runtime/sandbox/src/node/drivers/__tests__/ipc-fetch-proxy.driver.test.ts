/**
 * Stackra file contract:
 * Purpose: unit tests of `IpcFetchProxyDriver`: a fetch is relayed with its id and settled by the pool's answer or
 *          failure, and an aborted run rejects what it waits on.
 * Boundary: test only; the channel is an array.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0434 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { SandboxFetchProxy } from "#contracts/index";
import { IpcFetchProxyDriver } from "#node/drivers/ipc-fetch-proxy.driver";
import type { PoolReply } from "#node/types/pool-reply.type";

const REQUEST = { url: "https://api.example.com/x", method: "GET", headers: {} };

describe(IpcFetchProxyDriver, () => {
  it("relays a fetch and settles it with the pool's answer", async () => {
    const sent: PoolReply[] = [];
    const proxy = new IpcFetchProxyDriver((message) => sent.push(message));
    expect(proxy).toBeInstanceOf(SandboxFetchProxy);
    const first = proxy.fetch(REQUEST, "step_1", new AbortController().signal);
    const second = proxy.fetch(REQUEST, "step_1", new AbortController().signal);
    expect(sent).toEqual([
      { type: "fetch", fetchId: 1, request: REQUEST, reference: "step_1" },
      { type: "fetch", fetchId: 2, request: REQUEST, reference: "step_1" },
    ]);
    proxy.settle({
      type: "fetched",
      fetchId: 1,
      response: { status: 200, headers: {}, body: "ok" },
    });
    proxy.settle({ type: "fetch-failed", fetchId: 2, message: "refused" });
    await expect(first).resolves.toMatchObject({ status: 200 });
    await expect(second).rejects.toThrow("refused");
  });

  it("rejects a fetch of a run that ended", async () => {
    const proxy = new IpcFetchProxyDriver(() => undefined);
    const abort = new AbortController();
    const waiting = proxy.fetch(REQUEST, "step_1", abort.signal);
    abort.abort();
    await expect(waiting).rejects.toThrow("the run ended");
  });
});
