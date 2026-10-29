/**
 * Stackra file contract:
 * Purpose: `ConsentSnapshotPermissions`, the permissions of the consent snapshot: `consent.consent_snapshot.<verb>`,
 *          each with its risk. `issue` is what `IssueConsentSnapshotAction` (`consent_snapshot.issue`) derives.
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module, the class (minus
 *           `Permissions`) and the static. `issue` is L0: it signs the caller's own decision, reads no stored data and
 *           is open to anonymous visitors on the public area. This `./node` entry is the only one that imports
 *           @stackra/iam, which never imports consent (ADR 0462 decision 1).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0099 (risk); ADR 0462 (decision 1).
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * Referenced as `ConsentSnapshotPermissions.issue`.
 *
 * @example
 * ConsentSnapshotPermissions.issue; // L0, grantable
 */
export class ConsentSnapshotPermissions extends Permissions {
  /** Get a signed snapshot of one's own consent decision; open to every visitor. */
  static readonly issue = Permission.L0;
}
