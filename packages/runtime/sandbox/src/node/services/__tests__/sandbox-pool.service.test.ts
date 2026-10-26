/**
 * Stackra file contract:
 * Purpose: integration tests of `SandboxPool` over real child processes: a run returns its output, a guest `fetch` is
 *          relayed to the host's proxy, a run's own refusal comes back as the same refusal, a run waiting past its time
 *          is refused while the pool keeps serving, and a pool that is not open refuses runs.
 * Boundary: test only; the children load this package's source `./node` entry, so Node strips its types, with a
 *           resolve hook for its extensionless `#` imports (ADR 0233); its dependencies load from their built dists
 *           (`test` runs after `^build`), since Node cannot parse their decorated sources.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0434 (decision 2); ADR 0154 (decisions 5 and 6).
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

const pools: SandboxPool[] = [];

/** An open pool over `proxy`. */
function poolOf(proxy = new EchoProxy()): SandboxPool {
  const pool = new SandboxPool(proxy);
  pool.open(OPTIONS);
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
    const pool = poolOf(
      new (class extends EchoProxy {
        override fetch(): Promise<SandboxFetchResponse> {
          return new Promise(() => undefined);
        }
      })(),
    );
    const short = { ...LIMITS, time: Duration.seconds(1) };
    const hung = pool.run({
      code: "await fetch('https://api.example.com/slow');",
      input: null,
      limits: short,
      allowedOrigins: ["https://api.example.com"],
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
