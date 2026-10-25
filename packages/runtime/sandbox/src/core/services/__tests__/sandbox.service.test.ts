/**
 * Stackra file contract:
 * Purpose: unit tests of `Sandbox`: the code's returned JSON, its input and its logs come back with `codeMs`; a throw,
 *          a syntax error and a value with no JSON form are `sandbox_code_failed`; a busy loop, a promise that never
 *          settles, a large allocation, deep recursion, a large result and too many logged bytes are
 *          `sandbox_limit_exceeded` with the limit named; the guest has no filesystem or process and nothing passes
 *          between runs; `fetch` reaches only allow-listed origins, through the proxy, with the run's reference, and
 *          is aborted when the run ends first; a zero time limit and a malformed origin are refused before running.
 * Boundary: test only; runs real QuickJS-WASM. A recording proxy stands in for the host's egress.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0154 (decisions 1 to
 *                     8).
 */
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import type { Json } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SandboxFetchProxy } from "#contracts/index";
import type { SandboxFetchRequest, SandboxFetchResponse } from "#contracts/index";
import { SandboxCodeFailedError } from "#core/errors/sandbox-code-failed.error";
import { SandboxLimitExceededError } from "#core/errors/sandbox-limit-exceeded.error";
import { Sandbox } from "#core/services/sandbox.service";
import type { SandboxLimits } from "#core/types/sandbox-limits.type";
import type { SandboxRequest } from "#core/types/sandbox-request.type";

/** Records each request; answers with `answer`, or never when it is `undefined`. */
class RecordingSandboxFetchProxy extends Driver(SandboxFetchProxy) {
  readonly calls: { request: SandboxFetchRequest; reference: string; signal: AbortSignal }[] = [];

  answer: (() => Promise<SandboxFetchResponse>) | undefined = async () => ({
    status: 200,
    headers: { "content-type": "application/json" },
    body: '{"rate":3.75}',
  });

  fetch(
    request: SandboxFetchRequest,
    reference: string,
    signal: AbortSignal,
  ): Promise<SandboxFetchResponse> {
    this.calls.push({ request, reference, signal });
    return this.answer === undefined ? new Promise(() => {}) : this.answer();
  }
}

const LIMITS: SandboxLimits = {
  time: Duration.seconds(1),
  memoryBytes: 16 * 1024 * 1024,
  outputBytes: 4096,
};

/** A sandbox over a recording proxy. */
function setup(): { proxy: RecordingSandboxFetchProxy; sandbox: Sandbox } {
  const proxy = new RecordingSandboxFetchProxy();
  return { proxy, sandbox: new Sandbox(proxy) };
}

/** A request for `code`, with test defaults for the rest. */
function request(code: string, overrides: Partial<SandboxRequest> = {}): SandboxRequest {
  return {
    code,
    input: null,
    limits: LIMITS,
    allowedOrigins: [],
    reference: "step-1",
    ...overrides,
  };
}

/** The refusal `run` rejects with. */
async function refusalOf(sandbox: Sandbox, run: SandboxRequest): Promise<unknown> {
  try {
    await sandbox.run(run);
  } catch (error) {
    return error;
  }
  throw new Error("the run finished");
}

/** Expects `run` to pass `limit`. */
async function expectLimit(
  sandbox: Sandbox,
  run: SandboxRequest,
  limit: "time" | "memory" | "output",
): Promise<void> {
  const refused = await refusalOf(sandbox, run);
  expect(isRefusal(refused, SandboxLimitExceededError)).toBe(true);
  expect((refused as SandboxLimitExceededError).limit).toBe(limit);
  expect((refused as SandboxLimitExceededError).codeMs).toBeGreaterThanOrEqual(0);
}

