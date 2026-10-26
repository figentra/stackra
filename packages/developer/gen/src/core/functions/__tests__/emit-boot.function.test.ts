/**
 * Stackra file contract:
 * Purpose: unit tests of `emitBoot`: a service that runs the database, the outbox and segments connects them in order
 *          (the bound legal-hold registry and sequence time zone, the database with the hold subscriber and the outbox
 *          writer among its subscribers, then segments, then the bus and inbox connected until the shutdown signal,
 *          then the relay and its work loop on the shutdown signal); each step only when its package is used; no file for a package, an app or a
 *          service with nothing to connect.
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0014 (decision 5); ADR 0078; ADR 0332; ADR 0295 (decision 8); ADR 0263; ADR 0260 (decision 4).
 */
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
      'import { connectHoldRegistry, connectSequenceTimeZone, HoldSubscriber } from "@stackra/database";',
    );
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
        "  options: { readonly url: string; readonly signal: AbortSignal },",
        "): Promise<void> {",
        "  connectHoldRegistry(container.has(HoldRegistry) ? container.get(HoldRegistry) : undefined);",
        "  connectSequenceTimeZone(",
        "    container.has(SequenceTimeZone) ? container.get(SequenceTimeZone) : undefined,",
        "  );",
        "  await PostgresDatabaseDriver.connect({ url: options.url, subscribers: [new HoldSubscriber(), container.get(OutboxWriterService)] });",
        "  container.get(SegmentService).connect(container);",
        "  const bus = container.get(EventBus);",
        "  bus.connect(container);",
        "  const inbox = container.get(InboxService);",
        "  inbox.connect(container);",
        "  options.signal.addEventListener(",
        '    "abort",',
        "    () => {",
        "      bus.disconnect();",
        "      inbox.disconnect();",
        "    },",
        "    { once: true },",
        "  );",
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
      "  await PostgresDatabaseDriver.connect({ url: options.url, subscribers: [new HoldSubscriber()] });",
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
        "  options.signal.addEventListener(",
        '    "abort",',
        "    () => {",
        "      bus.disconnect();",
        "    },",
        "    { once: true },",
        "  );",
      ].join("\n"),
    );
    expect(boot).not.toContain("InboxService");
  });

  it("writes nothing for a package, an app or a service with nothing to connect", () => {
    expect(emitBoot(LOYALTY_KIT_IR)).toBeUndefined();
    expect(emitBoot(WEB_APP_IR)).toBeUndefined();
    expect(emitBoot({ ...COMMERCE_IR, classes: [] })).toBeUndefined();
  });
});
