/**
 * Stackra file contract:
 * Purpose: `IamVisibilityFilterDriver`, the driver of `@stackra/database`'s `VisibilityFilter` port: the conditions a
 *          principal's reads of a model carry, from the visibility rules the policy decision point finds for the
 *          principal (the `see` capability), as a filter `CrudService` and `GraphQuery` AND into every row list,
 *          single read, count and aggregate; and, for the existence-only query, the conditions of the records the
 *          principal may see or only learn exist (`see` or `exists`).
 * Boundary: only ever narrows, on top of row-level security, and carries no scope isolation and no way to skip the
 *           policy (ADR 0333 decision 5, ADR 0327). A model that declares no `@Visibility` reads unchanged; one that
 *           declares it with no `registerVisibility` row fails the read (closed). A followed relation ANDs the related
 *           model's own filter under the relation, so a record is visible only when its related record is; a record
 *           without one is not governed by it, and a cycle of follows fails the read. No principal (a listener, a job
 *           runner, a seeder outside every call) is the platform's own code, which the decision point lets see every
 *           record, as it does a system or job actor. The call's scope node and its one instant come from the running
 *           call's context.
 * Runtime: node
 * Governing contract: ADR 0333 (decisions 1 to 5, and its amendment: relations, counts and aggregates); ADR 0208
 *                     (decision 3); ADR 0327 (no bypass); ADR 0294 (decisions 16 and 17); STA-933 (existence-only
 *                     query).
 */
import type { ExtensionContext } from "@stackra/actions";
import type { ContextStorage } from "@stackra/actions/contracts";
import { type AnyClass, Driver } from "@stackra/container";
import type { Clock, Actor, ScopeRef } from "@stackra/contracts";
import { VisibilityFilter } from "@stackra/database/contracts";
import type { Where } from "@stackra/database/contracts";
import { Visibility } from "@stackra/model";
import type { Condition } from "@stackra/rules";

import { Capability } from "#contracts/index";
import type { PolicyDecisionPointService } from "#core/index";
import { VISIBILITY_REGISTRY } from "#node/constants/visibility-registry.constant";
import { whereOf } from "#node/functions/where-of.function";

/** Whether `filter` narrows nothing. */
const isOpen = (filter: object): boolean => Reflect.ownKeys(filter).length === 0;

/**
 * Pushes the visibility rules into reads.
 *
 * @example
 * // gen's entry, after registerVisibility([...]) and once the container is booted
 * connectVisibilityFilter(container); // with IamVisibilityFilterDriver bound to VisibilityFilter
 */
export class IamVisibilityFilterDriver extends Driver(VisibilityFilter) {
  /** Finds the rules in force for the principal. */
  private readonly pdp: PolicyDecisionPointService;

  /** The running call: its scope node and its instant. */
  private readonly context: ContextStorage;

  /** The time outside a call. */
  private readonly clock: Clock;

  /**
   * @param pdp - the decision point.
   * @param context - the running call's context.
   * @param clock - the current time when no call runs.
   */
  constructor(pdp: PolicyDecisionPointService, context: ContextStorage, clock: Clock) {
    super();
    this.pdp = pdp;
    this.context = context;
    this.clock = clock;
  }

  /**
   * The conditions `principal`'s reads of `model` carry; `{}` for none, `{ $or: [] }` when it may see no record.
   *
   * @throws Error when the model declares `@Visibility` without a registered row, its follows form a cycle, or the
   *         policy source cannot be reached.
   * @throws ConditionInvalidError when a stored rule's condition does not fit the model's attributes.
   */
  async conditionsFor<M extends object>(
    model: AnyClass<M>,
    principal: Actor | undefined,
  ): Promise<Where<M>> {
    return this.conditionsOf(model, principal, [Capability.See]);
  }

  /**
   * The conditions of the records of `model` `principal` may see or only learn exist (`see` or `exists`), for the
   * existence-only query; a followed relation needs the same of its related record. Never used to read fields.
   *
   * @throws Error as `conditionsFor` does.
   */
  async existenceConditionsFor<M extends object>(
    model: AnyClass<M>,
    principal: Actor | undefined,
  ): Promise<Where<M>> {
    return this.conditionsOf(model, principal, [Capability.See, Capability.Exists]);
  }

  /** The conditions of the records of `model` one of `capabilities` allows, at the running call. */
  private async conditionsOf<M extends object>(
    model: AnyClass<M>,
    principal: Actor | undefined,
    capabilities: readonly Capability[],
  ): Promise<Where<M>> {
    if (principal === undefined) return {} as Where<M>;
    const call = this.context.current() as ExtensionContext | undefined;
    // shortcut: a call whose context carries no scope is judged at the root (narrower than the permission step's
    // credential fallback); drop it once every call carries its scope node (ADR 0327 decision 6).
    const scope = call?.scope;
    const at = call?.now() ?? this.clock.now();
    return (await this.filterOf(model, principal, scope, at, [], capabilities)) as Where<M>;
  }

  /** The filter of `model`, with the models followed on the way to it in `path`. */
  private async filterOf(
    model: AnyClass,
    principal: Actor,
    scope: ScopeRef | undefined,
    at: Date,
    path: readonly AnyClass[],
    capabilities: readonly Capability[],
  ): Promise<object> {
    const entry = VISIBILITY_REGISTRY.get(model);
    if (entry === undefined) {
      if (Visibility.on(model) !== undefined)
        throw new Error(
          `${model.name} declares @Visibility, but registerVisibility has no row for it`,
        );
      return {};
    }
    if (path.includes(model))
      throw new Error(`the relations ${model.name} follows lead back to it`);
    const { row } = entry;
    const conditions = await Promise.all(
      capabilities.map((capability) =>
        this.pdp.visibleCondition(principal, capability, row.key, {
          ...(scope === undefined ? {} : { scope }),
          ...(row.rules === undefined ? {} : { rules: row.rules }),
          unmatched: row.unmatched,
          at,
        }),
      ),
    );
    const [first] = conditions;
    const condition: Condition =
      conditions.length === 1 && first !== undefined ? first : { any: conditions };
    const related = await Promise.all(
      entry.follows.map(async ([relation, target]) => {
        const filter = await this.filterOf(
          target,
          principal,
          scope,
          at,
          [...path, model],
          capabilities,
        );
        return isOpen(filter) ? {} : { $or: [{ [relation]: null }, { [relation]: filter }] };
      }),
    );
    const own = whereOf(condition, row.rules, at) as object;
    const parts = [own, ...related].filter((part) => !isOpen(part));
    if (parts.length > 1) return { $and: parts };
    return parts[0] ?? {};
  }
}