describe(Sandbox, () => {
  it("gives back the returned JSON, the logs and the milliseconds", async () => {
    const { sandbox } = setup();
    const result = await sandbox.run(
      request(
        'console.log("total", input.lines.length, { ok: true });\nreturn { total: input.lines.reduce((s, l) => s + l, 0) };',
        { input: { lines: [1, 2, 3] } },
      ),
    );
    expect(result.output).toEqual({ total: 6 });
    expect(result.logs).toEqual(['total 3 {"ok":true}']);
    expect(Number.isInteger(result.codeMs)).toBe(true);
    expect(result.codeMs).toBeGreaterThanOrEqual(0);
  });

  it("gives null when the code returns nothing, and awaits its own promises", async () => {
    const { sandbox } = setup();
    await expect(sandbox.run(request("await Promise.resolve(1);"))).resolves.toMatchObject({
      output: null,
    });
  });

  it("refuses sandbox_code_failed for a throw, with the error and the logs before it", async () => {
    const { sandbox } = setup();
    const refused = await refusalOf(
      sandbox,
      request('console.log("before");\nthrow new TypeError("boom");'),
    );
    expect(isRefusal(refused, SandboxCodeFailedError)).toBe(true);
    expect((refused as SandboxCodeFailedError).failure).toBe("TypeError: boom");
    expect((refused as SandboxCodeFailedError).logs).toEqual(["before"]);
  });

  it("refuses sandbox_code_failed for a syntax error and for a value with no JSON form", async () => {
    const { sandbox } = setup();
    expect(isRefusal(await refusalOf(sandbox, request("return {")), SandboxCodeFailedError)).toBe(
      true,
    );
    expect(isRefusal(await refusalOf(sandbox, request("return 1n;")), SandboxCodeFailedError)).toBe(
      true,
    );
  });

  it("reads the output with the guest's own JSON even when the code replaces it", async () => {
    const { sandbox } = setup();
    const result = await sandbox.run(
      request('JSON.stringify = () => "{}";\nreturn { kept: true };'),
    );
    expect(result.output).toEqual({ kept: true });
  });

  it("stops a busy loop and a promise that never settles at the time limit", async () => {
    const { sandbox } = setup();
    const short = { ...LIMITS, time: Duration.seconds(0.2) };
    await expectLimit(sandbox, request("while (true) {}", { limits: short }), "time");
    await expectLimit(sandbox, request("await new Promise(() => {});", { limits: short }), "time");
  });

  it("stops a large allocation and deep recursion at the memory limit", async () => {
    const { sandbox } = setup();
    const small = { ...LIMITS, memoryBytes: 2 * 1024 * 1024 };
    await expectLimit(
      sandbox,
      request('const parts = [];\nwhile (true) parts.push("x".repeat(65536) + parts.length);', {
        limits: small,
      }),
      "memory",
    );
    await expectLimit(sandbox, request("const f = (n) => f(n + 1) + 1;\nreturn f(0);"), "memory");
  });

  it("stops a large result and too many logged bytes at the output limit", async () => {
    const { sandbox } = setup();
    const tiny = { ...LIMITS, outputBytes: 64 };
    await expectLimit(sandbox, request('return "x".repeat(100);', { limits: tiny }), "output");
    await expectLimit(
      sandbox,
      request('for (let i = 0; i < 10; i += 1) console.log("0123456789");', { limits: tiny }),
      "output",
    );
    await expectLimit(
      sandbox,
      request('try { console.log("x".repeat(100)); } catch {}\nreturn 1;', { limits: tiny }),
      "output",
    );
  });

  it("gives the guest no filesystem, process, module loader or timers, and keeps runs apart", async () => {
    const { sandbox } = setup();
    const { output } = await sandbox.run(
      request(
        "globalThis.leaked = 1;\nreturn [typeof require, typeof process, typeof setTimeout, typeof std, typeof os];",
      ),
    );
    expect(output).toEqual(["undefined", "undefined", "undefined", "undefined", "undefined"]);
    await expect(sandbox.run(request("return typeof leaked;"))).resolves.toMatchObject({
      output: "undefined",
    });
  });

  it("sends an allowed fetch through the proxy with the run's reference", async () => {
    const { proxy, sandbox } = setup();
    const result = await sandbox.run(
      request(
        'const response = await fetch("https://api.example.com/rates?base=SAR", { method: "post", headers: { accept: "application/json" }, body: "{}" });\nreturn { status: response.status, rate: JSON.parse(response.body).rate };',
        { allowedOrigins: ["https://api.example.com"], reference: "run-7" },
      ),
    );
    expect(result.output).toEqual({ status: 200, rate: 3.75 });
    expect(proxy.calls).toHaveLength(1);
    expect(proxy.calls[0]?.request).toEqual({
      url: "https://api.example.com/rates?base=SAR",
      method: "POST",
      headers: { accept: "application/json" },
      body: "{}",
    });
    expect(proxy.calls[0]?.reference).toBe("run-7");
  });

  it("rejects a fetch to an origin that is not allowed without calling the proxy", async () => {
    const { proxy, sandbox } = setup();
    const result = await sandbox.run(
      request(
        'try { await fetch("https://evil.example.org/x"); return "sent"; } catch (error) { return error.message; }',
        { allowedOrigins: ["https://api.example.com"] },
      ),
    );
    expect(result.output).toBe("fetch: https://evil.example.org is not an allowed origin");
    expect(proxy.calls).toHaveLength(0);
  });

  it("rejects a fetch with malformed options, and passes on a proxy rejection", async () => {
    const { proxy, sandbox } = setup();
    const allowed = { allowedOrigins: ["https://api.example.com"] };
    const malformed = await sandbox.run(
      request(
        'try { await fetch("https://api.example.com/x", { body: 1 }); } catch (error) { return error.message; }',
        allowed,
      ),
    );
    expect(malformed.output).toBe("fetch: the body is a string");
    proxy.answer = () => Promise.reject(new Error("egress refused"));
    const rejected = await sandbox.run(
      request(
        'try { await fetch("https://api.example.com/x"); } catch (error) { return error.message; }',
        allowed,
      ),
    );
    expect(rejected.output).toBe("egress refused");
  });

  it("aborts a fetch still waiting when the run passes its time", async () => {
    const { proxy, sandbox } = setup();
    proxy.answer = undefined;
    await expectLimit(
      sandbox,
      request('await fetch("https://api.example.com/slow");', {
        allowedOrigins: ["https://api.example.com"],
        limits: { ...LIMITS, time: Duration.seconds(0.2) },
      }),
      "time",
    );
    expect(proxy.calls[0]?.signal.aborted).toBe(true);
  });

  it("refuses a zero time limit and a malformed origin before running", async () => {
    const { sandbox } = setup();
    await expect(
      sandbox.run(request("return 1;", { limits: { ...LIMITS, time: Duration.seconds(0) } })),
    ).rejects.toThrow(RangeError);
    await expect(
      sandbox.run(request("return 1;", { allowedOrigins: ["not a url"] })),
    ).rejects.toThrow(TypeError);
  });

  it("passes JSON input of every kind through unchanged", async () => {
    const { sandbox } = setup();
    const input: Json = { text: "مرحبا", list: [1, 2.5, true, null], nested: { a: "b" } };
    await expect(sandbox.run(request("return input;", { input }))).resolves.toMatchObject({
      output: input,
    });
  });
});
