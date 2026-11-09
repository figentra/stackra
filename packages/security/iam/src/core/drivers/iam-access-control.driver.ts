/**
 * Stackra file contract:
 * Purpose: `IamAccessControlDriver`, the driver of the action pipeline's `AccessControl` port: `require` is the
 *          permission step (the decision point on the call's permission where the call acts) and `authorize` is
 *          `ctx.authorize(record)` (the record's policy method named after the permission's verb, then the
 *          decision point again with the record, so a conditional deny is tested).
 * Boundary: refuses with `ForbiddenError` only, carrying no reason (the explanation is for the audit, never for the
 *           caller). A call with no permission was never registered (`registerActions`) and is refused; an anonymous
 *           caller of a class whose `actors` list `ActorKind.Anonymous` skips the permission check only: the record's
 *           policy still runs, so a policy that keys a record to its visitor (a cart's `ownerId`) refuses another
 *           visitor holding its id, and every other step of its call still runs (STA-2025, as amended 2026-11-09). Fails closed: an unknown scope node, a
 *           record whose policy cannot be resolved (`connectPolicies` not called) or a policy that answers something
 *           other than a `Decision` is an error, never an allowed call. Any deny wins; `Allow` and `Abstain` leave the
 *           permission as the answer. The node is the call's `scope`; only a call without one reads the caller's node
 *           from `ScopeTree`.
 * Runtime: isomorphic
 * Governing contract: ADR 0138 (as amended: permission is the second step, the record policy runs inside `handle`);
 *                     ADR 0132 (as amended by 0294 and 0263); ADR 0208 (decision 3); ADR 0327 (decision 7).
 */
import { AccessControl, type CallDescriptor } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import { actingScopeId, type PublicId, type ScopeRef } from "@stackra/contracts";
import { ForbiddenError } from "@stackra/errors";
import type { RuleFacts } from "@stackra/rules";
import type { ScopeTree } from "@stackra/scope/contracts";

import { Decision } from "#core/enums/decision.enum";
import { decidePolicy } from "#core/functions/decide-policy.function";
import { isAnonymousCall } from "#core/functions/is-anonymous-call.function";
import { policyRowOf } from "#core/functions/policy-row-of.function";
import type { PolicyDecisionPointService } from "#core/services/policy-decision-point.service";

/**
 * Enforces permissions and record rules for the pipeline.
 *
 * @example
 * await driver.require(call); // throws ForbiddenError when no grant holds call.permission
 * await driver.authorize(call, order); // throws ForbiddenError when OrderPolicy.cancel denies
 */
export class IamAccessControlDriver extends Driver(AccessControl) {
  /** Decides. */
  private readonly pdp: PolicyDecisionPointService;

  /** Turns the caller's scope id into its node when the call carries no `scope`. */
  private readonly tree: ScopeTree;

  /**
   * @param pdp - the decision point.
   * @param tree - the scope tree, for the caller's node when the call carries no `scope`.
   */
  constructor(pdp: PolicyDecisionPointService, tree: ScopeTree) {
    super();
    this.pdp = pdp;
    this.tree = tree;
  }

  /**
   * Resolves when the caller holds the call's permission where the call acts.
   *
   * @throws ForbiddenError when it does not, or when the call's scope node does not exist.
   */
  async require(call: CallDescriptor): Promise<void> {
    if (call.permission === undefined) throw ForbiddenError.create();
    if (isAnonymousCall(call)) return;
    const scope = await this.scopeOf(call);
    if (!(await this.pdp.check(call.actor, call.permission, scope === undefined ? {} : { scope })))
      throw ForbiddenError.create();
  }

  /**
   * Resolves when the record's policy does not deny the call and no deny rule matches the record. An anonymous call
   * of a class that lists anonymous callers is checked by the policy alone.
   *
   * @throws ForbiddenError when the policy denies, a deny rule matches, or the call's scope node does not exist.
   * @throws Error when the record's policy is registered but not connected.
   */
  async authorize(call: CallDescriptor, record: object): Promise<void> {
    const { permission } = call;
    if (permission === undefined) throw ForbiddenError.create();
    const row = policyRowOf(record);
    if (
      row !== undefined &&
      (await decidePolicy(row, permission, call.actor, record)) === Decision.Deny
    )
      throw ForbiddenError.create();
    // A visitor holds no grant, so only the permission check is skipped; the policy above has already run.
    if (isAnonymousCall(call)) return;
    const scope = await this.scopeOf(call);
    const facts =
      row?.rules === undefined
        ? null
        : { rules: row.rules, facts: { record: record as RuleFacts[string] } };
    const options = scope === undefined ? { record: facts } : { scope, record: facts };
    if (!(await this.pdp.check(call.actor, permission, options))) throw ForbiddenError.create();
  }

  /**
   * The node the call acts in: the call's `scope`, else the node of the id the caller's credential carries, read from
   * the tree; `undefined` for a call at the root.
   */
  private async scopeOf(call: CallDescriptor): Promise<ScopeRef | undefined> {
    if (call.scope !== undefined) return call.scope;
    const id = actingScopeId(call.actor);
    if (id === undefined) return undefined;
    const node = await this.tree.node(id as PublicId<"scp">);
    if (node === undefined) throw ForbiddenError.create();
    return { id: node.id, path: node.path };
  }
}
