/**
 * Stackra file contract:
 * Purpose: `PolicyDecisionPointService`, the embedded policy decision point: `check` and `explain` (may this actor use
 *          this permission where the call acts), `visibility` (may it see, list or use this record), `visibleCondition`
 *          (the condition a record must meet for that, which the query filter pushes into reads) and `canDelegate`
 *          (may it hand this grant on), each evaluated in process over the principal's policy snapshot.
 * Boundary: reads only `PolicySource` and `Clock`; no network hop of its own and no writes. Rules, in order: a system or
 *           job actor is the platform; a system permission is held by the platform only (a service acting for no one
 *           counts), never through a role; a grant applies at its node and below and until it expires, and a call with
 *           no scope acts at the root; a wildcard counts only in a system role (a `SystemRole` code or a module role);
 *           an explicit deny beats every grant, and a deny with a condition is tested only against a record. Every
 *           link of the actor chain must hold the permission (a service and the user it acts for). Conditions are
 *           `@stackra/rules` trees evaluated by that package's `evaluate`, with the time as a fact (ADR 0331 decisions
 *           1, 6 and 11): IAM reuses the operator set and the evaluator, and keeps its own path from the snapshot.
 *           Visibility answers `Abstain` for a record no rule matches: no default is decided (ADR 0333 decision 7), so
 *           `visibleCondition` takes the answer for such a record from its caller. A rule's audience depends on the
 *           principal only, so `visibleCondition` settles it here and returns the matching rules' conditions, each
 *           checked against the model's fields, joined by the deny rule: the IAM path of ADR 0331 decision 11. A
 *           restricted permission counts only through a grant someone else made. An open break-glass grant holds a
 *           permission no regular grant does, inside its window, past `breakable` denies only. A condition on a
 *           dimension another service owns is tested against the `DimensionValues` projection first: a value not
 *           projected or retired fails an allow and holds a deny (ADR 0351 decision 4). `fieldAccess` answers the field
 *           rules in force for a record (hidden, read-only).
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decisions 1 to 4, and the 0327 and 0333 notes); ADR 0132 (decision 5); ADR 0333
 *                     (decisions 2, 3 and 7, as amended by ADR 0462); ADR 0099 (as amended by 0294); ADR 0098 (the actor chain); ADR 0351
 *                     (decisions 3 and 4); STA-595 (field rules, break-glass, restricted permissions).
 */
import { Service } from "@stackra/container";
import {
  type Clock,
  type Actor,
  ActorKind,
  Enum,
  type PublicId,
  type ScopeRef,
} from "@stackra/contracts";
import { type Condition, evaluate, type Rules } from "@stackra/rules";
import { Operator } from "@stackra/rules/contracts";
import { isWithinScope } from "@stackra/scope";

import { FieldAccess } from "#contracts/index";
import type {
  Audience,
  BreakGlassGrant,
  Capability,
  Grant,
  PolicySnapshot,
  DimensionValues,
  PolicySource,
} from "#contracts/index";
import { DIMENSION_REGISTRY } from "#core/constants/dimension-registry.constant";
import { PERMISSION_REGISTRY } from "#core/constants/permission-registry.constant";
import { ROLE_REGISTRY } from "#core/constants/role-registry.constant";
import { AccessReason } from "#core/enums/access-reason.enum";
import { Decision } from "#core/enums/decision.enum";
import { SystemRole } from "#core/enums/system-role.enum";
import { conditionFields } from "#core/functions/condition-fields.function";
import { coversPermission } from "#core/functions/covers-permission.function";
import { permissionKey } from "#core/functions/permission-key.function";
import type { AccessExplanation } from "#core/types/access-explanation.type";
import type { CheckOptions } from "#core/types/check-options.type";
import type { FieldPermissions } from "#core/types/field-permissions.type";
import type { RecordFacts } from "#core/types/record-facts.type";
import type { VisibleConditionOptions } from "#core/types/visible-condition-options.type";
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

