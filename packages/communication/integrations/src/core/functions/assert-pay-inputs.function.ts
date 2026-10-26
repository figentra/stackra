/**
 * Stackra file contract:
 * Purpose: `assertPayInputs(batch)`, the check every pay-input batch passes before it reaches a payroll provider: a
 *          period of real days in order, at least one input, each naming an employee and a pay code, a quantity kind
 *          with a positive `quantity` and no `amount`, an amount kind with a positive `amount` and no `quantity`.
 * Boundary: pure. A refused batch is a caller's bug (its mapping or its export run), so it throws a `TypeError` naming
 *           the first bad input by index; no provider is called.
 * Runtime: isomorphic
 * Governing contract: RV-50; RV-26; ADR 0422 (decision 5).
 */
import { PayInputKind } from "#contracts/enums/pay-input-kind.enum";
import type { PayInputBatch } from "#contracts/types/pay-input-batch.type";

/** A `YYYY-MM-DD` calendar date. */
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Whether `text` is a real calendar day. */
const isDay = (text: string): boolean =>
  DAY.test(text) && new Date(`${text}T00:00:00Z`).toISOString().startsWith(text);

/**
 * Throws unless `batch` is a well-formed pay-input batch.
 *
 * @throws TypeError naming the period or the first bad input.
 * @example
 * assertPayInputs({ from: "2026-10-01", to: "2026-10-31", reference: "run_1", inputs });
 */
export function assertPayInputs(batch: PayInputBatch): void {
  if (!isDay(batch.from) || !isDay(batch.to) || batch.from > batch.to)
    throw new TypeError(
      `Pay inputs need a period of real days in order, not ${batch.from}..${batch.to}`,
    );
  if (batch.inputs.length === 0) throw new TypeError("A pay-input batch holds at least one input");
  batch.inputs.forEach((input, index) => {
    const counted = input.kind === PayInputKind.Hours || input.kind === PayInputKind.Sessions;
    const ok =
      input.employee !== "" &&
      input.payCode !== "" &&
      (counted
        ? input.amount === undefined && input.quantity !== undefined && input.quantity > 0
        : input.quantity === undefined && input.amount !== undefined && input.amount.minor > 0);
    if (!ok)
      throw new TypeError(
        `Pay input ${index} (${input.kind}) needs an employee, a pay code and a positive ${counted ? "quantity" : "amount"} only`,
      );
  });
}
