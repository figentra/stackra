/**
 * Stackra file contract:
 * Purpose: `PolicyDecisionPointService`, the embedded policy decision point: `check` and `explain` (may this actor use
 *          this permission where the call acts), `visibility` (may it see, list or use this record) and `canDelegate`
 *          (may it hand this grant on), each evaluated in process over the principal's policy snapshot.
 * Boundary: reads only `PolicySource` and `Clock`; no network hop of its own and no writes. Rules, in order: a system or
 *           job actor is the platform; a system permission is held by the platform only (a service acting for no one
 *           counts), never through a role; a grant applies at its node and below and until it expires, and a call with
 *           no scope acts at the root; a wildcard counts only in a system role (a `SystemRole` code or a module role);
 *           an explicit deny beats every grant, and a deny with a condition is tested only against a record. Every
 *           link of the actor chain must hold the permission (a service and the user it acts for). Conditions are
 *           `@stackra/rules` trees evaluated by that package's `evaluate`, with the time as a fact (ADR 0331 decisions
 *           1, 6 and 11): IAM reuses the operator set and the evaluator, and keeps its own path from the snapshot.
 *           Visibility answers `Abstain` for a record no rule matches: no default is decided (ADR 0333 decision 7).
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decisions 1 to 4, and the 0327 and 0333 notes); ADR 0132 (decision 5); ADR 0333
 *                     (decisions 2, 3 and 7); ADR 0099 (as amended by 0294); ADR 0098 (the actor chain).
 */
import { Service } from "@stackra/container";
import { type Actor, ActorKind, Clock, Enum, type ScopeRef } from "@stackra/contracts";
import { type Condition, evaluate } from "@stackra/rules";
import { isWithinScope } from "@stackra/scope";

import { PolicySource } from "#contracts/index";
import type { Audience, Capability, Grant, PolicySnapshot } from "#contracts/index";
import { PERMISSION_REGISTRY } from "#core/constants/permission-registry.constant";
import { ROLE_REGISTRY } from "#core/constants/role-registry.constant";
import { AccessReason } from "#core/enums/access-reason.enum";
import { Decision } from "#core/enums/decision.enum";
import { SystemRole } from "#core/enums/system-role.enum";
import { coversPermission } from "#core/functions/covers-permission.function";
import { permissionKey } from "#core/functions/permission-key.function";
import type { AccessExplanation } from "#core/types/access-explanation.type";
import type { CheckOptions } from "#core/types/check-options.type";
import type { RecordFacts } from "#core/types/record-facts.type";
import type { Permission } from "#core/values/permission.value";

/** The built-in role codes, which may hold a wildcard. */
const SYSTEM_ROLES: ReadonlySet<string> = new Set(Enum.values(SystemRole));

/** Whether `actor` is the platform itself. */
const isPlatform = (actor: Actor): boolean =>
  actor.kind === ActorKind.System || actor.kind === ActorKind.Job;

/** The originating principal: the last link of the actor chain. */
function subjectOf(actor: Actor): Actor {
  let subject = actor;
  while (subject.onBehalfOf !== undefined) subject = subject.onBehalfOf;
  return subject;
}

/** Whether `grant` counts where the call acts at `at`: unexpired, and held at or above the call's node. */
function applies(grant: Grant, scope: ScopeRef | undefined, at: Date): boolean {
  if (grant.expiresAt !== undefined && grant.expiresAt.getTime() <= at.getTime()) return false;
  return scope === undefined
    ? !grant.scope.path.includes(".")
    : isWithinScope(scope.path, grant.scope.path);
}

/** Whether `role` holds `key`; a wildcard entry counts only when the role is a system role. */
function roleHolds(role: string, snapshot: PolicySnapshot, key: string): boolean {
  const registered = ROLE_REGISTRY.get(role);
  const custom = Object.hasOwn(snapshot.roles, role) ? snapshot.roles[role] : undefined;
  const system = registered !== undefined || SYSTEM_ROLES.has(role);
  return (registered ?? custom ?? []).some(
    (held) => (system || !held.includes("*")) && coversPermission(held, key),
  );
}

/** Whether the principal of `snapshot`, acting at `scope` with `grants`, is in `audience` (everyone when absent). */
function inAudience(
  audience: Audience | undefined,
  snapshot: PolicySnapshot,
  grants: readonly Grant[],
  scope: ScopeRef | undefined,
): boolean {
  if (audience === undefined) return true;
  if (!("kind" in audience)) return scope !== undefined && isWithinScope(scope.path, audience.path);
  if (audience.kind === "segment") return snapshot.segments.includes(audience.id);
  return grants.some((grant) => grant.role === audience.key);
}

/** Whether `condition` holds: always without one; never without a record; always for a record with no fact source. */
function conditionHolds(
  condition: Condition | undefined,
  record: RecordFacts | null | undefined,
  at: Date,
): boolean {
  if (condition === undefined) return true;
  if (record === undefined) return false;
  if (record === null) return true;
  return evaluate(record.rules, condition, record.facts, { now: at }).matched;
}

/**
 * Decides permissions, record visibility and delegation.
 *
 * @example
 * if (!(await this.pdp.check(actor, OrderPermissions.cancel, { scope }))) throw ForbiddenError.create();
 */
