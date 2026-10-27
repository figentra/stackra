/**
 * Stackra file contract:
 * Purpose: unit tests of `runPayoutCase`: a gateway that answers what was recorded passes; a wrong status or provider
 *          id, an empty id and a code outside `TransferStatus` are reported; a recorded lost answer passes on
 *          `provider_unavailable`, an unrecorded one and an answer where a loss was recorded are reported; a recorded
 *          refusal passes; a non-refusal error is rethrown.
 * Boundary: test only; the gateway fake and an in-file scripted gateway, no vendor.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0357 (decisions 2 and 6); ADR 0443 (decision 8); owner decision D3 (2026-10-27).
 */
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { TransferStatus } from "#contracts/enums/transfer-status.enum";
import type { PayoutGateway } from "#contracts/types/payout-gateway.type";
import type { TransferResult } from "#contracts/types/transfer-result.type";
import { CapabilityUnsupportedError } from "#core/errors/capability-unsupported.error";
import { PaymentGatewayFake } from "#testing/payment-gateway.fake";
import type { PayoutCase } from "#testing/payout-case.type";
import { runPayoutCase } from "#testing/run-payout-case.function";

/** A gateway answering `answer`, or throwing what it returns when it is a function. */
const scripted = (answer: TransferResult | (() => never)): PayoutGateway => ({
  payout: async () => (typeof answer === "function" ? answer() : answer),
});

const recorded = (expected: PayoutCase["expect"]): PayoutCase => ({
  id: "fake.payout",
  source: "the in-repo gateway fake",
  certification: "pending",
  request: { reference: "po_1", amount: Money.ofMinor(10_000, "SAR"), destination: "acct_1" },
  expect: expected,
});

describe("runPayoutCase", () => {
  it("passes a gateway that answers what was recorded", async () => {
    const result = await runPayoutCase(
      PaymentGatewayFake.with(),
      recorded({ status: TransferStatus.Succeeded, providerRef: "po_po_1" }),
    );
    expect(result).toEqual({
      caseId: "fake.payout",
      answer: { providerRef: "po_po_1", status: TransferStatus.Succeeded },
      mismatches: [],
    });
  });

  it("reports a wrong status and provider id", async () => {
    const { mismatches } = await runPayoutCase(
      PaymentGatewayFake.with(),
      recorded({ status: TransferStatus.Pending, providerRef: "pyt_9" }),
    );
    expect(mismatches).toEqual([
      "status: expected pending, got succeeded",
      "providerRef: expected pyt_9, got po_po_1",
    ]);
  });

  it("reports an empty id and a code outside TransferStatus", async () => {
    const gateway = scripted({ providerRef: "", status: "paid" as TransferStatus });
    expect((await runPayoutCase(gateway, recorded({}))).mismatches).toEqual([
      "providerRef: empty",
      "status: paid is not a TransferStatus code",
    ]);
  });

  it("passes a recorded lost answer and reports one nobody recorded", async () => {
    expect(
      await runPayoutCase(PaymentGatewayFake.with().loseNext(), recorded({ lost: true })),
    ).toEqual({ caseId: "fake.payout", answer: null, mismatches: [] });
    expect(
      (await runPayoutCase(PaymentGatewayFake.with().loseNext(), recorded({}))).mismatches,
    ).toEqual(["refused: provider_unavailable (no outage was recorded)"]);
  });

  it("reports an answer where a loss or a refusal was recorded", async () => {
    const { mismatches } = await runPayoutCase(
      PaymentGatewayFake.with(),
      recorded({ lost: true, refused: "capability_unsupported" }),
    );
    expect(mismatches).toEqual([
      "lost: expected a provider_unavailable refusal, got an answer",
      "refused: expected capability_unsupported, got an answer",
    ]);
  });

  it("passes a recorded refusal and reports another", async () => {
    const unsupported = scripted(() => {
      throw CapabilityUnsupportedError.create({ provider: "fake", capability: "payouts" });
    });
    expect(
      (await runPayoutCase(unsupported, recorded({ refused: "capability_unsupported" })))
        .mismatches,
    ).toEqual([]);
    expect((await runPayoutCase(unsupported, recorded({}))).mismatches).toEqual([
      "refused: capability_unsupported",
    ]);
  });

  it("rethrows an error that is not a refusal", async () => {
    const broken = scripted(() => {
      throw new TypeError("gateway bug");
    });
    await expect(runPayoutCase(broken, recorded({}))).rejects.toThrow("gateway bug");
  });
});
