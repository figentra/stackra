/**
 * Stackra file contract:
 * Purpose: unit tests of `IpcFetchProxyDriver`: a fetch is relayed with its id and settled by the pool's answer or
 *          failure, and an aborted run rejects what it waits on.
 * Boundary: test only; the channel is an array.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0434 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SandboxFetchProxy } from "#contracts/index";
import { IpcFetchProxyDriver } from "#node/drivers/ipc-fetch-proxy.driver";
import type { PoolReply } from "#node/types/pool-reply.type";
import type { PoolRequest } from "#node/types/pool-request.type";

const REQUEST = { url: "https://api.example.com/x", method: "GET", headers: {} };

describe(IpcFetchProxyDriver, () => {
  it("relays a fetch and settles it with the pool's answer", async () => {
    const sent: PoolReply[] = [];
    const proxy = new IpcFetchProxyDriver().connect((message) => sent.push(message));
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
    const proxy = new IpcFetchProxyDriver().connect(() => undefined);
    const abort = new AbortController();
    const waiting = proxy.fetch(REQUEST, "step_1", abort.signal);
    abort.abort();
    await expect(waiting).rejects.toThrow("the run ended");
  });

  it("posts through the process's IPC channel until connect names another, and survives none", async () => {
    const original: unknown = Reflect.get(process, "send");
    const channel = vi.fn(() => true);
    try {
      Reflect.set(process, "send", channel);
      const proxy = new IpcFetchProxyDriver();
      const waiting = proxy.fetch(REQUEST, "step_1", new AbortController().signal);
      expect(channel).toHaveBeenCalledExactlyOnceWith({
        type: "fetch",
        fetchId: 1,
        request: REQUEST,
        reference: "step_1",
      });
      proxy.settle({
        type: "fetched",
        fetchId: 1,
        response: { status: 204, headers: {}, body: "" },
      });
      await expect(waiting).resolves.toMatchObject({ status: 204 });

      // No channel (the process was not forked): the message goes nowhere, and the fetch stays waiting.
      Reflect.set(process, "send", undefined);
      const abort = new AbortController();
      const alone = new IpcFetchProxyDriver().fetch(REQUEST, "step_2", abort.signal);
      abort.abort();
      await expect(alone).rejects.toThrow("the run ended");
      expect(channel).toHaveBeenCalledOnce();
    } finally {
      Reflect.set(process, "send", original);
    }
  });

  it("ignores a run message and an answer for a fetch it does not wait on", async () => {
    const proxy = new IpcFetchProxyDriver().connect(() => undefined);
    const waiting = proxy.fetch(REQUEST, "step_1", new AbortController().signal);
    let settled = false;
    void waiting.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      },
    );
    proxy.settle({
      type: "run",
      request: { code: "return 1;", input: null, limits: {}, allowedOrigins: [], reference: "s" },
    } as unknown as PoolRequest);
    proxy.settle({
      type: "fetched",
      fetchId: 99,
      response: { status: 200, headers: {}, body: "" },
    });
    proxy.settle({ type: "fetch-failed", fetchId: 98, message: "stray" });
    await Promise.resolve();
    expect(settled).toBe(false);

    // The one it waits on is still settled normally.
    proxy.settle({
      type: "fetched",
      fetchId: 1,
      response: { status: 200, headers: {}, body: "ok" },
    });
    await expect(waiting).resolves.toMatchObject({ body: "ok" });
  });
});
