/**
 * Stackra file contract:
 * Purpose: the `CommandActor` port: who a console command runs an action as, the signed-in CLI identity.
 * Boundary: an abstract class that is its own token, keyed `actions.CommandActor`. The CLI never runs as a privileged
 *           operator by default: with no driver bound, or `current()` resolving `undefined`, the run is refused and the
 *           action never starts. A leaf file.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-022; ADR 0506 (amendment of 2026-11-02, point 7).
 */
import { Port } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";

/**
 * Reads the CLI's signed-in identity.
 *
 * @example
 * export class StoredSessionCommandActorDriver extends Driver(CommandActor) {
 *   async current(): Promise<Actor | undefined> {
 *     return (await this.session.read())?.actor;
 *   }
 * }
 */
export abstract class CommandActor extends Port {
  /** Type-only port key, so `DriverName<CommandActor>` narrows to this port's drivers. */
  declare readonly "~key": "actions.CommandActor";

  /** The signed-in actor, or `undefined` when nobody is signed in. */
  abstract current(): Promise<Actor | undefined>;
}
