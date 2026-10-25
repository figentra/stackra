/**
 * Stackra file contract:
 * Purpose: `EvaluationStep`, the explanation of one node of an evaluated condition: its path in the tree, whether it
 *          matched, and for a leaf the field, the operator and why a leaf failed when the value alone does not say.
 * Boundary: a type only. A path joins the keys from the root with dots, list indexes as numbers (`all.0.not`), the
 *           form of a refusal's field errors; the root's path is `""`. It never carries a fact's value, so an
 *           explanation may be logged or shown without leaking the facts.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decision 7); ADR 0140 (field error paths).
 */
import type { Operator } from "#contracts/index";

/** One explained node. */
export interface EvaluationStep {
  /** The node's path from the root (`""`, `all.0`, `all.1.not`). */
  readonly path: string;

  /** Whether the node held. */
  readonly matched: boolean;

  /** A leaf's field path (`cart.total`). */
  readonly field?: string;

  /** A leaf's operator. */
  readonly operator?: Operator;

  /** Why a leaf failed although its operator could not test the value: the fact was missing, or in another currency. */
  readonly reason?: "missing" | "currency_mismatch";
}
