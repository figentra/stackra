/**
 * Stackra file contract:
 * Purpose: unit tests of `translateDbError`: an optimistic-lock failure is `stale_version` (409), a unique violation
 *          `duplicate_record` (409) naming the constraint, a foreign-key, check or not-null violation
 *          `constraint_violated` (400), a deadlock or serialization failure a retryable `transaction_conflict`, the
 *          SQLSTATE is found on the cause too, and anything else comes back unchanged.
 * Boundary: test only; the driver errors are stand-ins carrying a SQLSTATE.
 * Runtime: node (vitest)
 * Governing contract: ADR 0133 (decision 6); ADR 0140; ADR 0022; ADR 0269.
 */
import { OptimisticLockError } from "@mikro-orm/core";
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ConstraintViolatedError } from "#core/errors/constraint-violated.error";
import { DuplicateRecordError } from "#core/errors/duplicate-record.error";
import { StaleVersionError } from "#core/errors/stale-version.error";
import { TransactionConflictError } from "#core/errors/transaction-conflict.error";
import { translateDbError } from "#core/functions/translate-db-error.function";

class StockLevel {}

/** A driver error carrying `fields`. */
function driverError(fields: Record<string, string>): Error {
  return Object.assign(new Error("driver"), fields);
}

describe("translateDbError", () => {
  it("raises an optimistic-lock failure as a stale version", () => {
    const refusal = translateDbError(OptimisticLockError.lockFailed(new StockLevel()));
    expect(isRefusal(refusal, StaleVersionError)).toBe(true);
    expect(Enum.meta(ErrorKind, (refusal as StaleVersionError).kind).httpStatus).toBe(409);
    expect((refusal as StaleVersionError).model).toBe("StockLevel");
  });

  it("raises constraint violations as conflict or validation refusals naming the constraint", () => {
    const duplicate = translateDbError(
      driverError({ code: "23505", constraint: "uq_orders_number" }),
    );
    expect(isRefusal(duplicate, DuplicateRecordError)).toBe(true);
    expect((duplicate as DuplicateRecordError).toEnvelope()).toMatchObject({
      code: "duplicate_record",
      details: { constraint: "uq_orders_number" },
    });
    for (const code of ["23503", "23514"]) {
      const refused = translateDbError(driverError({ code, constraint: "fk_lines_order" }));
      expect(isRefusal(refused, ConstraintViolatedError)).toBe(true);
      expect((refused as ConstraintViolatedError).kind).toBe(ErrorKind.Validation);
    }
    const missing = translateDbError(driverError({ sqlState: "23502", column: "status" }));
    expect((missing as ConstraintViolatedError).constraint).toBe("status");
  });

  it("raises a lost race as a retryable conflict, reading the cause too", () => {
    const wrapped = new Error("flush failed", { cause: driverError({ code: "40P01" }) });
    const refused = translateDbError(wrapped);
    expect(isRefusal(refused, TransactionConflictError)).toBe(true);
    expect((refused as TransactionConflictError).retryable).toBe(true);
    expect(
      isRefusal(translateDbError(driverError({ code: "40001" })), TransactionConflictError),
    ).toBe(true);
  });

  it("leaves anything else alone", () => {
    const bug = new TypeError("bug");
    expect(translateDbError(bug)).toBe(bug);
    const other = driverError({ code: "42P01" });
    expect(translateDbError(other)).toBe(other);
    const refusal = StaleVersionError.create({ model: "X" });
    expect(translateDbError(refusal)).toBe(refusal);
  });
});
