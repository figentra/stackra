/**
 * Stackra file contract:
 * Purpose: `ChecklistService`, the module service over `Checklist`, the checklist engine: seeds a product's checklist
 *          template (`workflow-template:<product>:<name>`) into a scope, applies an industry profile at sign-up,
 *          stores a scope's customization (unlocked steps hidden and reordered), completes a step for the scope or for
 *          a user, and shows a checklist as one user sees it.
 * Boundary: a `CrudService<Checklist>` that injects `Repository<ChecklistProgress>`, so every read and write runs in the
 *           caller's transaction and scope session under row-level security. Templates, lock flags and profiles are
 *           seed data; this service holds no step of its own. A new template version moves the scope's copy forward
 *           and keeps its customization; a profile never overwrites a scope's own customization. Completing a step
 *           records `ChecklistStepCompleted` once, and `ChecklistCompleted` when it leaves every visible step done for
 *           the completer; the permission to complete a step is the calling action's.
 * Runtime: node
 * Governing contract: ADR 0424 (decisions 1 to 4); config-model sections 5 and 6; RV-22; ADR 0270 (decision 2); ADR
 *                     0327 (decisions 3 and 9).
 */
import type { Actor, PublicId, ScopeRef } from "@stackra/contracts";
import { CrudService, type Repository } from "@stackra/database";

import { CHECKLIST_TEMPLATE_SCHEMA } from "#core/constants/checklist-template-schema.constant";
import { INDUSTRY_PROFILE_SCHEMA } from "#core/constants/industry-profile-schema.constant";
import { ChecklistAudience } from "#core/enums/checklist-audience.enum";
import { SeedResult } from "#core/enums/seed-result.enum";
import { ChecklistInvalidError } from "#core/errors/checklist-invalid.error";
import { ChecklistCompleted } from "#core/events/checklist-completed.event";
import { ChecklistStepCompleted } from "#core/events/checklist-step-completed.event";
import { checkCustomization } from "#core/functions/check-customization.function";
import { checklistView } from "#core/functions/checklist-view.function";
import type { ChecklistView } from "#core/types/checklist-view.type";
import type { Checklist } from "#node/models/checklist.model";
import type { ChecklistProgress } from "#node/models/checklist-progress.model";

/**
 * Keeps a scope's checklists and their progress.
 *
 * @example
 * await checklists.seed(scope, ONBOARDING_TEMPLATE);
 * await checklists.applyProfile(scope, SALON_PROFILE);
 * await checklists.complete(checklist.id, "connect_payments", ctx.actor);
 * const view = await checklists.view(checklist.id, ctx.actor.id);
 */
export class ChecklistService extends CrudService<Checklist> {
  /** Each completed step. */
  private readonly progress: Repository<ChecklistProgress>;

  /** @param progress - the completed steps of every checklist, one row per step and owner. */
  constructor(progress: Repository<ChecklistProgress>) {
    super();
    this.progress = progress;
  }

  /**
   * Seeds `template` (a `ChecklistTemplate$` document) into `scope`: creates the scope's copy the first time, and
   * moves it to a new template version later, keeping the scope's customization.
   *
   * @throws ZodError when `template` is not a checklist template.
   */
  async seed(scope: ScopeRef, template: unknown): Promise<SeedResult> {
    const parsed = CHECKLIST_TEMPLATE_SCHEMA.parse(template);
    const known = await this.findOne({ scopeId: scope.id, key: parsed.key });
    if (known === null) {
      await this.insert({
        scopeId: scope.id,
        scopePath: scope.path,
        key: parsed.key,
        template: parsed,
      });
      return SeedResult.Created;
    }
    if (known.template.version === parsed.version) return SeedResult.Current;
    known.template = parsed;
    return SeedResult.Updated;
  }

