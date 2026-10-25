/**
 * Stackra file contract:
 * Purpose: `SettingTarget`, where settings are read or written: a scope node, a user, both, or neither (the scope of
 *          the running scope session on the server).
 * Boundary: a type only. The node is a `ScopeRef` from the authenticated context, never request input; the user is a
 *           principal's public id. Reading with a user adds that user's layer below the node's chain; writing with a
 *           user writes that user's own layer.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decisions 3 and 5: `ScopeRef`); ADR 0323 (decision 2); ADR 0213 (decision 2).
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";

/**
 * The holder of a read or a write.
 *
 * @example
 * await settings.get(MessagesSettings, { user: event.customerId });
 */
export interface SettingTarget {
  /** The scope node; the running scope session's node when left out. */
  readonly scope?: ScopeRef;

  /** The user whose own values apply last. */
  readonly user?: PublicId<"usr">;
}
