/**
 * Stackra file contract:
 * Purpose: the `ApprovalSettingsSource` port: the one settings read the approval stage of `@stackra/actions` hands an
 *          `ApprovalCondition`, behind the reader limited to the keys the condition declared in its static `reads`.
 * Boundary: an abstract class that is its own token. The stage never passes it to a condition: it builds a reader limited
 *           to the condition's `reads` per call, so a condition cannot read a key it did not declare. `@stackra/settings`
 *           ships the driver (`SettingsApprovalSourceDriver`), which answers the current scope's value of a key that is
 *           itself marked `approval`. The port lives here because actions and settings both depend on this package and
 *           neither may depend on the other. A condition that declares `reads` with none bound is refused
 *           `approval_settings_unavailable`; a condition with no `reads` needs nothing bound.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (conditions read their threshold from data, N2, S9); STA-1724 FR-002.
 */
import { Port } from "#core/bases/port.base";

/**
 * Reads a setting for an approval condition.
 *
 * @example
 * export class SettingsApprovalSourceDriver extends Driver(ApprovalSettingsSource) {
 *   get(key: string): Promise<unknown> {
 *     return this.resolveKey(key);
 *   }
 * }
 */
export abstract class ApprovalSettingsSource extends Port {
  /** The current value of the setting `key` (`<module>.<name>`), in the running call's scope. */
  abstract get(key: string): Promise<unknown>;
}
