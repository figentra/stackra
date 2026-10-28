/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryPayrollConnector`: a batch is pushed once per idempotency key and found by it, a
 *          malformed batch is refused before it is kept, and an unknown employee is refused as a provider refuses it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0422 (decision 5).
 */
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { PayInputKind } from "#contracts/enums/pay-input-kind.enum";
import type { PayInputBatch } from "#contracts/types/pay-input-batch.type";
import { ProviderRefusedError } from "#core/errors/provider-refused.error";
import { MemoryPayrollConnector } from "#testing/connectors/memory-payroll.connector";

const BATCH: PayInputBatch = {
  from: "2026-10-01",
  to: "2026-10-31",
  reference: "run_1",
  inputs: [
    { employee: "e1", kind: PayInputKind.Sessions, payCode: "SES", quantity: 12 },
    {
      employee: "e1",
      kind: PayInputKind.Commission,
      payCode: "COM",
      amount: Money.ofMinor(50_000, "AED"),
    },
  ],
};

describe(MemoryPayrollConnector, () => {
  it("pushes once per idempotency key and finds the receipt", async () => {
    const payroll = new MemoryPayrollConnector();
    const receipt = await payroll.pushPayInputs(BATCH, "k1");
    expect(receipt).toEqual({ id: "pib_1", accepted: 2 });
    await expect(payroll.pushPayInputs(BATCH, "k1")).resolves.toBe(receipt);
    expect(payroll.pushed).toHaveLength(1);
    await expect(payroll.findPayInputs("k1")).resolves.toBe(receipt);
    await expect(payroll.findPayInputs("k2")).resolves.toBeNull();
  });

  it("refuses a malformed batch and keeps nothing", async () => {
    const payroll = new MemoryPayrollConnector();
    await expect(payroll.pushPayInputs({ ...BATCH, inputs: [] }, "k1")).rejects.toThrow(TypeError);
    expect(payroll.pushed).toEqual([]);
  });

  it("refuses an employee the provider does not know", async () => {
    const payroll = new MemoryPayrollConnector({ unknownEmployees: ["e1"] });
    const refused = await payroll.pushPayInputs(BATCH, "k1").catch((error: unknown) => error);
    expect(ProviderRefusedError.is(refused, { status: 422, code: "unknown_employee" })).toBe(true);
    await expect(payroll.findPayInputs("k1")).resolves.toBeNull();
  });
});
