/**
 * Stackra file contract:
 * Purpose: unit tests of `otlpExporter`: it POSTs a full batch at once to `<endpoint>/v1/<signal>` with the secret's
 *          headers, a partial batch after the interval, the rest on flush; with no endpoint it sends nothing; and it
 *          counts what it drops (queue overflow, a rejected fetch, a non-2xx answer, a throwing encoder) without ever
 *          throwing.
 * Boundary: test only; `fetch` is stubbed and timers are faked, so nothing leaves the process. The header value is
 *           made up.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0184 (decisions 1 and 2).
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { OtlpConfig } from "#config/otlp.config";
import { otlpExporter } from "#core/functions/otlp-exporter.function";

class HeaderSecrets extends SecretStore {
  get(name: string): string | undefined {
    return name === "OTEL_EXPORTER_OTLP_HEADERS" ? "x-team=ops" : undefined;
  }
}

function exporter(
  values: Record<string, unknown>,
  encode = (batch: readonly number[]) => ({ batch }),
) {
  return otlpExporter(buildConfig(OtlpConfig, { values }), new HeaderSecrets(), "traces", encode);
}

/** The batches of every request sent. */
function sent(fetch: ReturnType<typeof vi.fn>): number[][] {
  return fetch.mock.calls.map(
    (call) => (JSON.parse(String((call[1] as RequestInit).body)) as { batch: number[] }).batch,
  );
}

let fetch: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  fetch = vi.fn(async () => new Response(null, { status: 200 }));
  vi.stubGlobal("fetch", fetch);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("otlpExporter", () => {
  it("posts a full batch at once to the signal's path with the secret's headers", async () => {
    const out = exporter({ endpoint: "https://otlp.example.test/", batchSize: 2 });
    out.push(1);
    out.push(2);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://otlp.example.test/v1/traces");
    expect(init.headers).toMatchObject({ "x-team": "ops", "content-type": "application/json" });
    expect(sent(fetch)).toEqual([[1, 2]]);
    await out.flush();
    expect(out.dropped).toBe(0);
  });

  it("sends a partial batch after the interval, and the rest on flush", async () => {
    const out = exporter({ endpoint: "https://otlp.example.test", flushIntervalMs: 500 });
    out.push(1);
    expect(fetch).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    out.push(2);
    await out.flush();
    expect(sent(fetch)).toEqual([[1], [2]]);
  });

  it("sends nothing without an endpoint", async () => {
    const out = exporter({});
    out.push(1);
    await out.flush();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("counts the oldest items dropped past maxQueue", async () => {
    const out = exporter({ endpoint: "https://otlp.example.test", maxQueue: 2 });
    for (const n of [1, 2, 3]) out.push(n);
    await out.flush();
    expect(sent(fetch)).toEqual([[2, 3]]);
    expect(out.dropped).toBe(1);
  });

  it("counts failed batches and never throws", async () => {
    const out = exporter({ endpoint: "https://otlp.example.test", batchSize: 1 });
    fetch.mockRejectedValueOnce(new Error("down"));
    fetch.mockResolvedValueOnce(new Response(null, { status: 503 }));
    expect(() => out.push(1)).not.toThrow();
    out.push(2);
    await expect(out.flush()).resolves.toBeUndefined();
    expect(out.dropped).toBe(2);
    const broken = exporter({ endpoint: "https://otlp.example.test", batchSize: 1 }, () => {
      throw new Error("encode");
    });
    expect(() => broken.push(1)).not.toThrow();
    expect(broken.dropped).toBe(1);
  });
});
