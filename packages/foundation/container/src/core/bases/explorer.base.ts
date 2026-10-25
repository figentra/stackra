/**
 * Stackra file contract:
 * Purpose: `Explorer`, the bare kind base of a package's `<pkg>.explorer.ts`: the runtime half of a decorator the
 *          package ships, which finds the decorated instances through `DiscoveryService` once every binding is built.
 * Boundary: a binding; the container calls `onApplicationBootstrap()` once per container, after it has built every
 *           binding it builds eagerly, never at import time. Only a package that ships decorators has one.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15: `<entry>/<pkg>.explorer.ts`); ADR 0144 (Explorers) as amended by 0263.
 */
import { registerKind } from "#core/functions/register-kind.function";

/**
 * The explorer kind base.
 *
 * @example
 * export class AccessLogExplorer extends Explorer {
 *   onApplicationBootstrap(): void {
 *     for (const { instance, options } of this.discovery.classesWith(AccessLogged)) wrap(instance, options);
 *   }
 * }
 */
export abstract class Explorer {
  /** Type-only kind brand, so a class of another kind cannot stand in for an explorer. */
  declare readonly "~kind": "explorer";

  /** Runs once, after the container has built its bindings; the container awaits a returned promise. */
  abstract onApplicationBootstrap(): void | Promise<void>;
}

registerKind(Explorer, "explorer");
