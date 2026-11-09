/**
 * Stackra file contract:
 * Purpose: unit tests of `emitEventsRelay`: a producer's runway `events` blocks become `EventsRelayConfig` with every
 *          environment fixed at build time and the running one picked by `STACKRA_ENVIRONMENT`; a service without a
 *          block gets nothing.
 * Boundary: test only; runs on the cross-app IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0511 (amendment of 2026-11-02, decisions 16 and 17); STA-1910.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitEventsRelay } from "#core/functions/emit-events-relay.function";
import { PLAIN_IR, PRODUCER_IR } from "#core/__tests__/fixtures/cross-app-ir.fixture";

describe(emitEventsRelay, () => {
  it("fixes every environment and picks the running one", () => {
    const relay = emitEventsRelay(PRODUCER_IR) ?? "";
    expect(relay).toContain(
      '  "dev": { signingKey: "STACKRA_EVENTS_SIGNING_KEY", keys: [{"id":"pay-dev-1","publicKey":"cGF5LWRldi1wdWJsaWM"}], subscribers: [{"member":"billing","inbox":"http://localhost:4012","events":["payments.payment.captured.v1"]}] },',
    );
    expect(relay).toContain('  "prod": { signingKey: "PAY_EVENTS_SIGNING_KEY",');
    expect(relay).toContain('const RUNNING = RELAYS[process.env["STACKRA_ENVIRONMENT"] ?? "dev"];');
    expect(relay).toContain("export class EventsRelayConfig extends BaseEventsRelayConfig {");
  });

  it("writes nothing without an events block", () => {
    expect(emitEventsRelay(PLAIN_IR)).toBeUndefined();
  });
});
