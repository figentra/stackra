/**
 * Stackra file contract:
 * Purpose: unit tests of `PythonSandbox` over real Pyodide, loaded once for the file: a step's returned JSON, its input
 *          and its printed lines come back with `codeMs`; a raise, a syntax error and a value with no JSON form are
 *          `sandbox_code_failed`; a wait past the time limit, a large allocation and too much output are
 *          `sandbox_limit_exceeded`; `fetch` reaches only allow-listed origins, through the proxy, with the run's
 *          reference; a zero time limit is refused before running.
 * Boundary: test only; runs Pyodide in the vitest worker, which only a test does (a host runs Python only through
 *           `SandboxPool`). A recording proxy stands in for the pool's relay. Runs here share one interpreter; the
 *           pool's own tests cover the process being replaced after each Python run.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0434 (decision 1); ADR 0154 (decisions 2 and 5 to 8).
 */
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { beforeAll, describe, expect, it } from "@stackra/testing";

import { SandboxFetchProxy } from "#contracts/index";
import type { SandboxFetchRequest, SandboxFetchResponse } from "#contracts/index";
import { SandboxCodeFailedError, SandboxLimitExceededError } from "#core/index";
import type { SandboxRequest } from "#core/index";
import { PythonSandbox } from "#node/services/python-sandbox.service";

/** Records each request; answers with the URL, or never for a `/slow` path. */
class RecordingProxy extends Driver(SandboxFetchProxy) {
  readonly calls: { request: SandboxFetchRequest; reference: string }[] = [];

  fetch(sent: SandboxFetchRequest, reference: string): Promise<SandboxFetchResponse> {
    this.calls.push({ request: sent, reference });
    if (sent.url.endsWith("/slow")) return new Promise(() => {});
    return Promise.resolve({ status: 200, headers: {}, body: sent.url });
  }
}

const LIMITS = {
  time: Duration.seconds(5),
  memoryBytes: 64 * 1024 * 1024,
  outputBytes: 4096,
};

/** A Python request for `code`, with test defaults for the rest. */
function request(code: string, overrides: Partial<SandboxRequest> = {}): SandboxRequest {
  return {
    code,
    language: "python",
    input: null,
    limits: LIMITS,
    allowedOrigins: [],
    reference: "step-1",
    ...overrides,
  };
}

const proxy = new RecordingProxy();
const python = new PythonSandbox(proxy);

beforeAll(async () => {
  await python.load();
}, 120_000);

describe(PythonSandbox, () => {
  it("gives back the returned JSON, the input, the printed lines and the milliseconds", async () => {
    const result = await python.run(
      request('print("a", 1)\nreturn {"total": sum(input["lines"]), "text": """x\n  y"""}', {
        input: { lines: [1, 2, 3] },
      }),
    );
    expect(result.output).toEqual({ total: 6, text: "x\n  y" });
    expect(result.logs).toEqual(["a 1"]);
    expect(result.codeMs).toBeGreaterThanOrEqual(0);
    await expect(python.run(request("x = 1"))).resolves.toMatchObject({ output: null });
  });

  it("refuses sandbox_code_failed for a raise, a syntax error and a value with no JSON form", async () => {
    await expect(
      python.run(request('print("before")\nraise ValueError("nope")')),
    ).rejects.toMatchObject({
      failure: "ValueError: nope",
      logs: ["before"],
    });
    await expect(python.run(request("return ("))).rejects.toBeInstanceOf(SandboxCodeFailedError);
    await expect(python.run(request("return {1, 2}"))).rejects.toBeInstanceOf(
      SandboxCodeFailedError,
    );
    await expect(python.run(request('return float("nan")'))).rejects.toBeInstanceOf(
      SandboxCodeFailedError,
    );
  });

  it("stops a wait past the time limit, a large allocation and too much output", async () => {
    await expect(
      python.run(
        request('await fetch("https://api.example.com/slow")', {
          allowedOrigins: ["https://api.example.com"],
          limits: { ...LIMITS, time: Duration.seconds(0.3) },
        }),
      ),
    ).rejects.toMatchObject({ limit: "time" });
    await expect(
      python.run(request("x = bytearray(512 * 1024 * 1024)\nreturn len(x)")),
    ).rejects.toMatchObject({ limit: "memory" });
    await expect(python.run(request('return "x" * 5000'))).rejects.toMatchObject({
      limit: "output",
    });
    const printed = python.run(request('for i in range(1000):\n    print("line", i)'));
    await expect(printed).rejects.toBeInstanceOf(SandboxLimitExceededError);
    await expect(printed).rejects.toMatchObject({ limit: "output" });
  });

  it("sends an allowed fetch through the proxy with the run's reference and refuses another origin", async () => {
    const result = await python.run(
      request(
        'r = await fetch("https://api.example.com/a", {"method": "post", "body": "{}"})\nreturn r["body"]',
        { allowedOrigins: ["https://api.example.com"] },
      ),
    );
    expect(result.output).toBe("https://api.example.com/a");
    expect(proxy.calls.at(-1)).toMatchObject({
      request: { url: "https://api.example.com/a", method: "POST", body: "{}" },
      reference: "step-1",
    });
    const before = proxy.calls.length;
    const refused = await python.run(
      request(
        'try:\n    await fetch("https://evil.example.org/x")\n    return "sent"\nexcept Exception as error:\n    return str(error)',
        { allowedOrigins: ["https://api.example.com"] },
      ),
    );
    expect(refused.output).toContain("https://evil.example.org is not an allowed origin");
    expect(proxy.calls).toHaveLength(before);
  });

  it("refuses a zero time limit before running", async () => {
    await expect(
      python.run(request("return 1", { limits: { ...LIMITS, time: Duration.seconds(0) } })),
    ).rejects.toThrow(RangeError);
  });
});
