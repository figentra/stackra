/**
 * Stackra file contract:
 * Purpose: integration tests of `SandboxPool` over real child processes: a run returns its output, a guest `fetch` is
 *          relayed to the host's proxy, a run's own refusal comes back as the same refusal, a run waiting past its time
 *          is refused while the pool keeps serving, a Python step runs in Pyodide in a process that is then replaced,
 *          a Python engine's load is never charged to the run but is bounded by the start-up deadline,
 *          a relayed fetch to an origin outside the run's allow-list never reaches the proxy, a run's clock restarts
 *          at most once, a process that never says it serves is killed at the start-up deadline and its run refused,
 *          and a pool that is not open refuses runs.
 * Boundary: test only; the children load this package's source `./node` entry, so Node strips its types, with a
 *           resolve hook for its extensionless `#` imports (ADR 0233); its dependencies load from their built dists
 *           (`test` runs after `^build`), since Node cannot parse their decorated sources. The watchdog test runs a
 *           stand-in process that never answers, so the watchdog, not the run's own limit, ends the run under any load;
 *           the start-up test runs one that never sends `ready` (STA-1332).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0434 (decisions 1 and 2); ADR 0154 (decisions 2, 5 and 6).
 */
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { SandboxFetchProxy } from "#contracts/index";
import type { SandboxFetchRequest, SandboxFetchResponse } from "#contracts/index";
import { SandboxCodeFailedError, SandboxLimitExceededError } from "#core/index";
import { SandboxPool } from "#node/services/sandbox-pool.service";

/** Answers every fetch with the URL it was asked for. */
class EchoProxy extends Driver(SandboxFetchProxy) {
  readonly seen: string[] = [];

  async fetch(request: SandboxFetchRequest, reference: string): Promise<SandboxFetchResponse> {
    this.seen.push(`${reference} ${request.url}`);
    return { status: 200, headers: {}, body: request.url };
  }
}

const LIMITS = { time: Duration.seconds(2), memoryBytes: 32 * 1024 * 1024, outputBytes: 10_000 };
const SOURCE = new URL("../../index.ts", import.meta.url).href;
/** Retries an unresolved `#` import with `.ts`, as the bundler resolves the source (ADR 0233). */
const RESOLVE_TS = `import { registerHooks } from "node:module";
registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context);
    } catch (error) {
      if (!specifier.startsWith("#") || error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
      return next(specifier + ".ts", context);
    }
  },
});`;
const OPTIONS = {
  size: 1,
  graceMs: 500,
  module: SOURCE,
  execArgv: ["--import", `data:text/javascript,${encodeURIComponent(RESOLVE_TS)}`],
};

/**
 * A stand-in process that never answers a run of `stall` and answers `1` to any other, so only the pool's watchdog
 * can end the stalled run, whatever the load on the machine.
 */
const STALLING_CHILD = `export function serveSandboxChild() {
  process.on("message", (message) => {
    if (message.type === "run" && message.request.code !== "stall")
      process.send({ type: "result", result: { output: 1, logs: [], codeMs: 0 } });
  });
  process.send({ type: "ready" });
}`;
/** Real Pyodide: its load took 32 s on a busy CI runner, past the 30 s default start-up deadline. */
const PYODIDE = { ...OPTIONS, startupMs: 90_000 };

const STALLING = {
  ...OPTIONS,
  module: `data:text/javascript,${encodeURIComponent(STALLING_CHILD)}`,
};

/** A stand-in process that relays a fetch its run did not allow, and returns what the pool answered. */
const FORGING_CHILD = `export function serveSandboxChild() {
  process.on("message", (message) => {
    if (message.type === "run")
      process.send({ type: "fetch", fetchId: 1, reference: "forged", request: { url: "https://evil.example.org/x", method: "GET", headers: {} } });
    else process.send({ type: "result", result: { output: message.message ?? "fetched", logs: [], codeMs: 0 } });
  });
  process.send({ type: "ready" });
}`;
const FORGING = {
  ...OPTIONS,
  module: `data:text/javascript,${encodeURIComponent(FORGING_CHILD)}`,
};

