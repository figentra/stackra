/**
 * Stackra file contract:
 * Purpose: `AutomationService`, the module service over `Automation`, the automation document kind: opens an
 *          automation in a scope, stores a checked document as its next draft revision, dry-runs a revision (which
 *          publishing requires), publishes a revision with the principal it runs as, reads a revision, lists the
 *          published automations a trigger starts, and seeds the default automations of a versioned workflow template
 *          pack into a scope.
 * Boundary: a `CrudService<Automation>` that injects `Repository<Revision>` (content's `HasRevisions` table), so every
 *           read and write runs in the caller's transaction and scope session under row-level security. A revision is
 *           never changed: an edit is a new draft, whose document version is its revision number, so a run pins to
 *           it. Publishing needs a dry run of that same revision (ADR 0122 decision 3); the approval at L2 and the
 *           audit are the publishing action's (its permission's risk), and the principal is the caller's choice,
 *           never more than the publisher (ADR 0153). A seed marks the revisions it writes and never writes over an
 *           automation whose latest revision is the tenant's.
 * Runtime: node
 * Governing contract: ADR 0122 (decision 3); ADR 0153 (decision 2); ADR 0270 (decisions 2 and 6); ADR 0321 (decision
 *                     2); ADR 0327 (decisions 3 and 9); config-model sections 5 and 6 (workflow templates ship as
 *                     versioned seed documents; a new seed version never overwrites tenant values).
 */
import type { Revision } from "@stackra/content/node";
import type { Actor, PublicId, ScopeRef } from "@stackra/contracts";
import { CrudService, type Repository, UniqueViolation } from "@stackra/database";
import { NotFoundError } from "@stackra/errors";

import { WORKFLOW_TEMPLATE_PACK_SCHEMA } from "#core/constants/workflow-template-pack-schema.constant";
import { SeedResult } from "#core/enums/seed-result.enum";
import { AutomationChangedError } from "#core/errors/automation-changed.error";
import { AutomationInvalidError } from "#core/errors/automation-invalid.error";
import { AutomationNotDryRunError } from "#core/errors/automation-not-dry-run.error";
import { checkAutomation } from "#core/functions/check-automation.function";
import { dryRun } from "#core/functions/dry-run.function";
import type { AutomationDocument } from "#core/types/automation-document.type";
import type { DryRun } from "#core/types/dry-run.type";
import type { Automation } from "#node/models/automation.model";
import type { AutomationRevision } from "#node/types/automation-revision.type";
import type { TriggeredAutomation } from "#node/types/triggered-automation.type";

/** The model key an automation's revisions are stored under in `content.revisions`. */
const MODEL = "workflow.automation";

/**
 * Keeps automations and their revisions.
 *
 * @example
 * const automation = await automations.open(scope, "commerce.cod_confirmation");
 * const revision = await automations.draft(automation.id, input.document);
 * await automations.dryRun(automation.id, revision, input.sample, ctx.now());
 * await automations.publish(automation.id, revision, principal);
 */
export class AutomationService extends CrudService<Automation> {
  /** Content's revisions table. */
  private readonly revisions: Repository<Revision>;

  /** @param revisions - the revisions of every `HasRevisions` model, one row per revision. */
  constructor(revisions: Repository<Revision>) {
    super();
    this.revisions = revisions;
  }

  /** A new automation keyed `key` at `scope`, with no revision yet. */
  open(scope: ScopeRef, key: string): Promise<Automation> {
    return this.insert({ scopeId: scope.id, scopePath: scope.path, key });
  }

  /**
   * Stores `document`, checked against the registry, as the automation's next revision, a draft.
   *
   * @returns the new revision's number, which is also the stored document's version.
   * @throws NotFoundError when no visible automation has the id.
   * @throws AutomationInvalidError when the document does not check, or names another key (`key_mismatch`).
   * @throws AutomationChangedError when another draft took the number first; a retry takes the next one.
   */
  async draft(automationId: PublicId<"wfa">, document: unknown): Promise<number> {
    const automation = await this.findOneOrFail({ id: automationId });
    const checked = checkAutomation(document);
    if (checked.key !== automation.key)
      throw AutomationInvalidError.create({}, { fieldErrors: { key: "key_mismatch" } });
    return this.write(automation, checked);
  }

  /**
   * Dry-runs revision `number` on `input` at `now`, and records that it was, so the revision may be published.
   *
   * @throws NotFoundError when the automation or the revision is not visible.
   * @throws AutomationInvalidError when the stored document no longer checks (a block it names is gone).
   */
  async dryRun(
    automationId: PublicId<"wfa">,
    number: number,
    input: unknown,
    now: Date,
  ): Promise<DryRun> {
    const automation = await this.findOneOrFail({ id: automationId });
    const revision = await this.revision(automationId, number);
    const report = dryRun(revision.document, input, { now });
    automation.dryRunRevision = number;
    return report;
  }

  /**
   * Makes revision `number` the one in force, run as `principal`; publishing an older revision rolls back to it.
   *
   * @throws NotFoundError when the automation or the revision is not visible.
   * @throws AutomationNotDryRunError when the last dry run was not of this revision.
   */
  async publish(automationId: PublicId<"wfa">, number: number, principal: Actor): Promise<void> {
    const automation = await this.findOneOrFail({ id: automationId });
    if (automation.dryRunRevision !== number)
      throw AutomationNotDryRunError.create({ automationId, revision: number });
    await this.release(automation, number, principal);
  }

