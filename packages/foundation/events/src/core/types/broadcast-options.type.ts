/**
 * Stackra file contract:
 * Purpose: `BroadcastOptions`, the `broadcast` option of an integration event: the permission a session needs to
 *          receive the data-free refresh, and who receives it.
 * Boundary: a type only. The permission is a declared permission (`OrderPermissions.read` from `@stackra/iam`), which
 *           this package cannot import, so it is typed as the reference itself; gen resolves it to
 *           `<module>.<model>.<verb>` and `@stackra/realtime` enforces it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (amendment item 7); ADR 0225 (2026-10-23 note); ADR 0141 (2026-10-23 note).
 */
import type { BroadcastAudience } from "#core/enums/broadcast-audience.enum";

/** What a broadcast needs. */
export interface BroadcastOptions {
  /** The permission a session must hold to receive the refresh (`StockPermissions.read`). */
  readonly permission: object | string;

  /** Who receives it; `BroadcastAudience.Principal` when absent. */
  readonly audience?: BroadcastAudience;
}
