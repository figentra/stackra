/**
 * Stackra file contract:
 * Purpose: `SettingRevisionClosedError`, the refusal to approve or reject a revision that is not open for it
 *          (`setting_revision_closed`): already applied, already rejected, or (for an approval) not pending.
 * Boundary: raised by `SettingsResolver` before the revision moves; kind `Conflict` (HTTP 409), not retryable. Its
 *           details are the revision and its current status.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 5); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

import type { SettingRevisionStatus } from "#contracts/index";

/**
 * Not retryable: the revision has moved on.
 *
 * @example
 * throw SettingRevisionClosedError.create({ revision: id, status: revision.status });
 */
export class SettingRevisionClosedError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: false,
}) {
  /** The id of the closed revision. */
  revision!: string;

  /** Its status when the move was refused. */
  status!: SettingRevisionStatus;
}