/** A stand-in process that keeps saying it serves during its run, to hold the run's clock back. */
const REARMING_CHILD = `export function serveSandboxChild() {
  process.on("message", (message) => {
    if (message.type === "run") setInterval(() => process.send({ type: "ready" }), 200);
  });
  process.send({ type: "ready" });
}`;
const REARMING = {
  ...OPTIONS,
  module: `data:text/javascript,${encodeURIComponent(REARMING_CHILD)}`,
};

/**
 * A stand-in process whose Python engine takes 2 s to load, longer than a 1 s run's limit and its grace, then says
 * it serves again and answers `1`; a run of `hang` never finishes loading.
 */
const SLOW_LOADING_CHILD = `export function serveSandboxChild() {
  process.on("message", (message) => {
    if (message.type !== "run" || message.request.code === "hang") return;
    setTimeout(() => {
      process.send({ type: "ready" });
      process.send({ type: "result", result: { output: 1, logs: [], codeMs: 0 } });
    }, 2000);
  });
  process.send({ type: "ready" });
}`;
const SLOW_LOADING = {
  ...OPTIONS,
  startupMs: 3000,
  module: `data:text/javascript,${encodeURIComponent(SLOW_LOADING_CHILD)}`,
};

/** A stand-in process that never says it serves, so only the pool's start-up deadline can end its queued run. */
const NEVER_READY_CHILD = `export function serveSandboxChild() {
  process.on("message", () => {});
}`;
const NEVER_READY = {
  ...OPTIONS,
  startupMs: 500,
  module: `data:text/javascript,${encodeURIComponent(NEVER_READY_CHILD)}`,
};

const pools: SandboxPool[] = [];

/** An open pool over `proxy`. */
function poolOf(proxy = new EchoProxy(), options = OPTIONS): SandboxPool {
  const pool = new SandboxPool(proxy);
  pool.open(options);
  pools.push(pool);
  return pool;
}

afterEach(async () => {
  await Promise.all(pools.splice(0).map((pool) => pool.close()));
});

