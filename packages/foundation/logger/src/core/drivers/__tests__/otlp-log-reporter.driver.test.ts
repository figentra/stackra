/**
 * Stackra file contract:
 * Purpose: unit tests of `OtlpLogReporterDriver`: it is the `LogReporter` port; a full batch is POSTed at once to
 *          `<endpoint>/v1/logs` with the headers from the secret; a partial batch waits for the interval; `flush` sends
 *          the rest; no endpoint sends nothing; the queue drops its oldest records past `maxQueue`; a failing collector
 *          never reaches the caller.
 * Boundary: test only; `fetch` is stubbed and timers are faked, so nothing leaves the process. The header value is
 *           made up.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0147 (decision 1); ADR 0184.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { OtlpConfig } from "#config/otlp.config";
import { LogLevel } from "#contracts/enums/log-level.enum";
import { LogReporter } from "#contracts/ports/log-reporter.port";
import { OtlpLogReporterDriver } from "#core/drivers/otlp-log-reporter.driver";

class HeaderSecrets extends SecretStore {
  get(name: string): string | undefined {
    return name === "OTEL_EXPORTER_OTLP_HEADERS" ? "authorization=Bearer%20test" : undefined;
  }
}

/** A record with event `n`. */
function record(n: number) {
  return {
    time: "2026-10-25T09:00:00.000Z",
    level: LogLevel.Info,
    event: `orders.e${n}`,
    channel: "orders",
    fields: {},
  };
}

function reporter(values: Record<string, unknown>): OtlpLogReporterDriver {
  return new OtlpLogReporterDriver(buildConfig(OtlpConfig, { values }), new HeaderSecrets());
}

/** The events of every batch sent. */
function sentEvents(fetch: ReturnType<typeof vi.fn>): string[][] {
  return fetch.mock.calls.map((call) => {
    const body = JSON.parse(String((call[1] as RequestInit).body)) as {
      resourceLogs: { scopeLogs: { logRecords: { body: { stringValue: string } }[] }[] }[];
    };
    return (body.resourceLogs[0]?.scopeLogs[0]?.logRecords ?? []).map((r) => r.body.stringValue);
  });
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

describe(OtlpLogReporterDriver, () => {
  it("is a LogReporter", () => {
    expect(reporter({})).toBeInstanceOf(LogReporter);
  });

  it("posts a full batch at once with the secret's headers", async () => {
    const driver = reporter({ endpoint: "https://otlp.example.test/", batchSize: 2 });
    driver.report(record(1));
    driver.report(record(2));
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://otlp.example.test/v1/logs");
    expect(init.headers).toMatchObject({
      authorization: "Bearer test",
      "content-type": "application/json",
    });
    expect(sentEvents(fetch)).toEqual([["orders.e1", "orders.e2"]]);
    await driver.flush();
  });

  it("sends a partial batch after the interval, and the rest on flush", async () => {
    const driver = reporter({ endpoint: "https://otlp.example.test", flushIntervalMs: 500 });
    driver.report(record(1));
    expect(fetch).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(sentEvents(fetch)).toEqual([["orders.e1"]]);
    driver.report(record(2));
    await driver.flush();
    expect(sentEvents(fetch)).toEqual([["orders.e1"], ["orders.e2"]]);
  });

  it("sends nothing without an endpoint", async () => {
    const driver = reporter({});
    driver.report(record(1));
    await driver.flush();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("drops the oldest records past maxQueue", async () => {
    const driver = reporter({ endpoint: "https://otlp.example.test", maxQueue: 2 });
    for (const n of [1, 2, 3]) driver.report(record(n));
    await driver.flush();
    expect(sentEvents(fetch)).toEqual([["orders.e2", "orders.e3"]]);
  });

  it("never fails its caller when the collector fails", async () => {
    fetch.mockRejectedValue(new Error("down"));
    const driver = reporter({ endpoint: "https://otlp.example.test", batchSize: 1 });
    expect(() => driver.report(record(1))).not.toThrow();
    await expect(driver.flush()).resolves.toBeUndefined();
  });
});
