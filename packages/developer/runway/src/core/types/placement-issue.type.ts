/**
 * Stackra file contract:
 * Purpose: `PlacementIssue`, one topology placement failure `checkPlacement` reports: the environment, a snake_case
 *          code, the member or group concerned and a message.
 * Boundary: type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 2 and consequences: nothing runs unplaced), ADR 0231 (snake_case codes).
 */
import type { RunwayEnvironment } from "#core/enums/runway-environment.enum";

/** One placement failure. */
export type PlacementIssue = {
  /** The root runway environment whose topology fails. */
  readonly environment: RunwayEnvironment;
  /**
   * `member_unplaced` (grouped, no default group), `member_placed_twice`, `unknown_member` (a group lists a member
   * that does not exist), `unknown_default_group`, `isolate_unknown_member`.
   */
  readonly code:
    | "member_unplaced"
    | "member_placed_twice"
    | "unknown_member"
    | "unknown_default_group"
    | "isolate_unknown_member";
  /** The member or group the failure names. */
  readonly subject: string;
  /** What is wrong, for `stackra validate` to print. */
  readonly message: string;
};