  /**
   * Revision `number` of the automation, or the published one when `number` is left out.
   *
   * @throws NotFoundError when there is no such revision, or none is published.
   */
  async revision(automationId: PublicId<"wfa">, number?: number): Promise<AutomationRevision> {
    const wanted = number ?? (await this.findOneOrFail({ id: automationId })).publishedRevision;
    if (wanted === null) throw NotFoundError.create();
    const row = await this.revisions.findOne({
      model: MODEL,
      recordId: automationId,
      number: wanted,
    });
    if (row === null) throw NotFoundError.create();
    return {
      number: row.number,
      // reason: `draft` stored a checked document, and a run checks it again when it starts
      document: row.data["document"] as AutomationDocument,
      publishedAt: row.publishedAt,
    };
  }

  /** The published automations of the session's scopes that `block` (a trigger block key) starts. */
  async triggered(block: string): Promise<TriggeredAutomation[]> {
    const automations = await this.find({ trigger: block, publishedRevision: { $ne: null } });
    if (automations.length === 0) return [];
    const rows = await this.revisions.find({
      model: MODEL,
      recordId: { $in: automations.map((automation) => automation.id) },
      publishedAt: { $ne: null },
    });
    return automations.flatMap((automation) => {
      const row = rows.find(
        (candidate) =>
          candidate.recordId === automation.id && candidate.number === automation.publishedRevision,
      );
      return row === undefined || automation.principal === null
        ? []
        : [
            {
              automationId: automation.id,
              // reason: `draft` stored a checked document
              document: row.data["document"] as AutomationDocument,
              principal: automation.principal,
            },
          ];
    });
  }

  /**
   * Seeds `template` of pack version `version` into `scope`, run as `principal`: creates and publishes it the first
   * time, and later drafts and publishes the new version only while the latest revision is a seed's, so a tenant's
   * edit stands.
   *
   * @throws AutomationInvalidError when the template does not check against the registry.
   */
  async seed(
    scope: ScopeRef,
    template: unknown,
    version: string,
    principal: Actor,
  ): Promise<SeedResult> {
    const checked = checkAutomation(template);
    const known = await this.findOne({ scopeId: scope.id, key: checked.key });
    if (known === null) {
      const automation = await this.insert({
        scopeId: scope.id,
        scopePath: scope.path,
        key: checked.key,
        seedVersion: version,
      });
      await this.release(automation, await this.write(automation, checked, version), principal);
      return SeedResult.Created;
    }
    if (known.seedVersion === version) return SeedResult.Current;
    const [latest] = await this.revisions.find(
      { model: MODEL, recordId: known.id },
      { orderBy: { number: "desc" }, limit: 1 },
    );
    if (latest !== undefined && latest.data["seed"] === undefined) return SeedResult.Kept;
    await this.release(known, await this.write(known, checked, version), principal);
    known.seedVersion = version;
    return SeedResult.Updated;
  }

  /**
   * Seeds every template of `pack` (a `WorkflowTemplatePack$` document) into `scope`, run as `principal`.
   *
   * @returns each template key with what seeding it did.
   * @throws ZodError when `pack` is not a workflow template pack; AutomationInvalidError for a template that does not
   *         check.
   */
  async seedPack(
    scope: ScopeRef,
    pack: unknown,
    principal: Actor,
  ): Promise<Record<string, SeedResult>> {
    const parsed = WORKFLOW_TEMPLATE_PACK_SCHEMA.parse(pack);
    const results: Record<string, SeedResult> = {};
    for (const template of parsed.templates)
      // oxlint-disable-next-line no-await-in-loop -- templates seed one after another in the caller's transaction
      results[template.key] = await this.seed(scope, template, parsed.version, principal);
    return results;
  }

  /** Publishes revision `number` of `automation`, run as `principal`. */
  private async release(automation: Automation, number: number, principal: Actor): Promise<void> {
    const row = await this.revisions.findOneOrFail({
      model: MODEL,
      recordId: automation.id,
      number,
    });
    row.publishedAt = new Date();
    const document = row.data["document"] as AutomationDocument;
    automation.publishedRevision = number;
    automation.trigger = document.trigger?.block ?? null;
    automation.principal = principal;
  }

  /**
   * Stores `document` as the next revision of `automation`, its version set to that number, marked with the seed
   * version when a seed writes it.
   *
   * @throws AutomationChangedError when another draft took the number first.
   */
  private async write(
    automation: Automation,
    document: AutomationDocument,
    seedVersion?: string,
  ): Promise<number> {
    const number = (await this.revisions.count({ model: MODEL, recordId: automation.id })) + 1;
    try {
      await this.revisions.insert({
        scopeId: automation.scopeId,
        scopePath: automation.scopePath,
        model: MODEL,
        recordId: automation.id,
        number,
        data: {
          document: { ...document, version: number },
          ...(seedVersion === undefined ? {} : { seed: { version: seedVersion } }),
        },
      });
    } catch (error) {
      if (error instanceof UniqueViolation)
        throw AutomationChangedError.create({ automationId: automation.id });
      throw error;
    }
    return number;
  }
}
