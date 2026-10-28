/**
 * Stackra file contract:
 * Purpose: unit tests of `emitBoot`: a service that runs the database, the outbox and segments connects them in order
 *          (the bound legal-hold registry and sequence time zone, the database at the Encore database's url with the
 *          replicas of `DATABASE_REPLICA_URLS`, the bound config's timeouts and pool with `DATABASE_POOL_MAX` over its max (ADR 0473), and the hold, stamp, append-only (stackra-256) and outbox writer
 *          subscribers (stackra-250), then segments, then the bus and inbox connected until the shutdown signal,
 *          then the relay and its work loop on the shutdown signal); a signal already aborted connects nothing, and one
 *          aborted mid-boot disconnects at once; the `EncryptedFieldsSubscriber` only when a model encrypts a field
 *          (stackra-262); the live queries' refresh subscribed on the bus with realtime declared (STA-1445); each
 *          step only when its package is used; no file for a package, an app or a service with nothing to connect.
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0014 (decision 5); ADR 0078; ADR 0332; ADR 0295 (decision 8); ADR 0263; ADR 0260 (decision 4); ADR 0238; ADR 0473.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { emitBoot } from "#core/functions/emit-boot.function";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

describe("emitBoot", () => {
  it("connects the database, segments and the relay in order", () => {
    const boot = emitBoot(BILLING_IR) ?? "";
    expect(boot).toContain('import type { Container } from "@stackra/container";');
    expect(boot).toContain('import { PostgresDatabaseDriver } from "@stackra/database/node";');
    expect(boot).toContain(
      'import { AppendOnlySubscriber, connectHoldRegistry, connectSequenceTimeZone, DatabaseConfig, HoldSubscriber, StampSubscriber } from "@stackra/database";',
    );
    expect(boot).toContain('import { database } from "../encore/billing/database";');
    expect(boot).toContain(
      'import { HoldRegistry, SequenceTimeZone } from "@stackra/database/contracts";',
    );
    expect(boot).toContain(
      'import { InboxService, OutboxRelayService, OutboxWriterService } from "@stackra/outbox/node";',
    );
    expect(boot).toContain('import { EventBus } from "@stackra/events";');
    expect(boot).toContain('import { SegmentService } from "@stackra/segments/node";');
    expect(boot).toContain(
      [
        "export async function boot(",
        "  container: Container,",
        "  options: { readonly signal: AbortSignal },",
        "): Promise<void> {",
        "  if (options.signal.aborted) return;",
        "  connectHoldRegistry(container.has(HoldRegistry) ? container.get(HoldRegistry) : undefined);",
        "  connectSequenceTimeZone(",
        "    container.has(SequenceTimeZone) ? container.get(SequenceTimeZone) : undefined,",
        "  );",
        "  const config = container.has(DatabaseConfig) ? container.get(DatabaseConfig) : undefined;",
        '  const replicas = (process.env["DATABASE_REPLICA_URLS"] ?? "").split(",").filter((url) => url !== "");',
        "  // The instance's share of the runway poolBudget (ADR 0473), set by the deploy; DatabaseConfig.pool.max otherwise.",
        '  const poolMax = Number(process.env["DATABASE_POOL_MAX"] ?? "");',
        "  await PostgresDatabaseDriver.connect({",
        "    url: database.connectionString,",
        "    replicas,",
        "    ...(config === undefined ? {} : { timeouts: config.timeouts }),",
        "    pool: { ...config?.pool, ...(Number.isInteger(poolMax) && poolMax > 0 ? { max: poolMax } : {}) },",
        "    subscribers: [new HoldSubscriber(), new StampSubscriber(), new AppendOnlySubscriber(), container.get(OutboxWriterService)],",
        "  });",
        "  container.get(SegmentService).connect(container);",
        "  const bus = container.get(EventBus);",
        "  bus.connect(container);",
        "  const inbox = container.get(InboxService);",
        "  inbox.connect(container);",
        "  const disconnect = (): void => {",
        "    bus.disconnect();",
        "    inbox.disconnect();",
        "  };",
        "  if (options.signal.aborted) disconnect();",
        '  else options.signal.addEventListener("abort", disconnect, { once: true });',
        "  const relay = container.get(OutboxRelayService);",
        "  relay.connect(container);",
        "  void relay.work({ signal: options.signal });",
        "}",
      ].join("\n"),
    );
  });

  it("writes only the steps whose packages the service runs", () => {
    const boot = emitBoot(COMMERCE_IR) ?? "";
    expect(boot).toContain(
      "    subscribers: [new HoldSubscriber(), new StampSubscriber(), new AppendOnlySubscriber()],",
    );
    expect(boot).not.toContain("Outbox");
    expect(boot).not.toContain("SegmentService");
    expect(boot).not.toContain("EventBus");
  });

  it("connects the bus without an inbox for a service that runs events but no outbox", () => {
    const boot = emitBoot({ ...COMMERCE_IR, packages: ["@stackra/events"] }) ?? "";
    expect(boot).toContain('import { EventBus } from "@stackra/events";');
    expect(boot).toContain(
      [
        "  const bus = container.get(EventBus);",
        "  bus.connect(container);",
        "  const disconnect = (): void => {",
        "    bus.disconnect();",
        "  };",
        "  if (options.signal.aborted) disconnect();",
        '  else options.signal.addEventListener("abort", disconnect, { once: true });',
      ].join("\n"),
    );
    expect(boot).not.toContain("InboxService");
  });

  it("seals encrypted fields with the bound cipher when a model has HasEncryptedFields", () => {
    const boot =
      emitBoot({
        ...COMMERCE_IR,
        classes: COMMERCE_IR.classes.map((declared) =>
          declared.kind === "model"
            ? {
                ...declared,
                traits: [...declared.traits, { name: "HasEncryptedFields", args: ["email"] }],
              }
            : declared,
        ),
      }) ?? "";
    expect(boot).toContain('import { FieldCipher } from "@stackra/contracts";');
    expect(boot).toContain('import { EncryptedFieldsSubscriber } from "@stackra/model";');
    expect(boot).toContain(
      "    subscribers: [new HoldSubscriber(), new StampSubscriber(), new AppendOnlySubscriber(), new EncryptedFieldsSubscriber(container.get(FieldCipher))],",
    );
  });

  it("leaves the subscriber out when no model encrypts a field", () => {
    expect(emitBoot(COMMERCE_IR)).not.toContain("EncryptedFieldsSubscriber");
  });

  it("writes nothing for a package, an app or a service with nothing to connect", () => {
    expect(emitBoot(LOYALTY_KIT_IR)).toBeUndefined();
    expect(emitBoot(WEB_APP_IR)).toBeUndefined();
    expect(emitBoot({ ...COMMERCE_IR, classes: [] })).toBeUndefined();
  });

  it("subscribes each live query's refresh routes on the bus when the service runs realtime (STA-1445)", () => {
    const manifest = {
      actions: [
        {
          kind: "query",
          key: "billing.invoice.get",
          permission: "billing.invoice.read",
          cache: { ttl: "5m", invalidateOn: ["billing.invoice.paid.v1"] },
        },
        {
          kind: "query",
          key: "billing.plan.list",
          permission: "billing.plan.read",
          cache: { ttl: "1h", per: "scope", invalidateOn: ["billing.plan.changed.v1"] },
        },
        {
          kind: "query",
          key: "billing.rate.get",
          permission: "billing.rate.read",
          cache: { ttl: "1m" },
        },
      ],
    } as unknown as StackraManifest;
    const realtime = {
      ...BILLING_IR,
      packages: [...(BILLING_IR.packages ?? []), "@stackra/realtime"],
    };
    const boot = emitBoot(realtime, manifest) ?? "";
    expect(boot).toContain(
      'import { type BroadcastRoute, liveQueryRoutes, RealtimeBroadcaster, RealtimeRelay } from "@stackra/realtime";',
    );
    expect(boot).toContain(
      '  { permission: "billing.invoice.read", audience: BroadcastAudience.Principal, invalidateOn: ["billing.invoice.paid.v1"] },',
    );
    expect(boot).toContain(
      '  { permission: "billing.plan.read", audience: BroadcastAudience.Scope, invalidateOn: ["billing.plan.changed.v1"] },',
    );
    expect(boot).not.toContain("billing.rate.read");
    expect(boot).toContain("class LiveQueryRefreshListener extends Listener {");
    expect(boot).toContain("      bus.subscribe(type, new LiveQueryRefreshListener(send, route));");
    expect(boot.indexOf("bus.connect(container);")).toBeLessThan(
      boot.indexOf("for (const refresh of LIVE_QUERIES)"),
    );
    // Without realtime the queries refresh nothing.
    expect(emitBoot(BILLING_IR, manifest)).not.toContain("LIVE_QUERIES");
  });
});
