/**
 * Stackra file contract:
 * Purpose: `RuleSetService`, the module service over `RuleSet`: opens a rule set for a consumer in a scope, stores a
 *          checked condition and its outcomes as its next draft revision, publishes a revision, reads one, evaluates
 *          or decides the published (or a stated) revision against facts, seeds the default rule sets of a
 *          versioned rule-set pack into a scope, opens a pack's default rule set with no scope (`openDefault`), and
 *          reads a scope's AI action permission matrix.
 * Boundary: a `CrudService<RuleSet>` that injects `Repository<Revision>` (content's `HasRevisions` table), so every
 *           read and write runs in the caller's transaction and scope session; row-level security limits both tables
 *           to the session's granted subtrees. A draft is checked against the consumer's `Rules` and refused for a
 *           rule set of another consumer (`not_found`, as a rule set the consumer cannot see); a revision is never
 *           changed, so an edit is a new draft. Publishing sets the revision's time and records `RuleSetPublished`,
 *           both written when the caller's unit of work commits; publishing an older revision rolls back to it. The
 *           engine's result is all `evaluate` and `decide` return: the consumer owns the outcome. A seed marks the
 *           revisions it writes, and never writes over a rule set whose latest revision is the tenant's.
 * Runtime: node
 * Governing contract: ADR 0331 (decisions 5, 6, 9 and 10); ADR 0321 (decision 2); ADR 0327 (decisions 3 and 9);
 *                     ADR 0105 as amended by ADR 0294; config-model sections 4 and 6 (rule sets ship as versioned seed
 *                     documents; a new seed version never overwrites tenant values); ADR 0398 and STA-1250 (the
 *                     matrix reader); ADR 0455 (decision 1: `openDefault`).
 */
import type { Revision } from "@stackra/content/node";
import type { ActionPermissionRow } from "@stackra/ai";
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { CrudService, type Repository, UniqueViolation } from "@stackra/database";
import { isRefusal, NotFoundError } from "@stackra/errors";
import type { ResolvedValue } from "@stackra/market-packs";

import { SeedResult } from "#contracts/index";
import {
  ACTION_PERMISSION_RULES,
  actionPermissionRowsOf,
  type Condition,
  decide,
  type DecideOptions,
  type Decision,
  evaluate,
  type EvaluateOptions,
  type Evaluation,
  type Facts,
  type Outcome,
  packRuleSetOf,
  RuleSetChangedError,
  RuleSetPack$,
  RuleSetPublished,
  type Rules,
  type RuleSetTemplate,
} from "#core/index";
import type { RuleSet } from "#node/models/rule-set.model";
import type { RuleSetRevision } from "#node/types/rule-set-revision.type";

/** The model key a rule set's revisions are stored under in `content.revisions`. */
const MODEL = "rules.rule_set";

/**
 * Keeps rule sets and their revisions.
 *
 * @example
 * const ruleSet = await ruleSets.open(scope, DISCOUNT_RULES);
 * const revision = await ruleSets.draft(ruleSet.id, DISCOUNT_RULES, input.condition, input.outcomes);
 * await ruleSets.publish(ruleSet.id, revision);
 * const decision = await ruleSets.decide(ruleSet.id, DISCOUNT_RULES, facts, { now: ctx.startedAt, floors });
 */
export class RuleSetService extends CrudService<RuleSet> {
  /** Content's revisions table. */
  private readonly revisions: Repository<Revision>;

  /**
   * @param revisions - the revisions of every `HasRevisions` model, one row per revision.
   */
  constructor(revisions: Repository<Revision>) {
    super();
    this.revisions = revisions;
  }

  /** A new rule set of `rules`' consumer at `scope`, with no revision yet. */
  open(scope: ScopeRef, rules: Rules): Promise<RuleSet> {
    return this.insert({ scopeId: scope.id, scopePath: scope.path, consumer: rules.key });
  }

  /**
   * The default rule set `key` of `pack` (a `RuleSetPack$` document), with no `ScopeRef` and nothing stored: what a
   * consumer evaluates or decides with (through `evaluate` and `decide` of the `.` entry) before a scope has seeded
   * or written its own. It is never published and has no number (`0`); `seedPack` stores it in a scope.
   *
   * @throws ZodError when `pack` is not a rule-set pack; TypeError when it has no template `key` or the template is
   *         for another consumer than `rules`; ConditionInvalidError or OutcomeInvalidError when it does not check.
   * @example
   * const rule = ruleSets.openDefault(returnsPack, "commerce.returns.window", RETURNS_RULES);
   * const decision = decide(RETURNS_RULES, rule, facts, { now: ctx.startedAt, floors });
   */
  openDefault(pack: unknown, key: string, rules: Rules): RuleSetRevision {
    return {
      ...packRuleSetOf(pack, key, rules),
      number: 0,
      seedVersion: RuleSetPack$.parse(pack).version,
      publishedAt: null,
    };
  }

