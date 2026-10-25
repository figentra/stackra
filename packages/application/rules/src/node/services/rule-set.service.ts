/**
 * Stackra file contract:
 * Purpose: `RuleSetService`, the module service over `RuleSet`: opens a rule set for a consumer in a scope, stores a
 *          checked condition as its next draft revision, publishes a revision, reads one, and evaluates the published
 *          (or a stated) revision against facts.
 * Boundary: a `CrudService<RuleSet>` that injects `Repository<Revision>` (content's `HasRevisions` table), so every
 *           read and write runs in the caller's transaction and scope session; row-level security limits both tables
 *           to the session's granted subtrees. A draft is checked against the consumer's `Rules` and refused for a
 *           rule set of another consumer (`not_found`, as a rule set the consumer cannot see); a revision is never
 *           changed, so an edit is a new draft. Publishing sets the revision's time and records `RuleSetPublished`,
 *           both written when the caller's unit of work commits; publishing an older revision rolls back to it. The
 *           engine's result is all `evaluate` returns: the consumer owns the outcome.
 * Runtime: node
 * Governing contract: ADR 0331 (decisions 5, 6, 9 and 10); ADR 0321 (decision 2); ADR 0327 (decisions 3 and 9);
 *                     ADR 0105 as amended by ADR 0294.
 */
import type { Revision } from "@stackra/content/node";
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { CrudService, type Repository, UniqueViolation } from "@stackra/database";
import { NotFoundError } from "@stackra/errors";

import {
  type Condition,
  evaluate,
  type EvaluateOptions,
  type Evaluation,
  type Facts,
  RuleSetChangedError,
  RuleSetPublished,
  type Rules,
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
 * const revision = await ruleSets.draft(ruleSet.id, DISCOUNT_RULES, input.condition);
 * await ruleSets.publish(ruleSet.id, revision);
 * const { matched } = await ruleSets.evaluate(ruleSet.id, DISCOUNT_RULES, facts, { now: ctx.startedAt });
 */
export class RuleSetService extends CrudService<RuleSet> {
  /** Content's revisions table. */
  private readonly revisions: Repository<Revision>;

  /** @param revisions - the revisions of every `HasRevisions` model, one row per revision. */
  constructor(revisions: Repository<Revision>) {
    super();
    this.revisions = revisions;
  }

  /** A new rule set of `rules`' consumer at `scope`, with no revision yet. */
  open(scope: ScopeRef, rules: Rules): Promise<RuleSet> {
    return this.insert({ scopeId: scope.id, scopePath: scope.path, consumer: rules.key });
  }

  /**
   * Stores `condition`, checked against `rules`, as the rule set's next revision, a draft.
   *
   * @returns the new revision's number.
   * @throws NotFoundError when no visible rule set has the id, or it belongs to another consumer.
   * @throws ConditionInvalidError when `condition` does not check against `rules`.
   * @throws RuleSetChangedError when another draft took the number first; a retry takes the next one.
   */
  async draft(ruleSetId: PublicId<"rset">, rules: Rules, condition: unknown): Promise<number> {
    const ruleSet = await this.findOneOrFail({ id: ruleSetId });
    if (ruleSet.consumer !== rules.key) throw NotFoundError.create();
    const checked = rules.check(condition);
    const number = (await this.revisions.count({ model: MODEL, recordId: ruleSetId })) + 1;
    try {
      await this.revisions.insert({
        scopeId: ruleSet.scopeId,
        scopePath: ruleSet.scopePath,
        model: MODEL,
        recordId: ruleSetId,
        number,
        data: { condition: checked },
      });
    } catch (error) {
      if (error instanceof UniqueViolation) throw RuleSetChangedError.create({ ruleSetId });
      throw error;
    }
    return number;
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
    return {
      number: row.number,
      // reason: `draft` stored a checked condition, and `evaluate` checks it again before it runs
      condition: row.data["condition"] as Condition,
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
}
