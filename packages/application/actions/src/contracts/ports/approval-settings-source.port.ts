/**
 * Stackra file contract:
 * Purpose: the `ApprovalSettingsSource` port: the one settings read the approval stage hands an `ApprovalCondition`, behind
 *          the reader limited to the keys the condition declared in its static `reads`.
 * Boundary: an abstract class that is its own token, keyed `actions.ApprovalSettingsSource`. The stage never passes it to
 *           a condition: it builds `limitedSettingsReader(reads, key => source.get(key))` per call, so a condition cannot
 *           read a key it did not declare. The driver (settings, via gen) answers the tenant's current value of a key that
 *           is itself marked `approval`. Read only when a condition asks for a key; a condition with no `reads` never
 *           needs it bound. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (conditions read their threshold from data, N2, S9); STA-1724 FR-002.
 */
import { Port } from "@stackra/contracts";

/**
 * Reads a setting for an approval condition.
 *
 * @example
 * export class SettingsApprovalSettingsSourceDriver extends Driver(ApprovalSettingsSource) {
 *   get(key: string): Promise<unknown> {
 *     return this.settings.read(key);
 *   }
 * }
 */
export abstract class ApprovalSettingsSource extends Port {
  /** Type-only port key, so `DriverName<ApprovalSettingsSource>` narrows to this port's drivers. */
  declare readonly "~key": "actions.ApprovalSettingsSource";

  /** The current value of the setting `key`. */
  abstract get(key: string): Promise<unknown>;
}
