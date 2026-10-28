/**
 * Stackra file contract:
 * Purpose: `translateDbError(error)`, the database error a write raised as the refusal a caller can act on: an
 *          optimistic-lock failure becomes `StaleVersionError` (409), a unique violation `DuplicateRecordError` (409),
 *          a foreign-key, check or not-null violation `ConstraintViolatedError` (400), and a deadlock, serialization
 *          failure, lock-not-available or statement timeout `TransactionConflictError` (503, retryable).
 * Boundary: applied by `DatabaseUnitOfWorkDriver` to whatever leaves an action's transaction, so a caller inside
 *           `handle` still catches the driver's own error (`UniqueViolation`) first; exported for a module's own
 *           transaction outside an action. Reads the SQLSTATE from the driver exception or its cause; anything else, a refusal
 *           included, comes back unchanged, so a bug stays a 500. The original error is the refusal's `cause`, never
 *           its details, so no value of another record leaks.
 * Runtime: node
 * Governing contract: ADR 0133 (decision 6); ADR 0140 (refusal kinds); data-layer gaps mo5 and mo6.
 */
import { OptimisticLockError } from "@mikro-orm/core";

import { ConstraintViolatedError } from "#core/errors/constraint-violated.error";
import { DuplicateRecordError } from "#core/errors/duplicate-record.error";
import { StaleVersionError } from "#core/errors/stale-version.error";
import { TransactionConflictError } from "#core/errors/transaction-conflict.error";

/** The SQLSTATEs a concurrent transaction causes, which a retry may get past. */
const RETRYABLE = new Set(["40001", "40P01", "55P03", "57014"]);

/** The SQLSTATEs of the constraints input breaks. */
const INVALID = new Set(["23503", "23514", "23502"]);

/** A field of `error` or of its cause, as a string. */
function fieldOf(error: unknown, name: string): string | undefined {
  for (
    let current = error, depth = 0;
    current !== null && typeof current === "object" && depth < 3;
    depth += 1
  ) {
    const value = (current as Record<string, unknown>)[name];
    if (typeof value === "string" && value !== "") return value;
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
}

/**
 * The refusal for `error`, or `error` itself.
 *
 * @example
 * try { await em.flush(); } catch (error) { throw translateDbError(error); }
 */
export function translateDbError(error: unknown): unknown {
  if (error instanceof OptimisticLockError) {
    const entity = error.getEntity() as object | undefined;
    return StaleVersionError.create({ model: entity?.constructor.name ?? "" }, { cause: error });
  }
  const state = fieldOf(error, "sqlState") ?? fieldOf(error, "code");
  if (state === undefined) return error;
  if (state === "23505")
    return DuplicateRecordError.create(
      { constraint: fieldOf(error, "constraint") ?? "" },
      { cause: error },
    );
  if (INVALID.has(state))
    return ConstraintViolatedError.create(
      { constraint: fieldOf(error, "constraint") ?? fieldOf(error, "column") ?? "" },
      { cause: error },
    );
  if (RETRYABLE.has(state)) return TransactionConflictError.create({}, { cause: error });
  return error;
}
