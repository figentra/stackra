/**
 * Stackra file contract:
 * Purpose: `AuditExpectation`, what `expect(result).toHaveAudited({...})` checks on a call's audit entry: the outcome,
 *          the refusal code and the fields the handler added with `ctx.audit`.
 * Boundary: a type only; every part is optional, and `fields` is a subset match (each named field equals, others are
 *           ignored).
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); STA-820.
 */
import type { Json } from "@stackra/contracts";

/** The parts of an audit entry a test asserts. */
export interface AuditExpectation {
  /** `ok`, or `refused`. */
  readonly outcome?: "ok" | "refused";

  /** The refusal code of a refused call. */
  readonly code?: string;

  /** Fields the entry must carry with these values (deep equality). */
  readonly fields?: Readonly<Record<string, Json>>;
}