  /**
   * Applies `profile` (an `IndustryProfile$` document) to the scope's seeded checklists it names, at sign-up: a
   * checklist the scope already customized, or that is not seeded, is left as it is.
   *
   * @returns the keys of the checklists it shaped.
   * @throws ZodError when `profile` is not an industry profile; ChecklistInvalidError when its customization does not
   *         fit a seeded template (a pack bug).
   */
  async applyProfile(scope: ScopeRef, profile: unknown): Promise<string[]> {
    const parsed = INDUSTRY_PROFILE_SCHEMA.parse(profile);
    const applied: string[] = [];
    for (const [key, customization] of Object.entries(parsed.checklists)) {
      // oxlint-disable-next-line no-await-in-loop -- checklists are shaped one after another in the caller's transaction
      const checklist = await this.findOne({ scopeId: scope.id, key });
      if (checklist === null || checklist.customized) continue;
      const checked = checkCustomization(checklist.template, customization);
      checklist.hidden = checked.hidden;
      checklist.order = checked.order;
      checklist.profile = parsed.key;
      applied.push(key);
    }
    return applied;
  }

  /**
   * Stores the scope's own customization of a checklist: the unlocked steps it hides and their order.
   *
   * @throws NotFoundError when no visible checklist has the id.
   * @throws ChecklistInvalidError when it hides or orders a locked, unknown or repeated step.
   */
  async customize(checklistId: PublicId<"wfc">, customization: unknown): Promise<void> {
    const checklist = await this.findOneOrFail({ id: checklistId });
    const checked = checkCustomization(checklist.template, customization);
    checklist.hidden = checked.hidden;
    checklist.order = checked.order;
    checklist.customized = true;
  }

  /**
   * Completes `step` for the scope (a scope step) or for `actor` (a user step), once.
   *
   * @returns whether this call completed it (false when it was already done).
   * @throws NotFoundError when no visible checklist has the id.
   * @throws ChecklistInvalidError when the template has no such step (`step_unknown`).
   */
  async complete(checklistId: PublicId<"wfc">, step: string, actor: Actor): Promise<boolean> {
    const checklist = await this.findOneOrFail({ id: checklistId });
    const declared = checklist.template.steps.find((candidate) => candidate.key === step);
    if (declared === undefined)
      throw ChecklistInvalidError.create({}, { fieldErrors: { step: "step_unknown" } });
    const isUser = declared.audience === ChecklistAudience.User;
    const ownerId = isUser ? actor.id : checklist.scopeId;
    if ((await this.progress.findOne({ checklistId, step, ownerId })) !== null) return false;
    await this.progress.insert({
      scopeId: checklist.scopeId,
      scopePath: checklist.scopePath,
      checklistId,
      step,
      ownerId,
      completedBy: actor,
    });
    checklist.record(
      ChecklistStepCompleted.create({
        checklistId,
        key: checklist.key,
        step,
        userId: isUser ? actor.id : null,
      }),
    );
    const hasUserSteps = checklist.template.steps.some(
      (candidate) => candidate.audience === ChecklistAudience.User,
    );
    const done = await this.doneFor(checklist, actor.id);
    if (checklistView(checklist.template, checklist, new Set([...done, step])).complete)
      checklist.record(
        ChecklistCompleted.create({
          checklistId,
          key: checklist.key,
          userId: hasUserSteps ? actor.id : null,
        }),
      );
    return true;
  }

  /**
   * The checklist as `userId` sees it: the scope's customization, the scope's progress on scope steps and the
   * user's own on user steps.
   *
   * @throws NotFoundError when no visible checklist has the id.
   */
  async view(checklistId: PublicId<"wfc">, userId: string): Promise<ChecklistView> {
    const checklist = await this.findOneOrFail({ id: checklistId });
    return checklistView(checklist.template, checklist, await this.doneFor(checklist, userId));
  }

  /** The step keys done for `userId`: scope steps done by the scope, user steps done by the user. */
  private async doneFor(checklist: Checklist, userId: string): Promise<Set<string>> {
    const rows = await this.progress.find({
      checklistId: checklist.id,
      ownerId: { $in: [checklist.scopeId, userId] },
    });
    const audienceOf = new Map(checklist.template.steps.map((step) => [step.key, step.audience]));
    return new Set(
      rows
        .filter((row) =>
          audienceOf.get(row.step) === ChecklistAudience.User
            ? row.ownerId === userId
            : row.ownerId === checklist.scopeId,
        )
        .map((row) => row.step),
    );
  }
}
