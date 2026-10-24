/**
 * Stackra file contract:
 * Purpose: `ScopeLevelInvalidError`, the refusal of a node whose level cannot sit under its parent
 *          (`scope_level_invalid`): the level is not the parent's recursive level nor the next declared one, or not
 *          the first level for a root.
 * Boundary: raised by `ScopeNodeService.add`; kind `Validation` (HTTP 400), not retryable. Its details name the level
 *           asked for and the levels the parent takes, both deployment data and never another scope's nodes.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decision 2); ADR 0140 (envelope and kinds); final review R-02 (typed `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: the same level under the same parent is refused again.
 *
 * @example
 * throw ScopeLevelInvalidError.create({ level: "platform", allowed: ["product"] });
 */
export class ScopeLevelInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The level key asked for. */
  level!: string;

  /** The level keys the parent takes (`childLevelsOf`). */
  allowed!: string[];
}
