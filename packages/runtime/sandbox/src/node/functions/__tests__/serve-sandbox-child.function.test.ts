/**
 * Stackra file contract:
 * Purpose: unit tests of `serveSandboxChild` in this process: it refuses to start without an IPC channel, says it is
 *          ready, answers a run with its result, its code failure, its limit or its error, relays a guest fetch
 *          through the pool and settles it with the pool's answer, and exits when the pool disconnects. The `SandboxPool` tests run the
 *          same function in real child processes, which coverage cannot see, so its branches are measured here.
 * Boundary: test only; `process.send`, `process.on` and `process.exit` are stubbed so nothing reaches the vitest
 *           worker's own IPC channel, and restored after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0434 (decision 2); ADR 0154 (decisions 5 to 8).
 */
import { Duration } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Sandbox } from "#core/services/sandbox.service";
import type { SandboxRequest } from "#core/types/sandbox-request.type";
import { serveSandboxChild } from "#node/functions/serve-sandbox-child.function";
import type { PoolReply } from "#node/types/pool-reply.type";
import type { PoolRequest } from "#node/types/pool-request.type";

const LIMITS = { time: Duration.seconds(1), memoryBytes: 16 * 1024 * 1024, outputBytes: 4096 };

const SEND = Object.getOwnPropertyDescriptor(process, "send");

afterEach(() => {
  vi.restoreAllMocks();
  if (SEND === undefined) Reflect.deleteProperty(process, "send");
  else Object.defineProperty(process, "send", SEND);
});

/** A run request for `code`, with test defaults for the rest. */
function run(code: string, overrides: Partial<SandboxRequest> = {}): PoolRequest {
  return {
    type: "run",
    request: {
      code,
      input: null,
      limits: LIMITS,
      allowedOrigins: [],
      reference: "s",
      ...overrides,
    },
  };
}

/** Serves on a stubbed channel; gives the replies sent and the captured listeners. */
function serve(): {
  replies: PoolReply[];
  message: (message: PoolRequest) => void;
  disconnect: () => void;
} {
  const replies: PoolReply[] = [];
  Object.defineProperty(process, "send", {
    configurable: true,
    writable: true,
    value: (message: PoolReply) => replies.push(message) > 0,
  });
  let message: ((message: PoolRequest) => void) | undefined;
  let disconnect: (() => void) | undefined;
  vi.spyOn(process, "on").mockImplementation(((event: string, listener: never) => {
    if (event === "message") message = listener;
    if (event === "disconnect") disconnect = listener;
    return process;
  }) as typeof process.on);
  serveSandboxChild();
  if (message === undefined || disconnect === undefined) throw new Error("no listeners");
  expect(replies.splice(0)).toEqual([{ type: "ready" }]);
  return { replies, message, disconnect };
}

/** Waits until `replies` holds `count` messages. */
async function settled(replies: PoolReply[], count: number): Promise<void> {
  await vi.waitFor(() => expect(replies).toHaveLength(count), { timeout: 10_000 });
}

describe(serveSandboxChild, () => {
  it("refuses to start in a process with no IPC channel", () => {
    Object.defineProperty(process, "send", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    expect(() => serveSandboxChild()).toThrow(TypeError);
  });

  it("answers a run with its result, its code failure, its limit and its error", async () => {
    const { replies, message } = serve();
    message(run("return input;", { input: 7 }));
    await settled(replies, 1);
    message(run("console.log('a');\nthrow new Error('nope');"));
    await settled(replies, 2);
    message(run("while (true) {}"));
    await settled(replies, 3);
    message(run("return 1;", { limits: { ...LIMITS, time: Duration.seconds(0) } }));
    await settled(replies, 4);
    expect(replies[0]).toMatchObject({ type: "result", result: { output: 7 } });
    expect(replies[1]).toMatchObject({ type: "failed", failure: "Error: nope", logs: ["a"] });
    expect(replies[2]).toMatchObject({ type: "limit", limit: "time" });
    expect(replies[3]).toMatchObject({ type: "error", name: "RangeError" });
  }, 20_000);

  it("answers a run that rejects with a non-Error with its text", async () => {
    vi.spyOn(Sandbox.prototype, "run").mockRejectedValueOnce("boom");
    const { replies, message } = serve();
    message(run("return 1;"));
    await settled(replies, 1);
    expect(replies[0]).toEqual({ type: "error", name: "Error", message: "boom" });
  });

  it("relays a guest fetch to the pool and settles it with the pool's answer", async () => {
    const { replies, message } = serve();
    message(
      run("const r = await fetch('https://api.example.com/a');\nreturn r.body;", {
        allowedOrigins: ["https://api.example.com"],
      }),
    );
    await settled(replies, 1);
    const fetch = replies[0];
    if (fetch?.type !== "fetch") throw new Error("expected a fetch");
    expect(fetch.request.url).toBe("https://api.example.com/a");
    message({
      type: "fetched",
      fetchId: fetch.fetchId,
      response: { status: 200, headers: {}, body: "ok" },
    });
    await settled(replies, 2);
    expect(replies[1]).toMatchObject({ type: "result", result: { output: "ok" } });
  }, 20_000);

  it("exits when the pool disconnects", () => {
    const exit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    serve().disconnect();
    expect(exit).toHaveBeenCalledWith(0);
  });
});
