/**
 * Stackra file contract:
 * Purpose: `AwardKindService`, the module service over `AwardKind`: creates a kind of a scope over a registered
 *          recipient model, archives it, and drafts and publishes its criteria (the @stackra/rules rule set whose
 *          published revision grants it automatically).
 * Boundary: a `CrudService<AwardKind>`, so every read and write runs in the caller's transaction and scope session.
 *           Which kinds exist, their levels and their criteria are data a seed pack or an admin writes through here,
 *           never code (ADR 0363). Criteria live in @stackra/rules (`RuleSetService`), checked against the recipient
 *           model's `Rules`; a kind with levels takes no criteria, since a match names no level.
 * Runtime: node
 * Governing contract: ADR 0368 (decisions 1, 2 and 4); ADR 0331 (decisions 5 and 9); ADR 0363 (decision 2); ADR 0105
 *                     as amended by ADR 0294.
 */
import { InputInvalidError } from "@stackra/actions";
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { CrudService } from "@stackra/database";
import type { RuleSetService } from "@stackra/rules/node";

import { recipientRulesOf } from "#node/functions/recipient-rules-of.function";
import type { AwardKind } from "#node/models/award-kind.model";

/** A kind key: snake_case, up to 63 characters. */
const KIND_KEY = /^[a-z][a-z0-9_]{0,62}$/;

/**
 * Keeps award kinds and their criteria.
 *
 * @example
 * const kind = await kinds.create(scope, { key: "employee_of_month", name, recipient: "workforce.member", isOncePerPeriod: true });
 * const revision = await kinds.draftCriteria(kind.id, input.condition);
 * await kinds.publishCriteria(kind.id, revision);
 */
export class AwardKindService extends CrudService<AwardKind> {
  /** Keeps the kinds' criteria. */
  private readonly ruleSets: RuleSetService;

  /**
   * @param ruleSets - the rule set service of @stackra/rules.
   */
  constructor(ruleSets: RuleSetService) {
    super();
    this.ruleSets = ruleSets;
  }

  /**
   * A new, active kind of `scope` granted to records of the registered model `draft.recipient`, with no criteria.
   *
   * @throws InputInvalidError naming each bad field: `recipient: recipient_unknown`, `key: key_invalid`,
   *         `levels: levels_invalid` (a blank or repeated level), `levels: levels_too_few` (ascending with fewer than
   *         two).
   */
  async create(
    scope: ScopeRef,
    draft: {
      readonly key: string;
      readonly name: string;
      readonly recipient: string;
      readonly levels?: readonly string[];
      readonly isAscending?: boolean;
      readonly isOncePerPeriod?: boolean;
      readonly certificateTemplate?: string | null;
    },
  ): Promise<AwardKind> {
    recipientRulesOf(draft.recipient);
    const levels = draft.levels ?? [];
    const isAscending = draft.isAscending ?? false;
    const fieldErrors: Record<string, string> = {};
    if (!KIND_KEY.test(draft.key)) fieldErrors["key"] = "key_invalid";
    const distinct = new Set(levels.map((level) => level.trim().toLowerCase()));
    if (levels.some((level) => level.trim() === "") || distinct.size !== levels.length)
      fieldErrors["levels"] = "levels_invalid";
    else if (isAscending && levels.length < 2) fieldErrors["levels"] = "levels_too_few";
    if (Object.keys(fieldErrors).length > 0) throw InputInvalidError.create({}, { fieldErrors });
    return this.insert({
      scopeId: scope.id,
      scopePath: scope.path,
      key: draft.key,
      name: draft.name,
      recipientModel: draft.recipient,
      levels,
      isAscending,
      isOncePerPeriod: draft.isOncePerPeriod ?? false,
      ruleSetId: null,
      certificateTemplate: draft.certificateTemplate ?? null,
      isActive: true,
    });
  }

  /**
   * Stops granting the kind; its awards stay.
   *
   * @throws NotFoundError when the kind is not visible.
   */
  async archive(kindId: PublicId<"awk">): Promise<void> {
    await this.update({ id: kindId }, { isActive: false });
  }

  /**
   * Stores `condition`, checked against the recipient model's fields, as the kind's next draft criteria revision,
   * opening the kind's rule set on the first draft.
   *
   * @returns the revision's number.
   * @throws InputInvalidError for a kind with levels (`criteria: criteria_with_levels`).
   * @throws ConditionInvalidError when `condition` does not check (see `RuleSetService.draft`).
   * @throws NotFoundError when the kind is not visible.
   */
  async draftCriteria(kindId: PublicId<"awk">, condition: unknown): Promise<number> {
    const kind = await this.findOneOrFail({ id: kindId });
    if (kind.levels.length > 0)
      throw InputInvalidError.create({}, { fieldErrors: { criteria: "criteria_with_levels" } });
    const rules = recipientRulesOf(kind.recipientModel);
    if (kind.ruleSetId === null)
      kind.ruleSetId = (
        await this.ruleSets.open({ id: kind.scopeId, path: kind.scopePath }, rules)
      ).id;
    return this.ruleSets.draft(kind.ruleSetId, rules, condition);
  }

  /**
   * Publishes revision `revision` of the kind's criteria; later `AwardService.consider` calls grant by it.
   *
   * @throws InputInvalidError when the kind has no criteria drafted (`criteria: criteria_missing`).
   * @throws NotFoundError when the kind or the revision is not visible.
   */
  async publishCriteria(kindId: PublicId<"awk">, revision: number): Promise<void> {
    const kind = await this.findOneOrFail({ id: kindId });
    if (kind.ruleSetId === null)
      throw InputInvalidError.create({}, { fieldErrors: { criteria: "criteria_missing" } });
    await this.ruleSets.publish(kind.ruleSetId, revision);
  }
}
