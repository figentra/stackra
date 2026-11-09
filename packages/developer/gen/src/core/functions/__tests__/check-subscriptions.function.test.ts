/**
 * Stackra file contract:
 * Purpose: unit tests of `checkSubscriptions`: no warning when the pinned contract lists the consumer for the event
 *          (any environment, any version); `client_event_unsubscribed` naming consumer, producer and event when it
 *          does not, or has no `relay` section; nothing for a sibling producer.
 * Boundary: test only; runs on the cross-app IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0511 (amendment of 2026-11-02, decision 17); STA-1910.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { checkSubscriptions } from "#core/functions/check-subscriptions.function";
import type { MemberIR } from "#core/types/member-ir.type";
import { INBOX_IR, PAY_CONTRACT } from "#core/__tests__/fixtures/cross-app-ir.fixture";

/** The `pay` contract without a `relay` section. */
const BARE: StackraManifest = {
  member: PAY_CONTRACT.member,
  package: PAY_CONTRACT.package,
  version: PAY_CONTRACT.version,
  events: PAY_CONTRACT.events ?? [],
};

/** The consumer pinning `manifest` as the `pay` contract. */
const pinning = (manifest: StackraManifest, folder?: string): MemberIR => ({
  ...INBOX_IR,
  services: [
    folder === undefined
      ? { member: "pay", package: "@acme/pay-contract", manifest }
      : { member: "pay", folder, manifest },
  ],
});

describe(checkSubscriptions, () => {
  it("warns nothing when the contract lists the consumer for the event, at any version", () => {
    expect(checkSubscriptions(INBOX_IR)).toEqual([]);
    const older = {
      ...PAY_CONTRACT,
      relay: {
        keys: {},
        subscribers: { prod: [{ member: "billing", events: ["payments.payment.captured.v0"] }] },
      },
    };
    expect(checkSubscriptions(pinning(older))).toEqual([]);
  });

  it("warns naming the consumer, the producer and the event when no environment lists it", () => {
    const other = {
      ...PAY_CONTRACT,
      relay: {
        keys: {},
        subscribers: { dev: [{ member: "ledger", events: ["payments.payment.captured.v1"] }] },
      },
    };
    const [warning] = checkSubscriptions(pinning(other));
    expect(warning?.code).toBe("client_event_unsubscribed");
    expect(warning?.subject).toBe("BillOnPaymentCapturedListener.handle");
    expect(warning?.message).toContain("billing listens to `payments.payment.captured.v1` of pay");
    expect(checkSubscriptions(pinning(BARE)).map((each) => each.code)).toEqual([
      "client_event_unsubscribed",
    ]);
  });

  it("warns by default and refuses under strict, since the listener is never delivered to", () => {
    expect(checkSubscriptions(pinning(BARE)).map((each) => each.severity)).toEqual(["warning"]);
    const strict = checkSubscriptions(pinning(BARE), true);
    expect(strict.map((each) => each.code)).toEqual(["client_event_unsubscribed"]);
    expect(strict.every((each) => each.severity === undefined)).toBe(true);
  });

  it("warns nothing for a sibling producer", () => {
    expect(checkSubscriptions(pinning(BARE, "pay"))).toEqual([]);
  });
});
