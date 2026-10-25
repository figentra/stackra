/**
 * Stackra file contract:
 * Purpose: unit tests of `sentryTarget`: a DSN's envelope endpoint (with and without a path prefix) and public key, and
 *          `undefined` for a malformed DSN, another scheme, no key or a non-numeric project.
 * Boundary: test only; the DSNs are made up.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0184 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { sentryTarget } from "#core/functions/sentry-target.function";

describe("sentryTarget", () => {
  it("reads the endpoint and key of a DSN", () => {
    expect(sentryTarget("https://pub@o1.ingest.example.test/42")).toEqual({
      endpoint: "https://o1.ingest.example.test/api/42/envelope/",
      key: "pub",
      dsn: "https://pub@o1.ingest.example.test/42",
    });
  });

  it("keeps a path prefix and a port", () => {
    expect(sentryTarget("http://pub@sentry.local:9000/relay/7")?.endpoint).toBe(
      "http://sentry.local:9000/relay/api/7/envelope/",
    );
  });

  it("refuses what is not a DSN", () => {
    expect(sentryTarget("not a url")).toBeUndefined();
    expect(sentryTarget("ftp://pub@host.test/1")).toBeUndefined();
    expect(sentryTarget("https://host.test/1")).toBeUndefined();
    expect(sentryTarget("https://pub@host.test/project")).toBeUndefined();
    expect(sentryTarget("https://pub@host.test/")).toBeUndefined();
  });
});
