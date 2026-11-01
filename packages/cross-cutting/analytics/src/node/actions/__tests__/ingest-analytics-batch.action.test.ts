/**
 * Stackra file contract:
 * Purpose: unit tests of `IngestAnalyticsBatchAction` (STA-1624): the public ingest endpoint's options; an unverified
 *          snapshot publishes nothing; deliveries of another subject are dropped; a user id bound as subject counts;
 *          each granted destination gets one `AnalyticsBatchAccepted` with only what its category, include and exclude
 *          allow (identify reaching every one); `denyProperties` are stripped; the counts; and the input refuses an
 *          empty, oversized or malformed batch.
 * Boundary: test only; `fakeActionContext` records what is published, no outbox, no network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0483 (decisions 2, 3 and 4); ADR 0472 (decision 4).
 */
import { Idempotency } from "@stackra/actions";
import { fakeActionContext, grantedConsent } from "@stackra/actions/testing";
import { buildConfig } from "@stackra/config";
import { ConsentCategory } from "@stackra/consent";
import { kindOf } from "@stackra/container";
import { ActorKind, ApiArea, HttpMethod } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { AnalyticsConfig } from "#config/analytics.config";
import { AnalyticsDeliveryKind } from "#contracts/enums/analytics-delivery-kind.enum";
import { IngestAnalyticsBatchAction } from "#node/actions/ingest-analytics-batch.action";
import { AnalyticsBatchAccepted } from "#node/events/analytics-batch-accepted.event";
import { IngestAnalyticsBatchInput } from "#node/schemas/ingest-analytics-batch-input.schema";

/** A delivery named `name` for the `grantedConsent` subject, with `overrides`. */
const delivery = (name: string, overrides: Record<string, unknown> = {}) => ({
  eventId: `evt_${name}`,
  name,
  properties: { plan: "pro", email: "a@b.c" },
  occurredAt: "2026-10-30T09:00:00.000Z",
  anonymousId: "anon_test",
  sessionId: "ses_1",
  context: { library: { name: "@stackra/analytics" } },
  ...overrides,
});

/** The action over a config with `values`, denying `email`. */
function action(values: Record<string, unknown> = {}) {
  return new IngestAnalyticsBatchAction(
    buildConfig(AnalyticsConfig, { values: { denyProperties: ["email"], ...values } }),
  );
}

/** The events `ctx` recorded as published. */
const published = (ctx: ReturnType<typeof fakeActionContext>) =>
  ctx.recorded.published as AnalyticsBatchAccepted[];

describe(IngestAnalyticsBatchAction, () => {
  it("is the public ingest endpoint, open to visitors and users and never a tool", () => {
    expect(kindOf(IngestAnalyticsBatchAction)?.options).toMatchObject({
      key: "analytics_batch.ingest",
      actors: [ActorKind.Anonymous, ActorKind.User],
      area: ApiArea.Public,
      endpoint: { method: HttpMethod.Post, path: "/analytics/batches" },
      idempotency: Idempotency.Optional,
      tool: false,
    });
  });

  // @covers sta-1624:FR-004
  it("publishes nothing without a verified snapshot", async () => {
    const ctx = fakeActionContext();
    const input = IngestAnalyticsBatchInput.create({ deliveries: [delivery("a"), delivery("b")] });
    expect(await action().handle(input, ctx)).toMatchObject({ accepted: 0, dropped: 2 });
    expect(published(ctx)).toEqual([]);
  });

  // @covers sta-1624:FR-004
  it("drops deliveries of another subject and keeps a user bound as subject", async () => {
    const ctx = fakeActionContext({ consent: grantedConsent("analytics") });
    const input = IngestAnalyticsBatchInput.create({
      deliveries: [
        delivery("mine"),
        delivery("theirs", { anonymousId: "anon_other" }),
        delivery("signed.in", { anonymousId: "anon_other", userId: "anon_test" }),
      ],
    });
    expect(await action().handle(input, ctx)).toMatchObject({ accepted: 2, dropped: 1 });
    expect(published(ctx)[0]?.deliveries.map((item) => item.name)).toEqual(["mine", "signed.in"]);
  });

  // @covers sta-1624:FR-004 sta-1624:FR-006
  it("strips denyProperties and passes nothing but the envelope", async () => {
    const ctx = fakeActionContext({ consent: grantedConsent("analytics") });
    await action().handle(IngestAnalyticsBatchInput.create({ deliveries: [delivery("a")] }), ctx);
    const [event] = published(ctx);
    expect(event).toBeInstanceOf(AnalyticsBatchAccepted);
    expect(event).toMatchObject({ destination: "default", snapshotId: "csn_test" });
    expect(event?.deliveries).toEqual([{ ...delivery("a"), properties: { plan: "pro" } }]);
  });

  // @covers sta-1624:FR-004
  it("publishes one event per granted destination with only what it takes", async () => {
    const ctx = fakeActionContext({ consent: grantedConsent("analytics") });
    const ingest = action({
      drivers: { ga4: "none", ads: "none" },
      destinations: [
        { driver: "default", category: ConsentCategory.Analytics, exclude: ["page.scrolled"] },
        { driver: "ga4", category: ConsentCategory.Analytics, include: ["purchase"] },
        { driver: "ads", category: ConsentCategory.Marketing },
      ],
    });
    const input = IngestAnalyticsBatchInput.create({
      deliveries: [
        delivery("page.scrolled"),
        delivery("purchase"),
        delivery("$identify", { kind: AnalyticsDeliveryKind.Identify, userId: "usr_1" }),
      ],
    });
    expect(await ingest.handle(input, ctx)).toMatchObject({ accepted: 3, dropped: 0 });
    expect(
      published(ctx).map((event) => [event.destination, event.deliveries.map((item) => item.name)]),
    ).toEqual([
      ["default", ["purchase", "$identify"]],
      ["ga4", ["purchase", "$identify"]],
    ]);
  });

  it("refuses an empty, oversized or malformed batch at the boundary", () => {
    expect(() => IngestAnalyticsBatchInput.create({ deliveries: [] })).toThrow();
    expect(() =>
      IngestAnalyticsBatchInput.create({
        deliveries: Array.from({ length: 101 }, (_, index) => delivery(`e.${index}`)),
      }),
    ).toThrow();
    expect(() =>
      IngestAnalyticsBatchInput.create({ deliveries: [{ name: "no.ids" }] as never }),
    ).toThrow();
  });
});
