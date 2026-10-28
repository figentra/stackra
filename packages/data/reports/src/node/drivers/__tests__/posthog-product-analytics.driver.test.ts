/**
 * Stackra file contract:
 * Purpose: unit tests of `PosthogProductAnalyticsDriver`: a funnel, retention or cohort query is posted to
 *          `<host>/api/projects/<projectId>/query/` with the key from the runtime secret store and narrowed to the
 *          call's scope; a call with no scope is refused while isolating by scope and allowed with no filter when the
 *          scope property is null; an unconfigured project, an unbound key and an error status are unavailable; a
 *          malformed query never reaches PostHog; the key never appears in an error.
 * Boundary: test only; `fetch` is replaced, so no request leaves the process; the key is a test value held by a
 *           stand-in `SecretStore`, and the call context is a stand-in `ContextStorage`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0163 (decision 5 as amended 2026-10-28); ADR 0173; ADR 0323.
 */
import type { ContextStorage } from "@stackra/actions/contracts";
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RetentionPeriod } from "#contracts/enums/retention-period.enum";
import { ProductAnalytics } from "#contracts/ports/product-analytics.port";
import { ReportsConfig } from "#node/config/reports.config";
import { PosthogProductAnalyticsDriver } from "#node/drivers/posthog-product-analytics.driver";
import { ProductAnalyticsQueryInvalidError } from "#node/errors/product-analytics-query-invalid.error";
import { ProductAnalyticsScopeMissingError } from "#node/errors/product-analytics-scope-missing.error";
import { ProductAnalyticsUnavailableError } from "#node/errors/product-analytics-unavailable.error";

/** A secret store holding `values`. */
function storeOf(values: Readonly<Record<string, string>>): SecretStore {
  return Object.assign(Object.create(SecretStore.prototype) as SecretStore, {
    get: (name: string) => values[name],
  });
}

/** The test key; a test-only value. */
const KEY = "test-only-posthog-key";

const range = { from: "2026-10-01", to: "2026-10-28" };
const funnel = { steps: [{ event: "cart_viewed" }, { event: "order_placed" }], range };

/** A driver over the test project, the call `context` and PostHog settings `posthog`. */
function driverWith(
  context: object | undefined = { scopeId: "org_1" },
  posthog: Record<string, unknown> = {},
): PosthogProductAnalyticsDriver {
  const config = buildConfig(ReportsConfig, {
    values: {
      posthog: {
        host: "https://posthog.test/",
        projectId: "12345",
        keySecret: "REPORTS_POSTHOG_KEY",
        ...posthog,
      },
    },
  });
  const storage = { current: () => context } as unknown as ContextStorage;
  return new PosthogProductAnalyticsDriver(config, storeOf({ REPORTS_POSTHOG_KEY: KEY }), storage);
}

/** Replaces `fetch` with a PostHog that answers `reply` with `status`. */
function answering(reply: unknown, status = 200) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async () => new Response(JSON.stringify(reply), { status }));
}

/** The JSON body of the `index`th request. */
function bodyOf(
  fetch: ReturnType<typeof answering>,
  index = 0,
): { query: Record<string, unknown> } {
  const init = fetch.mock.calls[index]?.[1];
  return JSON.parse(String(init?.body)) as { query: Record<string, unknown> };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe(PosthogProductAnalyticsDriver, () => {
  it("posts a scoped funnel to the project's query API with the key", async () => {
    const fetch = answering({ results: [{ count: 10 }, { count: 4, median_conversion_time: 60 }] });
    const driver = driverWith();
    expect(driver).toBeInstanceOf(ProductAnalytics);
    await expect(driver.funnel(funnel)).resolves.toEqual({
      steps: [
        { event: "cart_viewed", people: 10, conversion: 1, medianSeconds: null },
        { event: "order_placed", people: 4, conversion: 0.4, medianSeconds: 60 },
      ],
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://posthog.test/api/projects/12345/query/",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
      }),
    );
    expect(bodyOf(fetch).query).toMatchObject({
      kind: "FunnelsQuery",
      properties: [{ key: "scope_id", value: "org_1", operator: "exact", type: "event" }],
    });
  });

  it("runs retention and cohorts through the same scoped call", async () => {
    const fetch = answering({ results: [] });
    const driver = driverWith();
    await expect(
      driver.retention({
        startEvent: "signed_up",
        returnEvent: "order_placed",
        period: RetentionPeriod.Week,
        intervals: 4,
        range,
      }),
    ).resolves.toEqual({ period: "week", cohorts: [] });
    await expect(
      driver.cohort({ match: { event: "order_placed" }, period: RetentionPeriod.Month, range }),
    ).resolves.toEqual({ period: "month", buckets: [] });
    expect(bodyOf(fetch, 0).query).toMatchObject({ kind: "RetentionQuery" });
    expect(bodyOf(fetch, 1).query).toMatchObject({
      kind: "TrendsQuery",
      properties: [{ key: "scope_id", value: "org_1" }],
    });
  });

  it("refuses a call with no scope, and reads unscoped when the scope property is null", async () => {
    const fetch = answering({ results: [{ count: 1 }, { count: 1 }] });
    await expect(driverWith({}).funnel(funnel)).rejects.toBeInstanceOf(
      ProductAnalyticsScopeMissingError,
    );
    expect(fetch).not.toHaveBeenCalled();
    await driverWith({}, { scopeProperty: null }).funnel(funnel);
    expect(bodyOf(fetch).query).toMatchObject({ properties: [] });
  });

  it("never sends a malformed query", async () => {
    const fetch = answering({ results: [] });
    await expect(
      driverWith().funnel({ ...funnel, steps: [{ event: "a" }] }),
    ).rejects.toBeInstanceOf(ProductAnalyticsQueryInvalidError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("is unavailable when unconfigured, unbound or failing, and never leaks the key", async () => {
    answering({ detail: "boom" }, 503);
    await expect(
      driverWith({}, { projectId: null, scopeProperty: null }).funnel(funnel),
    ).rejects.toBeInstanceOf(ProductAnalyticsUnavailableError);
    await expect(
      driverWith({}, { keySecret: "OTHER_KEY", scopeProperty: null }).funnel(funnel),
    ).rejects.toMatchObject({ reason: "the key secret OTHER_KEY is not bound" });
    const failure = await driverWith()
      .funnel(funnel)
      .catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(ProductAnalyticsUnavailableError);
    expect(failure).toMatchObject({ driver: "posthog", reason: "PostHog answered 503" });
    expect(JSON.stringify(failure)).not.toContain(KEY);
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError(`failed with ${KEY}`));
    const unreachable = await driverWith()
      .funnel(funnel)
      .catch((error: unknown) => error);
    expect(unreachable).toMatchObject({ reason: "PostHog could not be reached" });
    expect(JSON.stringify(unreachable)).not.toContain(KEY);
  });
});
