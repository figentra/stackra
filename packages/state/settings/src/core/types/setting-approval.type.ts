/**
 * Stackra file contract:
 * Purpose: `SettingApproval`, a setting's role-gated approval: a change waits until someone holding the role `by`
 *          approves it (`{ by: SystemRole.Owner }` for a Platform switch only the owner may turn on).
 * Boundary: a type only. `true` on `SettingOptions.approval` stays four-eyes (a second holder of
 *           `<module>.settings.approve`); this form names the role instead, which the resolver checks against the
 *           approver's roles the calling action passes, and records on the revision.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 5: approval); ADR 0359 (decisions 4 and 9).
 */

/** Who must approve a change. */
export interface SettingApproval {
  /** The role code the approver must hold (`SystemRole.Owner`). */
  readonly by: string;
}