  /**
   * Stores `condition` and `outcomes`, checked against `rules`, as the rule set's next revision, a draft. Given the
   * market's `floors` (the rules studio's save), an outcome past a floor is refused instead of being moved to it
   * later, so the tenant sees "required by law" at save time.
   *
   * @returns the new revision's number.
   * @throws NotFoundError when no visible rule set has the id, or it belongs to another consumer.
   * @throws ConditionInvalidError when `condition` does not check against `rules`.
   * @throws OutcomeInvalidError when `outcomes` do not check against `rules`' outcome kinds, or one crosses a floor
   *         (`past_floor`, `currency_mismatch`).
   * @throws RuleSetChangedError when another draft took the number first; a retry takes the next one.
   */
  async draft(
    ruleSetId: PublicId<"rset">,
    rules: Rules,
    condition: unknown,
    outcomes: unknown = [],
    floors?: readonly ResolvedValue[],
  ): Promise<number> {
    const ruleSet = await this.findOneOrFail({ id: ruleSetId });
    if (ruleSet.consumer !== rules.key) throw NotFoundError.create();
    return this.write(ruleSet, rules.check(condition), rules.checkOutcomes(outcomes, floors));
  }

  /**
   * Makes revision `number` the one evaluations use by default, and records `RuleSetPublished`.
   *
   * @throws NotFoundError when the rule set or the revision is not visible.
   */
  async publish(ruleSetId: PublicId<"rset">, number: number): Promise<void> {
    const ruleSet = await this.findOneOrFail({ id: ruleSetId });
    const revision = await this.revisions.findOneOrFail({
      model: MODEL,
      recordId: ruleSetId,
      number,
    });
    revision.publishedAt = new Date();
    ruleSet.record(
      RuleSetPublished.create({ ruleSetId, consumer: ruleSet.consumer, revision: number }),
    );
  }

  /**
   * Revision `number` of the rule set, or the revision published last when `number` is left out.
   *
   * @throws NotFoundError when there is no such revision, or none is published.
   */
  async revision(ruleSetId: PublicId<"rset">, number?: number): Promise<RuleSetRevision> {
    const [row] = await this.revisions.find(
      number === undefined
        ? { model: MODEL, recordId: ruleSetId, publishedAt: { $ne: null } }
        : { model: MODEL, recordId: ruleSetId, number },
      { orderBy: { publishedAt: "desc" }, limit: 1 },
    );
    if (row === undefined) throw NotFoundError.create();
    const seed = row.data["seed"] as { readonly version?: unknown } | undefined;
    return {
      number: row.number,
      // reason: `draft` stored a checked condition, and `evaluate` checks it again before it runs
      condition: row.data["condition"] as Condition,
      // reason: `draft` stored checked outcomes (none before outcomes existed), and `decide` checks them again
      outcomes: (row.data["outcomes"] as readonly Outcome[] | undefined) ?? [],
      ...(typeof seed?.version === "string" ? { seedVersion: seed.version } : {}),
      publishedAt: row.publishedAt,
    };
  }

  /**
   * Evaluates the rule set's published revision, or `options.revision`, against `facts` at `options.now`.
   *
   * @throws NotFoundError when the revision is not there (see `revision`).
   * @throws ConditionInvalidError when the stored condition no longer checks against `rules`.
   */
  async evaluate(
    ruleSetId: PublicId<"rset">,
    rules: Rules,
    facts: Facts,
    options: EvaluateOptions,
  ): Promise<Evaluation> {
    const revision = await this.revision(ruleSetId, options.revision);
    return evaluate(rules, revision.condition, facts, {
      now: options.now,
      revision: revision.number,
    });
  }

  /**
   * The decision of the rule set's published revision, or `options.revision`, on `facts`: its outcomes guarded against
   * `options.floors` when it matches.
   *
   * @throws NotFoundError when the revision is not there (see `revision`).
   * @throws ConditionInvalidError or OutcomeInvalidError when the stored rule no longer checks against `rules`.
   */
  async decide(
    ruleSetId: PublicId<"rset">,
    rules: Rules,
    facts: Facts,
    options: DecideOptions,
  ): Promise<Decision> {
    const revision = await this.revision(ruleSetId, options.revision);
    return decide(rules, revision, facts, { ...options, revision: revision.number });
  }

