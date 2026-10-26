/**
 * Stackra file contract:
 * Purpose: the `PublisherAccess` port: which action blocks of an automation its publisher may not call in a scope. An
 *          automation's grants are never more than its publisher's own, so `AutomationService` refuses a publish and
 *          pauses a published automation when this port names a block (ADR 0153 decision 2).
 * Boundary: an abstract class that is its own token, keyed `workflow.PublisherAccess`. @stackra/iam binds the managed
 *           driver over its policy decision point; a host may bind its own. `MemoryPublisherAccessDriver` is the
 *           fail-closed driver for tests and single-process tools. It answers for the publisher, never the principal:
 *           the principal's own permissions are checked on every step by the action pipeline.
 * Runtime: isomorphic
 * Governing contract: ADR 0153 (decision 2); ADR 0423 (decisions 1 and 2); ADR 0142 (drivers behind ports).
 */
import { Port } from "@stackra/contracts";
import type { Actor, ScopeRef } from "@stackra/contracts";

/**
 * What a publisher may call.
 *
 * @example
 * export class IamPublisherAccessDriver extends Driver(PublisherAccess) {
 *   async missing(publisher, scope, blocks) { ... }
 * }
 */
export abstract class PublisherAccess extends Port {
  /** Type-only port key, so `DriverName<PublisherAccess>` narrows to this port's drivers. */
  declare readonly "~key": "workflow.PublisherAccess";

  /**
   * The keys of `blocks` (action building blocks) that `publisher` may not call in `scope`, in the order given; empty
   * when it may call every one.
   */
  abstract missing(
    publisher: Actor,
    scope: ScopeRef,
    blocks: readonly string[],
  ): Promise<readonly string[]>;
}
