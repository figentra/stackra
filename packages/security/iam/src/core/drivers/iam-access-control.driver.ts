/**
 * Stackra file contract:
 * Purpose: `IamAccessControlDriver`, the driver of the action pipeline's `AccessControl` port: `require` is the
 *          permission step (the decision point on the call's permission where the call acts) and `authorize` is
 *          `ctx.authorize(record)` (the record's policy method named after the permission's verb, then the
 *          decision point again with the record, so a conditional deny is tested).
 * Boundary: refuses with `ForbiddenError` only, carrying no reason (the explanation is for the audit, never for the
 *           caller). A call with no permission (an `auth: false` query) passes. Fails closed: an unknown scope node, a
 *           record whose policy cannot be resolved (`connectPolicies` not called) or a policy that answers something
 *           other than a `Decision` is an error, never an allowed call. Any deny wins; `Allow` and `Abstain` leave the
 *           permission as the answer. The node is the call's `scope`; only a call without one reads the caller's node
 *           from `ScopeTree`.
 * Runtime: isomorphic
 * Governing contract: ADR 0138 (as amended: permission is the second step, the record policy runs inside `handle`);
 *                     ADR 0132 (as amended by 0294 and 0263); ADR 0208 (decision 3); ADR 0327 (decision 7).
 */
import { AccessControl, type CallDescriptor } from "@stackra/actions/contracts";
import { type AnyClass, Driver } from "@stackra/container";
import { type Actor, Enum, type PublicId, type ScopeRef } from "@stackra/contracts";
import { ForbiddenError } from "@stackra/errors";
import type { Facts } from "@stackra/rules";
import { ScopeTree } from "@stackra/scope/contracts";

import { POLICY_REGISTRY } from "#core/constants/policy-registry.constant";
import { Decision } from "#core/enums/decision.enum";
import { PolicyDecisionPointService } from "#core/services/policy-decision-point.service";
import type { PolicyRegistration } from "#core/types/policy-registration.type";

/** The three answers a policy method may give. */
const DECISIONS: ReadonlySet<unknown> = new Set(Enum.values(Decision));

/** The policy row of `record`'s model, walking up its class chain so a subclass model finds its base's policy. */
function rowOf(record: object): PolicyRegistration | undefined {
  for (
    let type: unknown = record.constructor;
    typeof type === "function" && type !== Function.prototype;
    type = Object.getPrototypeOf(type)
  ) {
    const row = POLICY_REGISTRY.rows.get(type as AnyClass);
    if (row !== undefined) return row;
  }
  return undefined;
}

/** The answer of the policy method named after the verb of `permission`; `Abstain` when the policy has none. */
async function decide(
  row: PolicyRegistration,
  permission: string,
  actor: Actor,
  record: object,
): Promise<Decision> {
  const { resolver } = POLICY_REGISTRY;
  if (resolver === undefined)
    throw new Error(
      `${row.policy.name} cannot run: call connectPolicies(container) once the container is booted`,
    );
  const policy = resolver.get(row.policy);
  const method: unknown = Reflect.get(policy, permission.slice(permission.lastIndexOf(".") + 1));
  if (typeof method !== "function") return Decision.Abstain;
  const decision: unknown = await (method as (...args: unknown[]) => unknown).call(
    policy,
    actor,
    record,
  );
  if (!DECISIONS.has(decision))
    throw new TypeError(`${row.policy.name} answered ${String(decision)}, not a Decision`);
  return decision as Decision;
}

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
    if (call.permission === undefined) return;
    const scope = await this.scopeOf(call);
    if (!(await this.pdp.check(call.actor, call.permission, scope === undefined ? {} : { scope })))
      throw ForbiddenError.create();
  }

  /**
   * Resolves when the record's policy does not deny the call and no deny rule matches the record.
   *
   * @throws ForbiddenError when the policy denies, a deny rule matches, or the call's scope node does not exist.
   * @throws Error when the record's policy is registered but not connected.
   */
  async authorize(call: CallDescriptor, record: object): Promise<void> {
    const { permission } = call;
    if (permission === undefined) return;
    const row = rowOf(record);
    if (row !== undefined && (await decide(row, permission, call.actor, record)) === Decision.Deny)
      throw ForbiddenError.create();
    const scope = await this.scopeOf(call);
    const facts =
      row?.rules === undefined
        ? null
        : { rules: row.rules, facts: { record: record as Facts[string] } };
    const options = scope === undefined ? { record: facts } : { scope, record: facts };
    if (!(await this.pdp.check(call.actor, permission, options))) throw ForbiddenError.create();
  }

  /**
   * The node the call acts in: the call's `scope`, else the node of the id the caller's credential carries, read from
   * the tree; `undefined` for a call at the root.
   */
  private async scopeOf(call: CallDescriptor): Promise<ScopeRef | undefined> {
    if (call.scope !== undefined) return call.scope;
    const id = call.actor.scopeId;
    if (id === undefined) return undefined;
    const node = await this.tree.node(id as PublicId<"scp">);
    if (node === undefined) throw ForbiddenError.create();
    return { id: node.id, path: node.path };
  }
}