  /**
   * The AI action permission matrix of `scope`: the rows of the published revision of its `ai.action_permissions`
   * rule set, for `ApprovalRules.matrix`; none when the scope has no such rule set or none is published.
   *
   * @throws OutcomeInvalidError when a stored row no longer reads as a row (see `actionPermissionRowsOf`).
   * @example
   * resolveApproval(request, { floor, packFloor, matrix: await ruleSets.approvalMatrix(scope), policy, preferences });
   */
  async approvalMatrix(scope: ScopeRef): Promise<ActionPermissionRow[]> {
    const ruleSet = await this.findOne({
      scopeId: scope.id,
      consumer: ACTION_PERMISSION_RULES.key,
    });
    if (ruleSet === null) return [];
    try {
      return actionPermissionRowsOf((await this.revision(ruleSet.id)).outcomes);
    } catch (error) {
      if (isRefusal(error, NotFoundError)) return [];
      throw error;
    }
  }

  /**
   * Seeds `template` of pack version `version` into `scope`: creates and publishes the rule set the first time, and
   * later drafts and publishes the new version only while the latest revision is a seed's, so a tenant's edit stands.
   *
   * @throws TypeError when the template is for another consumer than `rules`.
   * @throws ConditionInvalidError or OutcomeInvalidError when the template does not check against `rules`.
   */
  async seed(
    scope: ScopeRef,
    rules: Rules,
    template: RuleSetTemplate,
    version: string,
  ): Promise<SeedResult> {
    if (template.consumer !== rules.key)
      throw new TypeError(
        `RuleSetService.seed: ${template.key} is for ${template.consumer}, not ${rules.key}`,
      );
    const condition = rules.check(template.condition);
    const outcomes = rules.checkOutcomes(template.outcomes);
    const seed = { key: template.key, version };
    const known = await this.findOne({
      scopeId: scope.id,
      consumer: rules.key,
      seedKey: template.key,
    });
    if (known === null) {
      const ruleSet = await this.insert({
        scopeId: scope.id,
        scopePath: scope.path,
        consumer: rules.key,
        seedKey: template.key,
        seedVersion: version,
      });
      await this.publish(ruleSet.id, await this.write(ruleSet, condition, outcomes, seed));
      return SeedResult.Created;
    }
    if (known.seedVersion === version) return SeedResult.Current;
    const [latest] = await this.revisions.find(
      { model: MODEL, recordId: known.id },
      { orderBy: { number: "desc" }, limit: 1 },
    );
    if (latest !== undefined && latest.data["seed"] === undefined) return SeedResult.Kept;
    await this.publish(known.id, await this.write(known, condition, outcomes, seed));
    known.seedVersion = version;
    return SeedResult.Updated;
  }

  /**
   * Seeds every template of `pack` (a `RuleSetPack$` document) into `scope`, each against its consumer's `Rules`.
   *
   * @returns each template key with what seeding it did.
   * @throws ZodError when `pack` is not a rule-set pack; TypeError when no `consumers` entry has a template's consumer.
   */
  async seedPack(
    scope: ScopeRef,
    pack: unknown,
    consumers: readonly Rules[],
  ): Promise<Record<string, SeedResult>> {
    const parsed = RuleSetPack$.parse(pack);
    const results: Record<string, SeedResult> = {};
    for (const template of parsed.ruleSets) {
      const rules = consumers.find((candidate) => candidate.key === template.consumer);
      if (rules === undefined)
        throw new TypeError(
          `RuleSetService.seedPack: ${parsed.key} needs the Rules of ${template.consumer}`,
        );
      // oxlint-disable-next-line no-await-in-loop -- templates seed one after another in the caller's transaction
      results[template.key] = await this.seed(scope, rules, template, parsed.version);
    }
    return results;
  }

  /**
   * Stores a checked rule as the next revision of `ruleSet`, marked with `seed` when a seed writes it.
   *
   * @throws RuleSetChangedError when another draft took the number first.
   */
  private async write(
    ruleSet: RuleSet,
    condition: Condition,
    outcomes: readonly Outcome[],
    seed?: { readonly key: string; readonly version: string },
  ): Promise<number> {
    const number = (await this.revisions.count({ model: MODEL, recordId: ruleSet.id })) + 1;
    try {
      await this.revisions.insert({
        scopeId: ruleSet.scopeId,
        scopePath: ruleSet.scopePath,
        model: MODEL,
        recordId: ruleSet.id,
        number,
        data: {
          condition,
          ...(outcomes.length === 0 ? {} : { outcomes }),
          ...(seed === undefined ? {} : { seed }),
        },
      });
    } catch (error) {
      if (error instanceof UniqueViolation)
        throw RuleSetChangedError.create({ ruleSetId: ruleSet.id });
      throw error;
    }
    return number;
  }
}
