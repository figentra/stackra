/**
 * Stackra file contract:
 * Purpose: `DetachedCall`, what `ctx.detach()` returns: the call's isolation, carried past its transaction so a long
 *          stream or agent loop runs each step as one short transaction with the call's tenant and scope, and holds no
 *          connection between steps.
 * Boundary: a type only; the pipeline builds it from the call's descriptor once the isolation settled it (a branch
 *           caller's descriptor names the tenant), never from input. It is frozen and has no setter: a step runs as the
 *           call's actor and scope or not at all. Every step goes back through the bound `CallIsolation`, so its
 *           checks run again; with none bound a step runs as it is, as the call did.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decisions 1 and 2); ADR 0239 (decision 1); ADR 0136 (decision 1).
 */
import type { Actor, ScopeRef } from "@stackra/contracts";

/** A call's isolation, held past its transaction. */
export interface DetachedCall {
  /** The verified actor the call ran as. */
  readonly actor: Actor;

  /** The scope node the call acted in; absent for a platform call. */
  readonly scope?: ScopeRef;

  /**
   * Runs `work` as part of the call: `RequestContext.current()` answers the call's context inside it and
   * `RequestContext.detached()` this object, across every `await`. It opens no transaction; values other stores hold
   * around the caller (a held token) stay readable.
   */
  run: <T>(work: () => Promise<T>) => Promise<T>;

  /**
   * Runs `work` as one step: a new transaction through the bound `CallIsolation`, with the call's actor and scope,
   * which commits when `work` resolves and rolls back when it throws. Writes inside it (an outbox event included)
   * commit with the step. Inside a running step it joins that step's transaction.
   *
   * @throws whatever the isolation refuses (an unknown scope, another tenant's running transaction).
   */
  isolated: <T>(work: () => Promise<T>) => Promise<T>;
}
