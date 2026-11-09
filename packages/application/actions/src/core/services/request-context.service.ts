/**
 * Stackra file contract:
 * Purpose: `RequestContext`, the platform service that answers "which call am I in?" anywhere below an action or
 *          query: a service, a listener run in process, an Explorer's wrapper or an extension slot owner that was not
 *          handed the context; and, inside a stream or a long loop, the detached call it runs in (`detached()`).
 * Boundary: a platform binding with one dependency, the `ContextStorage` port the pipeline runs each call in. It reads
 *           and never writes; code that has a `ctx` passes it instead. Outside every call `current()` throws, so a
 *           missing context is a bug, never an anonymous actor.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 1: the handler context); ADR 0294 (decision 17: classes are the tokens).
 */
import { Service } from "@stackra/container";

import type { ContextStorage } from "#contracts/ports/context-storage.port";
import { DETACHED_CALLS } from "#core/constants/detached-calls.constant";
import type { DetachedCall } from "#core/types/detached-call.type";
import type { ExtensionContext } from "#core/types/extension-context.type";

/**
 * The running call's context.
 *
 * @example
 * export class AccountService extends CrudService<LoyaltyAccount> {
 *   async earn(member: MemberId, request: EarnRequest): Promise<number> {
 *     return this.extensions.earnAdjust(base, draft, this.request.current());
 *   }
 * }
 */
export class RequestContext extends Service {
  /** Where the pipeline keeps the running call's context. */
  private readonly storage: ContextStorage;

  /**
   * @param storage - the storage the pipeline runs each call in.
   */
  constructor(storage: ContextStorage) {
    super();
    this.storage = storage;
  }

  /**
   * The context of the call the caller runs inside.
   * @throws Error outside every action or query call.
   */
  current(): ExtensionContext {
    const context = this.storage.current();
    if (context === undefined)
      throw new Error(
        "RequestContext.current() was read outside an action or query call: pass the call's ctx instead",
      );
    return context as ExtensionContext;
  }

  /**
   * The detached call the caller runs inside (`DetachedCall.run`), so a service reached from a stream or a long loop
   * opens its step through it; `undefined` inside the call's own transaction and outside every call.
   *
   * @example
   * const detached = this.request.detached();
   * return detached === undefined ? this.save(row) : detached.isolated(() => this.save(row));
   */
  detached(): DetachedCall | undefined {
    const context = this.storage.current();
    return context === undefined ? undefined : DETACHED_CALLS.get(context);
  }
}
