/**
 * Stackra file contract:
 * Purpose: `SubjectHolds`, the port that answers whether a live legal hold names a data subject's public id, so a
 *          caller that is about to erase a whole person (identity's account deletion after its grace period) defers
 *          instead of starting `EraseSubjectWorkflow` while a matter holds the subject.
 * Boundary: an abstract class that is its own token, key `privacy.SubjectHolds`; a question only, it places, releases
 *           and logs nothing. A hold on one record does not count: the erasure saga already keeps held rows. The
 *           answer covers the session's scope, the one `EraseSubjectWorkflow` erases in when the same job starts it; a
 *           caller reaches each tenant by running per scope, never by a cross-tenant read. Drivers: `postgres`
 *           (`PostgresSubjectHoldsDriver`, over `privacy.legal_holds`). A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0134 (2026-10-24 amendment: holds); ADR 0189 (decision 4); ADR 0263 (ports and drivers);
 *                     STA-1567.
 */
import { Port } from "@stackra/contracts";

/**
 * Tells whether a subject is under a legal hold.
 *
 * @example
 * if (await holds.isHeld(deletion.subject)) continue; // defer, ask again on the next run
 */
export abstract class SubjectHolds extends Port {
  /** Type-only port key, so `DriverName<SubjectHolds>` narrows to this port's drivers. */
  declare readonly "~key": "privacy.SubjectHolds";

  /** True while a live (unreleased) hold names `subject`, the subject's public id, in the session's scope. */
  abstract isHeld(subject: string): Promise<boolean>;
}
