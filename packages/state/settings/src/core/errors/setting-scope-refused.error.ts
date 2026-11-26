/**
 * Stackra file contract:
 * Purpose: `SettingScopeRefusedError`, the refusal of a write of a setting at a level its `scopes` leave out
 *          (`setting_scope_refused`): a tenant page writing a key that `@Setting({ scopes: [Platform] })` keeps to the
 *          platform.
 * Boundary: a refusal (`forbidden`), raised by `SettingsResolver#write` before anything is written; code derived from
 *           the class name. Its details are the level and the refused paths, relative to the group, and each path's
 *           field error is `setting_scope_refused`. It never names a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 22: a key's scopes); ADR 0213 (decision 2); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable at the same level.
 *
 * @example
 * throw SettingScopeRefusedError.create({ level: "tenant", paths: ["refundCeilingMinor"] });
 */
export class SettingScopeRefusedError extends Refusal({
  kind: ErrorKind.Forbidden,
  retryable: false,
}) {
  /** The level the write was made at. */
  level!: string;

  /** The refused paths, relative to the group. */
  paths!: string[];
}
