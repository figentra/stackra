/**
 * Stackra file contract:
 * Purpose: `RequestConnectionContextDriver`, the `request` `ConnectionContext`: the running call's scope node and the
 *          user it acts for, read from @stackra/actions' `RequestContext`.
 * Boundary: reads the call's authenticated context only, never its input. `user()` is the call's subject
 *           (`actor.onBehalfOf ?? actor`) when that is a user, and undefined for a service, agent, job or system
 *           subject. Outside every action or query call both answers are undefined, so a store finds only what no
 *           owner holds and refuses to connect (`ownerOf`).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 9); ADR 0327 (decisions 5 and 6); ADR 0136 (decision 1); ADR 0098 (the actor).
 */
import type { ExtensionContext, RequestContext } from "@stackra/actions";
import { Driver } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import type { PublicId, ScopeRef } from "@stackra/contracts";

import { ConnectionContext } from "#contracts/ports/connection-context.port";

/**
 * The owners of the running action or query call.
 *
 * @example
 * const context = new RequestConnectionContextDriver(request);
 * const store = new LocalConnectionStoreDriver(context, runtime);
 */
export class RequestConnectionContextDriver extends Driver(ConnectionContext) {
  /** Answers which call is running. */
  private readonly request: RequestContext;

  /** @param request - the running call's context. */
  constructor(request: RequestContext) {
    super();
    this.request = request;
  }

  scope(): ScopeRef | undefined {
    return this.call()?.scope;
  }

  user(): PublicId<"usr"> | undefined {
    const actor = this.call()?.actor;
    if (actor === undefined) return undefined;
    const subject = actor.onBehalfOf ?? actor;
    return subject.kind === ActorKind.User ? subject.id : undefined;
  }

  /** The running call's context, or undefined outside every call. */
  private call(): ExtensionContext | undefined {
    try {
      return this.request.current();
    } catch {
      // `current()` throws only outside every call; here that means "no owner", not a bug.
      return undefined;
    }
  }
}
