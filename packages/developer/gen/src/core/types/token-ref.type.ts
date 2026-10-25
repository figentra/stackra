/**
 * Stackra file contract:
 * Purpose: `TokenRef`, one constructor dependency gen read from a parameter's declared type: a class, a named
 *          instance of a port (`Named<Port, "primary">`), or a per-model token (`Repository<Order>` is
 *          `repositoryOf(Order)`, `Journal<LedgerEntry>` is `journalOf(LedgerEntry)`).
 * Boundary: a type only. The wiring prints it as the class, as `named(Port, "x")` or as `repositoryOf(Model)`; no
 *           reflection is involved (ADR 0227 2026-10-24 note).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 17: classes are the only tokens); ADR 0263; ADR 0097 (`repositoryOf`).
 */
import type { ClassRef } from "#core/types/class-ref.type";

/** One constructor token. */
export interface TokenRef {
  /** The class, which is the token. */
  readonly class: ClassRef;

  /** The instance name of `Named<Port, "x">`. */
  readonly named?: string;

  /** The token factory of a per-model token (`repositoryOf`, `journalOf`); `class` is then the model. */
  readonly of?: ClassRef;
}