export class PolicyDecisionPointService extends Service {
  /** Where snapshots come from. */
  private readonly source: PolicySource;

  /** The time grants expire against when a call gives none. */
  private readonly clock: Clock;

  /**
   * @param source - the principal's policy snapshot.
   * @param clock - the current time.
   */
  constructor(source: PolicySource, clock: Clock) {
    super();
    this.source = source;
    this.clock = clock;
  }

  /**
   * Whether `actor` holds `permission` where the call acts.
   *
   * @throws TypeError when `permission` is a static gen has not registered.
   * @example
   * await pdp.check(actors.staff(), "orders.order.cancel"); // true when a staff grant holds it
   */
  async check(
    actor: Actor,
    permission: Permission | string,
    options: CheckOptions = {},
  ): Promise<boolean> {
    return (await this.explain(actor, permission, options)).allowed;
  }

  /**
   * The decision of `check` with its reason, for the audit record and the explain query.
   *
   * @throws TypeError when `permission` is a static gen has not registered.
   * @throws Error when the source cannot be reached, or a stored condition is not a valid tree for the record's model.
   */
  async explain(
    actor: Actor,
    permission: Permission | string,
    options: CheckOptions = {},
  ): Promise<AccessExplanation> {
    const key = permissionKey(permission);
    const at = options.at ?? this.clock.now();
    let result = await this.explainLink(actor, key, options, at);
    for (let link = actor.onBehalfOf; result.allowed && link !== undefined; link = link.onBehalfOf)
      // oxlint-disable-next-line no-await-in-loop -- reason: a later link is read only while the chain still holds
      result = await this.explainLink(link, key, options, at);
    return result;
  }

  /**
   * Whether the originating principal behind `actor` may do `capability` with a record of `model`: `Deny` when a
   * deny rule matches, else `Allow` when an allow rule matches, else `Abstain` (the caller decides; no default).
   *
   * @example
   * await pdp.visibility(actor, Capability.Use, "catalogue.product", { rules: PRODUCT_FACTS, facts: { record } });
   */
  async visibility(
    actor: Actor,
    capability: Capability,
    model: string,
    record: RecordFacts,
    options: Omit<CheckOptions, "record"> = {},
  ): Promise<Decision> {
    const subject = subjectOf(actor);
    if (isPlatform(subject)) return Decision.Allow;
    const at = options.at ?? this.clock.now();
    const snapshot = await this.source.snapshot(subject);
    const grants = snapshot.grants.filter((grant) => applies(grant, options.scope, at));
    let allowed = false;
    for (const rule of snapshot.visibility) {
      if (rule.model !== model || rule.capability !== capability) continue;
      if (!inAudience(rule.audience, snapshot, grants, options.scope)) continue;
      if (!conditionHolds(rule.condition, record, at)) continue;
      if (rule.deny === true) return Decision.Deny;
      allowed = true;
    }
    return allowed ? Decision.Allow : Decision.Abstain;
  }

  /**
   * Whether `delegator` may give `grant` to someone: only a user, only a role it holds unexpired, and only at or below
   * the node it holds that role at.
   *
   * @example
   * await pdp.canDelegate(manager, { role: SystemRole.Staff, scope: storeScope }); // false unless it holds Staff above
   */
  async canDelegate(
    delegator: Actor,
    grant: Grant,
    options: Pick<CheckOptions, "at"> = {},
  ): Promise<boolean> {
    if (delegator.kind !== ActorKind.User) return false;
    const at = (options.at ?? this.clock.now()).getTime();
    const { grants } = await this.source.snapshot(delegator);
    return grants.some(
      (held) =>
        held.role === grant.role &&
        (held.expiresAt === undefined || held.expiresAt.getTime() > at) &&
        isWithinScope(grant.scope.path, held.scope.path),
    );
  }

  /** The decision for one link of the chain. */
  private async explainLink(
    link: Actor,
    key: string,
    options: CheckOptions,
    at: Date,
  ): Promise<AccessExplanation> {
    const principal = link.id;
    if (isPlatform(link)) return { allowed: true, reason: AccessReason.Platform, principal };
    if (PERMISSION_REGISTRY.get(key)?.isSystem === true) {
      const allowed = link.kind === ActorKind.Service && link.onBehalfOf === undefined;
      return {
        allowed,
        reason: allowed ? AccessReason.Platform : AccessReason.SystemOnly,
        principal,
      };
    }
    const snapshot = await this.source.snapshot(link);
    const { version } = snapshot;
    const grants = snapshot.grants.filter((grant) => applies(grant, options.scope, at));
    const grant = grants.find((candidate) => roleHolds(candidate.role, snapshot, key));
    if (grant === undefined)
      return { allowed: false, reason: AccessReason.NotGranted, principal, version };
    const rule = snapshot.denies.findIndex(
      (deny) =>
        coversPermission(deny.permission, key) &&
        inAudience(deny.audience, snapshot, grants, options.scope) &&
        conditionHolds(deny.condition, options.record, at),
    );
    if (rule !== -1)
      return { allowed: false, reason: AccessReason.Denied, principal, version, rule };
    return { allowed: true, reason: AccessReason.Granted, principal, version, role: grant.role };
  }
}
