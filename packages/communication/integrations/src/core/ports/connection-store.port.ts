/**
 * Stackra file contract:
 * Purpose: the `ConnectionStore` port: where connections live, and the one way to load, add and remove them. A
 *          driver injects it (`connections.find(ResendConnection)`); the console's connect and disconnect actions and
 *          the webhook router use the rest.
 * Boundary: an abstract class that is its own token, with two drivers: `local` (in process, for the template and
 *           development) and `hosted` (the integrations service holds the credentials, encrypted, and refreshes
 *           the tokens). A loaded connection carries its fields and its managed client; its secret fields are never
 *           enumerable. `byId` does not authorize: the caller (a policy, the webhook router) has.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 2, 9, 10, 12, 14, 17 and 18).
 */
import { Port } from "@stackra/contracts";

import type { Connection } from "#core/bases/connection.base";
import type { ConnectInput } from "#core/types/connect-input.type";
import type { ConnectionClass } from "#core/types/connection-class.type";

/**
 * Loads and keeps connections.
 *
 * @example
 * const own = await this.connections.find(ResendConnection);
 * const api = own?.api ?? this.resend.api;
 */
export abstract class ConnectionStore extends Port {
  /**
   * The connection of `type` for the running call: the Integration's levels in order, the user's own for `User`,
   * the call's scope node or its nearest ancestor holding one for `Scope`.
   *
   * @returns null when no level holds one.
   * @throws ConnectionAmbiguousError when the first level holding one holds several (`multiple: true`).
   */
  abstract find<C extends Connection>(type: ConnectionClass<C>): Promise<C | null>;

  /**
   * The connection `id` of `type`.
   *
   * @throws NotFoundError when there is none (or it was disconnected).
   */
  abstract byId<C extends Connection>(type: ConnectionClass<C>, id: string): Promise<C>;

  /** Every connection of `type` the running call reaches, in lookup order. */
  abstract list<C extends Connection>(type: ConnectionClass<C>): Promise<C[]>;

  /**
   * Adds a connection owned by the running call at `input.level`: runs `check()` (nothing is stored if it throws),
   * subscribes its webhook URL when given, stores it, and, unless the Integration allows `multiple`, disconnects the
   * one it replaces.
   */
  abstract connect<C extends Connection>(
    type: ConnectionClass<C>,
    input: ConnectInput<C>,
  ): Promise<C>;

  /**
   * Removes connection `id`: unsubscribes its webhooks, revokes its tokens at the provider and destroys its
   * credentials.
   *
   * @throws NotFoundError when there is none.
   */
  abstract disconnect(type: ConnectionClass, id: string): Promise<void>;
}
