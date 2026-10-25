/**
 * Stackra file contract:
 * Purpose: unit tests of `SentryErrorReporterDriver`: it is the `ErrorReporter` port; with the DSN secret set it POSTs
 *          one envelope to the project's endpoint with the auth header; with no secret, a malformed one or a zero
 *          sample it sends nothing; a failed send and a throwing fetch never reach the caller; `flush` waits for sends.
 * Boundary: test only; `fetch` is stubbed, so nothing leaves the process. The DSN is made up.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0184 (decision 6); ADR 0173.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { Clock } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SentryConfig } from "#config/sentry.config";
import { ErrorReporter } from "#contracts/ports/error-reporter.port";
import { SentryErrorReporterDriver } from "#core/drivers/sentry-error-reporter.driver";

const DSN = "https://pub@o1.ingest.example.test/42";

class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-10-25T09:00:00.000Z");
  }
}

/** A store holding `value` under `SENTRY_DSN`. */
function secrets(value: string | undefined): SecretStore {
  return new (class extends SecretStore {
    get(name: string): string | undefined {
      return name === "SENTRY_DSN" ? value : undefined;
    }
  })();
}

function reporter(dsn: string | undefined, sampleRate = 1): SentryErrorReporterDriver {
  return new SentryErrorReporterDriver(
    buildConfig(SentryConfig, { values: { sampleRate } }),
    secrets(dsn),
    new FixedClock(),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(SentryErrorReporterDriver, () => {
  it("is an ErrorReporter", () => {
    expect(reporter(undefined)).toBeInstanceOf(ErrorReporter);
  });

  it("posts one envelope to the project's endpoint", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    const driver = reporter(DSN);
    driver.report(new Error("boom"));
    await driver.flush();
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://o1.ingest.example.test/api/42/envelope/");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["x-sentry-auth"]).toContain("sentry_key=pub");
    expect(String(init.body)).toContain('"value":"boom"');
  });

  it("sends nothing without a DSN, with a malformed one, or at a zero sample", async () => {
    const fetch = vi.fn(async () => new Response(null));
    vi.stubGlobal("fetch", fetch);
    for (const driver of [reporter(undefined), reporter("nonsense"), reporter(DSN, 0)]) {
      driver.report(new Error("boom"));
      await driver.flush();
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it("never fails its caller", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const driver = reporter(DSN);
    expect(() => driver.report(new Error("boom"))).not.toThrow();
    await expect(driver.flush()).resolves.toBeUndefined();
    vi.stubGlobal("fetch", () => {
      throw new Error("sync throw");
    });
    expect(() => reporter(DSN).report(new Error("boom"))).not.toThrow();
  });
});