/** Whether `glass` counts where the call acts at `at`: inside its window, held at or above the call's node. */
function glassApplies(glass: BreakGlassGrant, scope: ScopeRef | undefined, at: Date): boolean {
  const time = at.getTime();
  if (time < glass.startsAt.getTime() || time >= glass.expiresAt.getTime()) return false;
  return scope === undefined
    ? !glass.scope.path.includes(".")
    : isWithinScope(scope.path, glass.scope.path);
}

/** The permission keys `role` holds, and whether its wildcards count (a system or module role). */
function heldBy(role: string, snapshot: PolicySnapshot): [readonly string[], boolean] {
  const registered = ROLE_REGISTRY.get(role);
  const custom = Object.hasOwn(snapshot.roles, role) ? snapshot.roles[role] : undefined;
  return [registered ?? custom ?? [], registered !== undefined || SYSTEM_ROLES.has(role)];
}

/** Whether `role` holds `key`; a wildcard entry counts only when the role is a system role. */
function roleHolds(role: string, snapshot: PolicySnapshot, key: string): boolean {
  const [held, system] = heldBy(role, snapshot);
  return held.some((entry) => (system || !entry.includes("*")) && coversPermission(entry, key));
}

/** Whether `role` holds any registered restricted permission. */
function roleHoldsRestricted(role: string, snapshot: PolicySnapshot): boolean {
  for (const [key, permission] of PERMISSION_REGISTRY)
    if (permission.isRestricted && roleHolds(role, snapshot, key)) return true;
  return false;
}

