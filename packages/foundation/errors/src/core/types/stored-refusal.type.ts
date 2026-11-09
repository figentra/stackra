/**
 * Stackra file contract:
 * Purpose: `StoredRefusal`, a refusal as a store keeps it: its envelope without the call's trace and action, plus its
 *          kind, so the refusal can be raised again equal to the first.
 * Boundary: a type only; `storedRefusal(refusal)` builds it and `refusalFromStored(stored)` reverses it. JSON-safe.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (decision 1); STA-2532.
 */
import type { ErrorKind } from "#core/enums/error-kind.enum";
import type { ErrorEnvelope } from "#core/types/error-envelope.type";

/** An envelope with its kind; never a `correlationId` or `action`. */
export type StoredRefusal = Omit<ErrorEnvelope, "correlationId" | "action"> & {
  /** The refusal's kind; the transport status comes from it. */
  readonly kind: ErrorKind;
};
