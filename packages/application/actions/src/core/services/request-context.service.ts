/**
 * Stackra file contract:
 * Purpose: `RequestContext`, the platform service that answers "which call am I in?" anywhere below an action or
 *          query: a service, a listener run in process, an Explorer's wrapper or an extension slot owner that was not
 *          handed the context.
 * Boundary: a platform binding with one dependency, the `ContextStorage` port the pipeline runs each call in. It reads
 *           and never writes; code that has a `ctx` passes it instead. Outside every call `current()` throws, so a
 *           missing context is a bug, never an anonymous actor.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 1: the handler context); ADR 0294 (decision 17: classes are the tokens).
 */
import { Service } from "@stackra/container";

import type { ContextStorage } from "#contracts/ports/context-storage.port";
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
}