/** The value of `path` (`record.channelId`) in `facts`, or `undefined`. */
function valueAt(facts: unknown, path: string): unknown {
  let value = facts;
  for (const part of path.split(".")) {
    if (typeof value !== "object" || value === null) return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}

/**
 * Whether the principal acting at `scope` with `grants` is in `audience` (everyone when absent). IAM knows no segments:
 * a segment-targeted business rule is a `@stackra/rules` condition (ADR 0462 decision 1).
 */
function inAudience(
  audience: Audience | undefined,
  grants: readonly Grant[],
  scope: ScopeRef | undefined,
): boolean {
  if (audience === undefined) return true;
  if (!("kind" in audience)) return scope !== undefined && isWithinScope(scope.path, audience.path);
  return grants.some((grant) => grant.role === audience.key);
}

/**
 * Whether `condition` holds: always without one; never without a record; always for a record with no fact source;
 * for a record whose dimension value is not live, as `deny` says (a deny holds, an allow fails: ADR 0351 decision 4).
 */
function conditionHolds(
  condition: Condition | undefined,
  record: RecordFacts | null | undefined,
  at: Date,
  live: (condition: Condition, record: RecordFacts) => boolean,
  deny: boolean,
): boolean {
  if (condition === undefined) return true;
  if (record === undefined) return false;
  if (record === null) return true;
  if (!live(condition, record)) return deny;
  return evaluate(record.rules, condition, record.facts, { now: at }).matched;
}

/** A stored rule's condition checked against `rules`; without `rules`, a deny holds for every record, an allow none. */
function testable(
  condition: Condition | undefined,
  rules: Rules | undefined,
  deny: boolean,
): Condition {
  if (condition === undefined) return { all: [] };
  if (rules === undefined) return deny ? { all: [] } : { any: [] };
  return rules.check(condition);
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

  /** The projection of foreign dimensions; without it no dimension value is live. */
  private readonly dimensions: DimensionValues | undefined;

  /** Whether every dimension value `condition` tests on `record` is live; bound once for the helpers above. */
  private readonly live = (condition: Condition, record: RecordFacts): boolean => {
    const rows = record.model === undefined ? undefined : DIMENSION_REGISTRY.get(record.model);
    if (rows === undefined || rows.length === 0) return true;
    const tested = conditionFields(condition);
    return rows.every((row) => {
      if (!tested.has(row.field)) return true;
      const value = valueAt(record.facts, row.field);
      if (value === undefined || value === null) return true;
      return typeof value === "string" && this.dimensions?.isLive(row.dimension, value) === true;
    });
  };

  /**
   * @param source - the principal's policy snapshot.
   * @param clock - the current time.
   * @param dimensions - the projection of the dimensions other services own; none is live when left out.
   */
  constructor(source: PolicySource, clock: Clock, dimensions?: DimensionValues) {
    super();
    this.source = source;
    this.clock = clock;
    this.dimensions = dimensions;
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
      if (!inAudience(rule.audience, grants, options.scope)) continue;
      if (!conditionHolds(rule.condition, record, at, this.live, rule.deny === true)) continue;
      if (rule.deny === true) return Decision.Deny;
      allowed = true;
    }
    return allowed ? Decision.Allow : Decision.Abstain;
  }

  /**
   * The condition a record of `model` meets exactly when the originating principal behind `actor` may do `capability`
   * with it: no deny rule's condition holds and, unless `options.unmatched` is `Allow`, an allow rule's does.
   * `{ all: [] }` holds for every record (the platform, or nothing in force) and `{ any: [] }` for none. The query
   * filter of ADR 0333 decision 4 pushes it into a read; `visibility` answers the same rules for one record.
   *
   * @throws ConditionInvalidError when a stored condition is not a valid tree of `options.rules`.
   * @throws Error when the source cannot be reached.
   * @example
   * await pdp.visibleCondition(customer, Capability.See, "catalogue.product", { rules, unmatched: Decision.Deny });
   * // { any: [{ field: "record.collection", operator: Operator.Equals, value: "private_sale" }] }
   */
  async visibleCondition(
    actor: Actor,
    capability: Capability,
    model: string,
    options: VisibleConditionOptions,
  ): Promise<Condition> {
    const subject = subjectOf(actor);
    if (isPlatform(subject)) return { all: [] };
    const at = options.at ?? this.clock.now();
    const snapshot = await this.source.snapshot(subject);
    const grants = snapshot.grants.filter((grant) => applies(grant, options.scope, at));
    const allows: Condition[] = [];
    const denies: Condition[] = [];
    for (const rule of snapshot.visibility) {
      if (rule.model !== model || rule.capability !== capability) continue;
      if (!inAudience(rule.audience, grants, options.scope)) continue;
      const deny = rule.deny === true;
      const tested = testable(rule.condition, options.rules, deny);
      (deny ? denies : allows).push(this.withDimensions(model, rule.condition, tested, deny));
    }
    const parts: Condition[] = [];
    // fail closed: anything but an explicit Allow hides a record no allow rule matches
    if (options.unmatched !== Decision.Allow) parts.push({ any: allows });
    if (denies.length > 0) parts.push({ not: { any: denies } });
    return parts.length === 1 && parts[0] !== undefined ? parts[0] : { all: parts };
  }

  /**
   * The fields of a record of `model` the originating principal behind `actor` may not read or may not write: the
   * union of the field rules in force for its audiences whose condition the record matches (a rule with a condition
   * applies without a record, read closed). The platform has no field limits.
   *
   * @throws Error when the source cannot be reached, or a stored condition is not a valid tree for the record's model.
   * @example
   * const access = await pdp.fieldAccess(coach, "academy.athlete", { record, scope });
   * return redactFields(athlete, access);
   */
  async fieldAccess(
    actor: Actor,
    model: string,
    options: CheckOptions = {},
  ): Promise<FieldPermissions> {
    const subject = subjectOf(actor);
    if (isPlatform(subject)) return { hidden: [], readOnly: [] };
    const at = options.at ?? this.clock.now();
    const snapshot = await this.source.snapshot(subject);
    const grants = snapshot.grants.filter((grant) => applies(grant, options.scope, at));
    const hidden = new Set<string>();
    const readOnly = new Set<string>();
    for (const rule of snapshot.fields ?? []) {
      if (rule.model !== model) continue;
      if (!inAudience(rule.audience, grants, options.scope)) continue;
      const record =
        options.record === undefined && rule.condition !== undefined ? null : options.record;
      if (!conditionHolds(rule.condition, record, at, this.live, true)) continue;
      const into = rule.access === FieldAccess.Hidden ? hidden : readOnly;
      for (const field of rule.fields) into.add(field);
    }
    return { hidden: [...hidden], readOnly: [...readOnly].filter((field) => !hidden.has(field)) };
  }

  /**
   * Whether `delegator` may give `grant` to someone: only a user, only a role it holds unexpired, only at or below
   * the node it holds that role at, and never a role holding a restricted permission to itself (`options.to`).
   *
   * @example
   * await pdp.canDelegate(manager, { role: SystemRole.Staff, scope: storeScope }); // false unless it holds Staff above
   */
  async canDelegate(
    delegator: Actor,
    grant: Grant,
    options: Pick<CheckOptions, "at"> & { readonly to?: PublicId } = {},
  ): Promise<boolean> {
    if (delegator.kind !== ActorKind.User) return false;
    const at = (options.at ?? this.clock.now()).getTime();
    const snapshot = await this.source.snapshot(delegator);
    if (options.to === delegator.id && roleHoldsRestricted(grant.role, snapshot)) return false;
    const { grants } = snapshot;
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
    const restricted = PERMISSION_REGISTRY.get(key)?.isRestricted === true;
    const grants = snapshot.grants.filter((grant) => applies(grant, options.scope, at));
    // a restricted permission counts only through a grant another principal made
    const counted = restricted
      ? grants.filter((grant) => grant.grantedBy !== undefined && grant.grantedBy !== principal)
      : grants;
    const grant = counted.find((candidate) => roleHolds(candidate.role, snapshot, key));
    const glasses = snapshot.breakGlass ?? [];
    const glass =
      grant === undefined
        ? glasses.findIndex(
            (candidate) =>
              glassApplies(candidate, options.scope, at) &&
              roleHolds(candidate.role, snapshot, key) &&
              (!restricted ||
                (candidate.approvedBy !== undefined && candidate.approvedBy !== principal)),
          )
        : -1;
    if (grant === undefined && glass === -1)
      return { allowed: false, reason: AccessReason.NotGranted, principal, version };
    const rule = snapshot.denies.findIndex(
      (deny) =>
        (grant !== undefined || deny.breakable !== true) &&
        coversPermission(deny.permission, key, true) &&
        inAudience(deny.audience, grants, options.scope) &&
        conditionHolds(deny.condition, options.record, at, this.live, true),
    );
    if (rule !== -1)
      return { allowed: false, reason: AccessReason.Denied, principal, version, rule };
    if (grant === undefined)
      return {
        allowed: true,
        reason: AccessReason.BreakGlass,
        principal,
        version,
        role: glasses[glass]?.role ?? "",
        breakGlass: glass,
      };
    return { allowed: true, reason: AccessReason.Granted, principal, version, role: grant.role };
  }

  /**
   * `condition` (already checked as `tested`) with the dimension rule of ADR 0351 decision 4 pushed into it: an allow
   * matches only records whose dimension values are live (or unset), a deny also every record whose value is not.
   */
  private withDimensions(
    model: string,
    condition: Condition | undefined,
    tested: Condition,
    deny: boolean,
  ): Condition {
    const rows = DIMENSION_REGISTRY.get(model);
    if (condition === undefined || rows === undefined) return tested;
    const named = conditionFields(condition);
    const guards = rows
      .filter((row) => named.has(row.field))
      .map((row) => ({
        any: [
          { field: row.field, operator: Operator.IsNotSet },
          {
            field: row.field,
            operator: Operator.OneOf,
            value: [...(this.dimensions?.live(row.dimension) ?? [])],
          },
        ],
      }));
    if (guards.length === 0) return tested;
    return deny ? { any: [tested, { not: { all: guards } }] } : { all: [tested, ...guards] };
  }
}
