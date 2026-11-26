/**
 * Stackra file contract:
 * Purpose: unit tests of `emitBoot`: a service that runs the database, the outbox and segments connects them in order
 *          (the bound legal-hold registry and sequence time zone, the database at the url the Encore database provides with the
 *          replicas of `DATABASE_REPLICA_URLS`, the bound config's timeouts and pool with `DATABASE_POOL_MAX` over its max (ADR 0473), and the hold, stamp, append-only (stackra-256) and outbox writer
 *          subscribers (stackra-250) and the writer as the native-write watcher (STA-2047), then segments, then the bus and inbox connected until the shutdown signal,
 *          then the relay and its work loop on the shutdown signal); a signal already aborted connects nothing, and one
 *          aborted mid-boot disconnects at once; the `EncryptedFieldsSubscriber` only when a model encrypts a field
 *          (stackra-262); the live queries' refresh subscribed on the bus with realtime declared (STA-1445); each
 *          step only when its package is used; the record policies first when the manifest lists one (STA-2045); the
 *          queue worker connected for a service that runs `@stackra/queue` (STA-2046); no file for a package, an app or a
 *          service with nothing to connect.
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0014 (decision 5); ADR 0078; ADR 0332; ADR 0295 (decision 8); ADR 0263; ADR 0260 (decision 4); ADR 0238; ADR 0473.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { emitBoot } from "#core/functions/emit-boot.function";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { INBOX_IR, PLAIN_IR, PRODUCER_IR } from "#core/__tests__/fixtures/cross-app-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

describe("emitBoot", () => {
  it("connects the database, segments and the relay in order", () => {
    const boot = emitBoot(BILLING_IR) ?? "";
    expect(boot).toContain('import type { Container } from "@stackra/container";');
    expect(boot).toContain(
      'import { databaseUrl, PostgresDatabaseDriver } from "@stackra/database/node";',
    );
    expect(boot).toContain(
      'import { AppendOnlySubscriber, connectHoldRegistry, connectNativeWriteWatcher, connectSequenceTimeZone, connectVisibilityFilter, DatabaseConfig, HoldSubscriber, StampSubscriber } from "@stackra/database";',
    );
    // The service program never reaches the generated Encore services (STA-1652).
    expect(boot).not.toContain("stackra-encore");
    expect(boot).toContain(
      'import { HoldRegistry, SequenceTimeZone } from "@stackra/database/contracts";',
    );
    expect(boot).toContain(
      'import { InboxService, OutboxRelayService, OutboxWriterService } from "@stackra/outbox/node";',
    );
    expect(boot).toContain('import { EventBus } from "@stackra/events";');
    expect(boot).toContain('import { SegmentService } from "@stackra/segments/node";');
    expect(boot).toContain('import { QueueWorkerService } from "@stackra/queue/node";');
    expect(boot).toContain(
      [
        "export async function boot(",
        "  container: Container,",
        "  options: { readonly signal: AbortSignal; readonly url?: string; readonly relay?: boolean },",
        "): Promise<void> {",
        "  if (options.signal.aborted) return;",
        "  connectHoldRegistry(container.has(HoldRegistry) ? container.get(HoldRegistry) : undefined);",
        "  connectSequenceTimeZone(",
        "    container.has(SequenceTimeZone) ? container.get(SequenceTimeZone) : undefined,",
        "  );",
        // Reads take the bound VisibilityFilter, writes stamp the call's actor, the call's time zone is read (STA-2044).
        "  connectVisibilityFilter(container);",
        "  const config = container.has(DatabaseConfig) ? container.get(DatabaseConfig) : undefined;",
        '  const replicas = (process.env["DATABASE_REPLICA_URLS"] ?? "").split(",").filter((url) => url !== "");',
        "  // The instance's share of the runway poolBudget (ADR 0473), set by the deploy; DatabaseConfig.pool.max otherwise.",
        '  const poolMax = Number(process.env["DATABASE_POOL_MAX"] ?? "");',
        "  await PostgresDatabaseDriver.connect({",
        "    // The seed entry passes the direct url (STA-1709); a server reads the one Encore provided (STA-1652).",
        "    url: options.url ?? databaseUrl(),",
        "    replicas,",
        "    ...(config === undefined ? {} : { timeouts: config.timeouts }),",
        "    pool: { ...config?.pool, ...(Number.isInteger(poolMax) && poolMax > 0 ? { max: poolMax } : {}) },",
        "    subscribers: [new HoldSubscriber(), new StampSubscriber(), new AppendOnlySubscriber(), container.get(OutboxWriterService)],",
        "  });",
        // Native CrudService writes reach the change log through the writer (STA-2047).
        "  connectNativeWriteWatcher(container.get(OutboxWriterService));",
        "  container.get(SegmentService).connect(container);",
        "  container.get(QueueWorkerService).connect(container);",
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
        "  if (options.relay !== false) {",
        "    const relay = container.get(OutboxRelayService);",
        "    relay.connect(container);",
        "    void relay.work({ signal: options.signal });",
        "  }",
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
    expect(boot).not.toContain("connectNativeWriteWatcher");
    expect(boot).not.toContain("SegmentService");
    expect(boot).not.toContain("EventBus");
  });

  it("connects the automation service, after segments and before the bus, for a service that runs workflow", () => {
    const boot = emitBoot({ ...COMMERCE_IR, packages: ["@stackra/workflow"] }) ?? "";
    expect(boot).toContain('import { AutomationService } from "@stackra/workflow/node";');
    expect(boot).toContain("  container.get(AutomationService).connect(container);");
    expect(boot).not.toContain("EventBus");
    const withBus =
      emitBoot({
        ...COMMERCE_IR,
        packages: ["@stackra/segments", "@stackra/workflow", "@stackra/events"],
      }) ?? "";
    expect(withBus.indexOf("container.get(SegmentService)")).toBeLessThan(
      withBus.indexOf("container.get(AutomationService)"),
    );
    expect(withBus.indexOf("container.get(AutomationService)")).toBeLessThan(
      withBus.indexOf("bus.connect(container)"),
    );
    expect(emitBoot(COMMERCE_IR)).not.toContain("AutomationService");
  });

  it("connects the queue worker, before the bus, for a service that runs queue (STA-2046)", () => {
    const boot = emitBoot({ ...COMMERCE_IR, packages: ["@stackra/queue"] }) ?? "";
    expect(boot).toContain('import { QueueWorkerService } from "@stackra/queue/node";');
    expect(boot).toContain("  container.get(QueueWorkerService).connect(container);");
    // A service with only a queue still gets a boot, so the jobs its Encore subscriptions deliver can run.
    expect(emitBoot({ ...COMMERCE_IR, classes: [], packages: ["@stackra/queue"] })).toContain(
      "container.get(QueueWorkerService).connect(container);",
    );
    const withBus =
      emitBoot({ ...COMMERCE_IR, packages: ["@stackra/queue", "@stackra/events"] }) ?? "";
    expect(withBus.indexOf("container.get(QueueWorkerService)")).toBeLessThan(
      withBus.indexOf("bus.connect(container)"),
    );
    expect(emitBoot(COMMERCE_IR)).not.toContain("QueueWorkerService");
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
    expect(boot).toContain('import { FieldCipher, KeyProvider } from "@stackra/contracts";');
    expect(boot).toContain('import { EncryptedFieldsSubscriber } from "@stackra/model";');
    expect(boot).toContain(
      "    subscribers: [new HoldSubscriber(), new StampSubscriber(), new AppendOnlySubscriber(), new EncryptedFieldsSubscriber(container.get(FieldCipher), undefined, container.has(KeyProvider) ? container.get(KeyProvider) : undefined)],",
    );
  });

  it("adds the TreeSubscriber after the always-on subscribers when a model has HasTree (STA-1419)", () => {
    const boot =
      emitBoot({
        ...COMMERCE_IR,
        classes: COMMERCE_IR.classes.map((declared) =>
          declared.kind === "model"
            ? { ...declared, traits: [...declared.traits, { name: "HasTree", args: [] }] }
            : declared,
        ),
      }) ?? "";
    expect(boot).toContain(
      'import { AppendOnlySubscriber, connectHoldRegistry, connectSequenceTimeZone, connectVisibilityFilter, DatabaseConfig, HoldSubscriber, StampSubscriber, TreeSubscriber } from "@stackra/database";',
    );
    expect(boot).toContain(
      "    subscribers: [new HoldSubscriber(), new StampSubscriber(), new AppendOnlySubscriber(), new TreeSubscriber()],",
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

  it("connects the extension slots when the service declares an extension, and only then", () => {
    const withExtension = {
      ...COMMERCE_IR,
      classes: [
        ...COMMERCE_IR.classes,
        { ...COMMERCE_IR.classes[0], name: "TierBonusExtension", kind: "extension" },
      ],
    } as typeof COMMERCE_IR;
    const boot = emitBoot(withExtension) ?? "";
    expect(boot).toContain('import { connectExtensions } from "@stackra/actions";');
    expect(boot).toContain("  connectExtensions(container);");
    expect(emitBoot(COMMERCE_IR) ?? "").not.toContain("connectExtensions");
  });

  it("connects the record policies first when the manifest lists one, and only then (STA-2045)", () => {
    const manifest = {
      policies: [{ class: "OrderPolicy", model: "Order", module: "orders", file: "x.ts" }],
    } as unknown as StackraManifest;
    const boot = emitBoot(COMMERCE_IR, manifest) ?? "";
    expect(boot).toContain('import { connectPolicies } from "@stackra/iam";');
    expect(boot).toContain("  if (options.signal.aborted) return;\n  connectPolicies(container);");
    expect(emitBoot(COMMERCE_IR)).not.toContain("connectPolicies");
    // A service with nothing else to connect still connects its policies.
    expect(emitBoot({ ...COMMERCE_IR, classes: [] }, manifest)).toContain(
      "connectPolicies(container);",
    );
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

describe("emitBoot and the cross-app relay (STA-1910)", () => {
  it("starts the cross-app relay beside the outbox relay of a producer", () => {
    const boot = emitBoot(PRODUCER_IR) ?? "";
    expect(boot).toContain(
      'import { CrossAppRelayService, InboxService, OutboxRelayService, OutboxWriterService } from "@stackra/outbox/node";',
    );
    expect(boot).toContain(
      [
        "  if (options.relay !== false) {",
        "    const relay = container.get(OutboxRelayService);",
        "    relay.connect(container);",
        "    void relay.work({ signal: options.signal });",
        "    const crossApp = container.get(CrossAppRelayService);",
        "    crossApp.connect(container);",
        "    void crossApp.work({ signal: options.signal });",
        "  }",
      ].join("\n"),
    );
  });

  it("connects the cross-app inbox of a consumer, and nothing for a service without either", () => {
    const boot = emitBoot(INBOX_IR) ?? "";
    expect(boot).toContain("  container.get(RelayInboxService).connect(container);");
    expect(boot).not.toContain("CrossAppRelayService");
    const plain = emitBoot(PLAIN_IR) ?? "";
    expect(plain).not.toMatch(/CrossAppRelayService|RelayInboxService/);
  });
});
