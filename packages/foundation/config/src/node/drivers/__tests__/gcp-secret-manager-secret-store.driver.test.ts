/**
 * Stackra file contract:
 * Purpose: unit tests of `GcpSecretManagerSecretStoreDriver`: it is the `SecretStore` port and throws before it is
 *          loaded; it takes the runtime's token from the metadata server, reads each id's `latest` or pinned version
 *          through the global or the location's regional endpoint, splits JSON secrets, and reads eight at a time;
 *          it fails naming ids and statuses on a refused, slow or empty answer, on no token, and off Google Cloud,
 *          keeping its last good copy; no error carries a value or the token.
 * Boundary: test only; `fetch` is stubbed, so no request leaves the process. Values and the token are canaries.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0173; ADR 0371 (amendment 2026-11-27, STA-258).
 */
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { GcpSecretManagerConfig } from "#config/gcp-secret-manager.config";
import { SecretStore } from "#contracts/ports/secret-store.port";
import { buildConfig } from "#core/functions/build-config.function";
import { GcpSecretManagerSecretStoreDriver } from "#node/drivers/gcp-secret-manager-secret-store.driver";

const TOKEN = "token-canary";

/** What each secret URL answers; anything not listed is a 404. */
let answers: Map<string, () => Response | Promise<Response>>;

/** The metadata server's answer. */
let metadata: () => Response | Promise<Response>;

/** Every request: url, headers and whether it carried a timeout signal. */
let requests: { url: string; headers: Record<string, string>; signal: boolean }[];

/** How many secret requests are in flight at most. */
let peak: number;

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const payload = (text: string): Response =>
  json({ name: "x", payload: { data: Buffer.from(text, "utf8").toString("base64") } });

function store(values: Record<string, unknown>): GcpSecretManagerSecretStoreDriver {
  return new GcpSecretManagerSecretStoreDriver(buildConfig(GcpSecretManagerConfig, { values }));
}

const GLOBAL = "https://secretmanager.googleapis.com/v1/projects/acme-staging/secrets";

describe(GcpSecretManagerSecretStoreDriver, () => {
  beforeEach(() => {
    answers = new Map();
    requests = [];
    peak = 0;
    let inFlight = 0;
    metadata = () => json({ access_token: TOKEN, expires_in: 3599, token_type: "Bearer" });
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      requests.push({
        url,
        headers: init.headers as Record<string, string>,
        signal: init.signal instanceof AbortSignal,
      });
      if (url.startsWith("http://metadata.google.internal/")) return metadata();
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await Promise.resolve();
      inFlight -= 1;
      return (answers.get(url) ?? (() => json({ error: { code: 404 } }, 404)))();
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is a SecretStore that throws before it is loaded", () => {
    const driver = store({});
    expect(driver).toBeInstanceOf(SecretStore);
    expect(() => driver.get("X")).toThrow(/not loaded/);
  });

  it("reads latest and pinned versions with the metadata token, and splits JSON secrets", async () => {
    answers.set(`${GLOBAL}/RESEND_API_KEY/versions/latest:access`, () => payload("resend-canary"));
    answers.set(`${GLOBAL}/app-json/versions/4:access`, () =>
      payload(JSON.stringify({ STRIPE_KEY: "stripe-canary", COUNT: 3 })),
    );
    const driver = store({ project: "acme-staging", secretIds: ["RESEND_API_KEY", "app-json@4"] });
    await driver.load();

    expect(driver.get("RESEND_API_KEY")).toBe("resend-canary");
    expect(driver.get("STRIPE_KEY")).toBe("stripe-canary");
    expect(driver.get("COUNT")).toBeUndefined();
    expect(driver.get("app-json")).toBeUndefined();
    expect(requests[0]).toMatchObject({
      url: "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
      headers: { "Metadata-Flavor": "Google" },
      signal: true,
    });
    expect(requests.slice(1).every((request) => request.signal)).toBe(true);
    expect(requests[1]?.headers).toEqual({ authorization: `Bearer ${TOKEN}` });
  });

  it("reads regional secrets through the location's endpoint", async () => {
    answers.set(
      "https://secretmanager.me-central2.rep.googleapis.com/v1/projects/acme-staging/locations/me-central2/secrets/API_KEY/versions/latest:access",
      () => payload("regional-canary"),
    );
    const driver = store({
      project: "acme-staging",
      location: "me-central2",
      secretIds: ["API_KEY"],
    });
    await driver.load();
    expect(driver.get("API_KEY")).toBe("regional-canary");
  });

  it("reads eight secrets at a time", async () => {
    const ids = Array.from({ length: 20 }, (_, n) => `KEY_${n}`);
    for (const id of ids)
      answers.set(`${GLOBAL}/${id}/versions/latest:access`, () => payload(`${id}-canary`));
    const driver = store({ project: "acme-staging", secretIds: ids });
    await driver.load();
    expect(peak).toBe(8);
    expect(driver.get("KEY_19")).toBe("KEY_19-canary");
  });

  it("fails naming ids and statuses, never a value or the token, and keeps the last good copy", async () => {
    answers.set(`${GLOBAL}/GOOD_KEY/versions/latest:access`, () => payload("good-canary"));
    const driver = store({
      project: "acme-staging",
      secretIds: ["GOOD_KEY"],
    });
    await driver.load();

    answers.set(`${GLOBAL}/DENIED_KEY/versions/latest:access`, () => json({}, 403));
    answers.set(`${GLOBAL}/EMPTY_KEY/versions/latest:access`, () => json({ name: "x" }));
    answers.set(`${GLOBAL}/BAD_JSON/versions/latest:access`, () => new Response("bad-canary {"));
    answers.set(`${GLOBAL}/SLOW_KEY/versions/latest:access`, () => {
      throw Object.assign(new Error("slow-canary"), { name: "TimeoutError" });
    });
    const failing = store({
      project: "acme-staging",
      secretIds: ["GOOD_KEY", "DENIED_KEY", "MISSING_KEY", "EMPTY_KEY", "BAD_JSON", "SLOW_KEY"],
    });
    const failed = failing.load();
    await expect(failed).rejects.toThrow(
      "Google Secret Manager could not read: DENIED_KEY (403), MISSING_KEY (404), EMPTY_KEY (no payload), BAD_JSON (unreadable answer), SLOW_KEY (timeout)",
    );
    await failed.catch((error: Error) => {
      expect(error.message).not.toContain("canary");
    });
    expect(() => failing.get("GOOD_KEY")).toThrow(/not loaded/);

    // The same driver reloading into a failure keeps what it had.
    answers.delete(`${GLOBAL}/GOOD_KEY/versions/latest:access`);
    await expect(driver.load()).rejects.toThrow("GOOD_KEY (404)");
    expect(driver.get("GOOD_KEY")).toBe("good-canary");
  });

  it("refuses a missing project or id, and fails without a token or off Google Cloud", async () => {
    await expect(store({ secretIds: ["A"] }).load()).rejects.toThrow(/needs a project/);
    await expect(store({ project: "acme-staging" }).load()).rejects.toThrow(/at least one/);

    metadata = () => json({}, 404);
    await expect(store({ project: "acme-staging", secretIds: ["A"] }).load()).rejects.toThrow(
      "got no token from the metadata server (status 404)",
    );
    metadata = () => {
      throw new TypeError("fetch failed");
    };
    await expect(store({ project: "acme-staging", secretIds: ["A"] }).load()).rejects.toThrow(
      "the metadata server is unreachable (is this Google Cloud compute?)",
    );
  });
});
