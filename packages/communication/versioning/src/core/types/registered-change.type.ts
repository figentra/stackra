/**
 * Stackra file contract:
 * Purpose: `RegisteredChange`, one change as the registry keeps it: the class and the two options read from the kind
 *          registry once, at registration.
 * Boundary: a type only; internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (2026-10-23 note).
 */
import type { ChangeClass } from "#core/types/change-class.type";
import type { ChangeOptions } from "#core/types/change-options.type";

/** A registered change. */
export interface RegisteredChange extends ChangeOptions {
  /** The change class. */
  readonly type: ChangeClass;
}