describe(SandboxPool, () => {
  it("runs a step in a child process and relays its fetch", async () => {
    const proxy = new EchoProxy();
    const pool = poolOf(proxy);
    const result = await pool.run({
      code: "const r = await fetch('https://api.example.com/a');\nreturn { sum: input.a + input.b, body: r.body };",
      input: { a: 2, b: 3 },
      limits: LIMITS,
      allowedOrigins: ["https://api.example.com"],
      reference: "step_1",
    });
    expect(result.output).toEqual({ sum: 5, body: "https://api.example.com/a" });
    expect(proxy.seen).toEqual(["step_1 https://api.example.com/a"]);
  }, 20_000);

  it("brings back the run's own refusal", async () => {
    const pool = poolOf();
    await expect(
      pool.run({
        code: "throw new Error('nope');",
        input: null,
        limits: LIMITS,
        allowedOrigins: [],
        reference: "s",
      }),
    ).rejects.toBeInstanceOf(SandboxCodeFailedError);
    await expect(
      pool.run({
        code: "while (true) {}",
        input: null,
        limits: LIMITS,
        allowedOrigins: [],
        reference: "s",
      }),
    ).rejects.toBeInstanceOf(SandboxLimitExceededError);
  }, 20_000);

  it("refuses a run that waits past its time and keeps serving", async () => {
    const pool = poolOf(new EchoProxy(), STALLING);
    const hung = pool.run({
      code: "stall",
      input: null,
      limits: { ...LIMITS, time: Duration.seconds(1) },
      allowedOrigins: [],
      reference: "s",
    });
    await expect(hung).rejects.toBeInstanceOf(SandboxLimitExceededError);
    await expect(
      pool.run({
        code: "return 1;",
        input: null,
        limits: LIMITS,
        allowedOrigins: [],
        reference: "s",
      }),
    ).resolves.toMatchObject({ output: 1 });
  }, 20_000);

  it("runs a Python step in Pyodide, relays its fetch, and replaces the process after it", async () => {
    const proxy = new EchoProxy();
    const pool = poolOf(proxy, PYODIDE);
    const result = await pool.run({
      code: 'r = await fetch("https://api.example.com/a")\nprint("hi")\nreturn {"sum": input["a"] + input["b"], "body": r["body"]}',
      language: "python",
      input: { a: 2, b: 3 },
      limits: { ...LIMITS, time: Duration.seconds(10), memoryBytes: 256 * 1024 * 1024 },
      allowedOrigins: ["https://api.example.com"],
      reference: "step_py",
    });
    expect(result).toMatchObject({
      output: { sum: 5, body: "https://api.example.com/a" },
      logs: ["hi"],
    });
    expect(proxy.seen).toEqual(["step_py https://api.example.com/a"]);
    await expect(
      pool.run({
        code: "return 1;",
        input: null,
        limits: LIMITS,
        allowedOrigins: [],
        reference: "s",
      }),
    ).resolves.toMatchObject({ output: 1 });
  }, 120_000);

  it("refuses a Python step's own error as the same refusal", async () => {
    const pool = poolOf(undefined, PYODIDE);
    await expect(
      pool.run({
        code: 'raise ValueError("nope")',
        language: "python",
        input: null,
        limits: { ...LIMITS, time: Duration.seconds(10), memoryBytes: 256 * 1024 * 1024 },
        allowedOrigins: [],
        reference: "s",
      }),
    ).rejects.toMatchObject({ failure: "ValueError: nope" });
  }, 120_000);

  it("never charges a Python engine's load to the run, and refuses a load that outlasts the start-up deadline", async () => {
    const pool = poolOf(new EchoProxy(), SLOW_LOADING);
    const python = (code: string) =>
      pool.run({
        code,
        language: "python",
        input: null,
        limits: { ...LIMITS, time: Duration.seconds(1) },
        allowedOrigins: [],
        reference: "s",
      });
    await expect(python("return 1")).resolves.toMatchObject({ output: 1 });
    await expect(python("hang")).rejects.toMatchObject({
      details: { failure: "The Python engine did not load within 3000 ms", codeMs: 0 },
    });
  }, 20_000);

  it("never sends a relayed fetch outside the run's allow-list", async () => {
    const proxy = new EchoProxy();
    const pool = poolOf(proxy, FORGING);
    const result = await pool.run({
      code: "forge",
      input: null,
      limits: LIMITS,
      allowedOrigins: ["https://api.example.com"],
      reference: "s",
    });
    expect(result.output).toBe("fetch: https://evil.example.org/x is not an allowed origin");
    expect(proxy.seen).toEqual([]);
  }, 20_000);

  it("restarts a run's clock at most once", async () => {
    const pool = poolOf(new EchoProxy(), REARMING);
    await expect(
      pool.run({
        code: "stall",
        input: null,
        limits: { ...LIMITS, time: Duration.seconds(1) },
        allowedOrigins: [],
        reference: "s",
      }),
    ).rejects.toBeInstanceOf(SandboxLimitExceededError);
  }, 20_000);

  it("kills a process that never says it serves and refuses its run, then replaces it", async () => {
    const pool = poolOf(new EchoProxy(), NEVER_READY);
    const run = () =>
      pool.run({
        code: "return 1;",
        input: null,
        limits: LIMITS,
        allowedOrigins: [],
        reference: "s",
      });
    const refusal = await run().catch((error: unknown) => error);
    expect(refusal).toBeInstanceOf(SandboxCodeFailedError);
    expect(refusal).toMatchObject({
      details: { failure: "The sandbox process did not start within 500 ms", codeMs: 0 },
    });
    // The replacement is refused at its own deadline too, so the pool replaced the process instead of stalling.
    await expect(run()).rejects.toBeInstanceOf(SandboxCodeFailedError);
  }, 20_000);

  it("refuses runs when not open and a bad size", async () => {
    const pool = new SandboxPool(new EchoProxy());
    await expect(
      pool.run({
        code: "return 1;",
        input: null,
        limits: LIMITS,
        allowedOrigins: [],
        reference: "s",
      }),
    ).rejects.toBeInstanceOf(TypeError);
    expect(() => pool.open({ ...OPTIONS, size: 0 })).toThrow(RangeError);
  });
});
