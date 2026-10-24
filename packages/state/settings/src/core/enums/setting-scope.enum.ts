/**
 * Stackra file contract:
 * Purpose: `SettingScope`, the cascade levels settings itself names: the platform, a product, a node of the scope tree
 *          below the levels a deployment declares, and the user.
 * Boundary: an `Enum.of` value plus the type of the same name. A level another package owns is not here: tenancy
 *           contributes its level as data (ADR 0323 d4), so a `scopes` list takes any `SettingLevel`. The cascade order
 *           is the scope tree's path (root first), then the user (ADR 0213 d2). There is no Market scope (ADR 0307 r22).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 22); ADR 0213 (decision 2); ADR 0323 (decision 4); ADR 0327 (decision 2).
 */
import { Enum } from "@stackra/contracts";

/**
 * The levels settings names.
 *
 * @example
 * export class MessagesSettings extends Settings({ scopes: [SettingScope.User] }) {}
 */
export const SettingScope = Enum.of({
  /** The whole deployment: the defaults every holder below inherits. */
  Platform: "platform",
  /** One product of the deployment. */
  Product: "product",
  /** A node of the scope tree below the declared levels (a store, a branch). */
  Node: "node",
  /** One person: their own values apply last. */
  User: "user",
});

/** One of the codes above. */
export type SettingScope = Enum.Value<typeof SettingScope>;
