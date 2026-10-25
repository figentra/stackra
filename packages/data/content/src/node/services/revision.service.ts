/**
 * Stackra file contract:
 * Purpose: `RevisionService`, the module service over `Revision` for `HasRevisions` and `Schedulable` models: drafts a
 *          numbered revision, publishes one, reads the current one, schedules one for a time (alone or in a
 *          campaign), publishes what is due, unschedules a campaign, and rolls back to the revision published before.
 * Boundary: a `CrudService<Revision>`, so every read and write runs in the caller's transaction and scope session; row
 *           level security limits the table to the session's granted subtrees. A preview is a read of a revision by
 *           number (`findOneOrFail`). Changes are written when the caller's unit of work commits. A revision's `data`
 *           is never changed: a change is a new draft. @stackra/scheduler only calls `publishDue` at its time; who may
 *           publish is the calling action's permission.
 * Runtime: node
 * Governing contract: ADR 0321 (decisions 2 and 6); ADR 0116 (decision CT3); ADR 0105 as amended by ADR 0294; ADR 0327
 *                     (decisions 3 and 9).
 */
import type { ScopeRef } from "@stackra/contracts";
import { CrudService } from "@stackra/database";
import { NotFoundError } from "@stackra/errors";

import type { Revision } from "#node/models/revision.model";

/**
 * Keeps the revisions of records.
 *
 * @example
 * const draft = await revisions.draft(ctx.scope, "catalogue.product", product.id, snapshot);
 * await revisions.schedule("catalogue.product", product.id, draft.number, blackFriday, "black_friday");
 * await revisions.publishDue(clock.now()); // from the tenant schedule
 */
export class RevisionService extends CrudService<Revision> {
  /** Adds the next numbered draft of `recordId` of `model`, holding `data`. */
  async draft(
    scope: ScopeRef,
    model: string,
    recordId: string,
    data: Readonly<Record<string, unknown>>,
  ): Promise<Revision> {
    const [latest] = await this.find(
      { model, recordId },
      { orderBy: { number: "desc" }, limit: 1 },
    );
    return this.create({
      scopeId: scope.id,
      scopePath: scope.path,
      model,
      recordId,
      number: (latest?.number ?? 0) + 1,
      data,
    });
  }

  /**
   * Makes revision `number` the current one from `at`; a scheduled revision is no longer scheduled.
   *
   * @throws NotFoundError when the record has no such revision.
   */
  async publish(model: string, recordId: string, number: number, at: Date): Promise<Revision> {
    const revision = await this.findOneOrFail({ model, recordId, number });
    revision.publishedAt = at;
    revision.scheduledAt = null;
    return revision;
  }

  /** The revision published last, which readers see; null while none is published. */
  async current(model: string, recordId: string): Promise<Revision | null> {
    const [revision] = await this.find(
      { model, recordId, publishedAt: { $ne: null } },
      { orderBy: { publishedAt: "desc" }, limit: 1 },
    );
    return revision ?? null;
  }

  /**
   * Schedules revision `number` to go live at `at`, in `campaign` when given.
   *
   * @throws NotFoundError when the record has no such revision.
   */
  async schedule(
    model: string,
    recordId: string,
    number: number,
    at: Date,
    campaign: string | null = null,
  ): Promise<Revision> {
    const revision = await this.findOneOrFail({ model, recordId, number });
    revision.scheduledAt = at;
    revision.campaign = campaign;
    return revision;
  }

  /** Clears the schedule of every revision of `campaign` not yet published; returns them. */
  async unschedule(campaign: string): Promise<Revision[]> {
    const revisions = await this.find({ campaign, publishedAt: null, scheduledAt: { $ne: null } });
    for (const revision of revisions) revision.scheduledAt = null;
    return revisions;
  }

  /** Publishes every scheduled revision whose time has come by `now`, at its scheduled time; returns them. */
  async publishDue(now: Date): Promise<Revision[]> {
    const due = await this.find(
      { publishedAt: null, scheduledAt: { $lte: now } },
      { orderBy: { scheduledAt: "asc" } },
    );
    for (const revision of due) {
      revision.publishedAt = revision.scheduledAt;
      revision.scheduledAt = null;
    }
    return due;
  }

  /**
   * Makes the revision published before the current one current again, from `at`.
   *
   * @throws NotFoundError when fewer than two revisions were ever published.
   */
  async rollback(model: string, recordId: string, at: Date): Promise<Revision> {
    const [, previous] = await this.find(
      { model, recordId, publishedAt: { $ne: null } },
      { orderBy: { publishedAt: "desc" }, limit: 2 },
    );
    if (previous === undefined) throw NotFoundError.create();
    previous.publishedAt = at;
    return previous;
  }
}
