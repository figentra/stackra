/**
 * Stackra file contract:
 * Purpose: `SegmentService`, the module service over `Segment`: creates a segment over a registered subject model,
 *          drafts and publishes a dynamic segment's condition, adds and removes a manual segment's subjects, and
 *          recomputes membership: one segment in full, every dynamic segment of a scope (queued), or one subject in
 *          each dynamic segment over its model.
 * Boundary: a `CrudService<Segment>`, so every read and write runs in the caller's transaction and scope session.
 *           Conditions live in @stackra/rules (`RuleSetService`), checked against the subject's `Rules`; segments only
 *           evaluate the published revision against the facts the subject computes, with the clock's time as the
 *           current time, and own the outcome: membership (ADR 0331 decision 9). Publishing queues the segment's
 *           recompute in its scope in the same transaction; a revision published through `RuleSetService` directly is
 *           picked up by the next hourly recompute, because `RuleSetPublished` names no scope to recompute in. A
 *           dynamic segment with no published revision keeps its members. Subject classes are read from the container
 *           given to `connect`.
 * Runtime: node
 * Governing contract: ADR 0332 (decisions 1 to 5); ADR 0331 (decisions 5, 6 and 9); ADR 0327 (decisions 3 and 9);
 *                     ADR 0148 (decision 5); ADR 0105 as amended by ADR 0294.
 */
import { InputInvalidError, type Resolver } from "@stackra/actions";
import type { Clock, PublicId, ScopeRef } from "@stackra/contracts";
import { CrudService, type Database } from "@stackra/database";
import { isRefusal, NotFoundError } from "@stackra/errors";
import type { QueueService } from "@stackra/queue";
import { evaluate } from "@stackra/rules";
import type { RuleSetRevision, RuleSetService } from "@stackra/rules/node";

import { SegmentKind, type SegmentSubject, type SubjectRef } from "#contracts/index";
import { SegmentKindMismatchError } from "#core/index";
import { RecomputeSegmentsAction } from "#node/actions/recompute-segments.action";
import { SEGMENT_SUBJECTS } from "#node/constants/segment-subjects.constant";
import type { Segment } from "#node/models/segment.model";
import type { SegmentMembershipService } from "#node/services/segment-membership.service";

/** How many subjects one page of a full recompute reads and evaluates. */
const PAGE_SIZE = 500;

/** A segment's scope. */
const scopeOf = (segment: Segment): ScopeRef => ({ id: segment.scopeId, path: segment.scopePath });

/** A dynamic segment's rule set. */
function ruleSetOf(segment: Segment): PublicId<"rset"> {
  if (segment.ruleSetId === null)
    throw new TypeError(`The dynamic segment ${segment.id} has no rule set`);
  return segment.ruleSetId;
}

/**
 * Keeps segments and computes their membership.
 *
 * @example
 * const segment = await segments.create(scope, { name: "VIP", subject: "commerce.customer", kind: SegmentKind.Dynamic });
 * const revision = await segments.draft(segment.id, input.condition);
 * await segments.publish(segment.id, revision); // queues the recompute
 */
export class SegmentService extends CrudService<Segment> {
  /** Keeps the dynamic segments' conditions. */
  private readonly ruleSets: RuleSetService;

  /** Writes membership with its events. */
  private readonly memberships: SegmentMembershipService;

  /** Queues recomputes. */
  private readonly queue: QueueService;

  /** Opens a segment's scope session. */
  private readonly database: Database;

  /** The current time of an evaluation. */
  private readonly clock: Clock;

  /** Set by `connect`. */
  private resolver: Resolver | undefined;

  /**
   * @param ruleSets - the rule set service of @stackra/rules.
   * @param memberships - the membership service.
   * @param queue - the queue service.
   * @param database - the connected database.
   * @param clock - the clock.
   */
  constructor(
    ruleSets: RuleSetService,
    memberships: SegmentMembershipService,
    queue: QueueService,
    database: Database,
    clock: Clock,
  ) {
    super();
    this.ruleSets = ruleSets;
    this.memberships = memberships;
    this.queue = queue;
    this.database = database;
    this.clock = clock;
  }

  /** Reads the registered subject classes from `resolver` (the booted container or a testing app). */
  connect(resolver: Resolver): void {
    this.resolver = resolver;
  }

  /**
   * A new segment of `scope` over the subject model `draft.subject`; a dynamic one gets a rule set with no revision.
   *
   * @throws InputInvalidError when no registered subject has the key (`subject: subject_unknown`).
   */
  async create(
    scope: ScopeRef,
    draft: { readonly name: string; readonly subject: string; readonly kind: SegmentKind },
  ): Promise<Segment> {
    const subject = this.subjectOf(draft.subject);
    const ruleSet =
      draft.kind === SegmentKind.Dynamic ? await this.ruleSets.open(scope, subject.rules) : null;
    return this.insert({
      scopeId: scope.id,
      scopePath: scope.path,
      name: draft.name,
      subjectModel: draft.subject,
      kind: draft.kind,
      ruleSetId: ruleSet?.id ?? null,
      revision: null,
      computedAt: null,
    });
  }

  /**
   * Stores `condition`, checked against the subject's fields, as the dynamic segment's next draft revision.
   *
   * @returns the revision's number.
   * @throws SegmentKindMismatchError for a manual segment.
   * @throws ConditionInvalidError when `condition` does not check (see `RuleSetService.draft`).
   */
  async draft(segmentId: PublicId<"seg">, condition: unknown): Promise<number> {
    const segment = await this.ofKind(segmentId, SegmentKind.Dynamic);
    return this.ruleSets.draft(
      ruleSetOf(segment),
      this.subjectOf(segment.subjectModel).rules,
      condition,
    );
  }

  /**
   * Publishes revision `revision` of the dynamic segment's condition and queues its recompute in its scope; both commit
   * with the caller's transaction.
   *
   * @throws SegmentKindMismatchError for a manual segment.
   * @throws NotFoundError when the segment or the revision is not visible.
   */
  async publish(segmentId: PublicId<"seg">, revision: number): Promise<void> {
    const segment = await this.ofKind(segmentId, SegmentKind.Dynamic);
    await this.ruleSets.publish(ruleSetOf(segment), revision);
    await this.queue.push(RecomputeSegmentsAction, { segmentId }, { scope: scopeOf(segment) });
  }

  /**
   * Adds `subjectIds` to the manual segment, recording `MembershipEntered` for each that was not a member. Runs in the
   * caller's scope session, which must see the subjects.
   *
   * @throws SegmentKindMismatchError for a dynamic segment.
   * @throws InputInvalidError naming each id that is no subject (`subjectIds.<n>: subject_unknown`); nothing is added.
   */
  async add(segmentId: PublicId<"seg">, subjectIds: readonly string[]): Promise<void> {
    const segment = await this.ofKind(segmentId, SegmentKind.Manual);
    const known = await this.subjectOf(segment.subjectModel).facts(subjectIds);
    const fieldErrors = Object.fromEntries(
      subjectIds.flatMap((id, index) =>
        known.has(id) ? [] : [[`subjectIds.${index}`, "subject_unknown"] as const],
      ),
    );
    if (Object.keys(fieldErrors).length > 0) throw InputInvalidError.create({}, { fieldErrors });
    const members = await this.memberships.membersOf(segment, subjectIds);
    const current = new Set(members.map((row) => row.subjectId));
    await this.memberships.enter(
      segment,
      subjectIds.filter((id) => !current.has(id)),
    );
  }

  /**
   * Removes `subjectIds` from the manual segment, recording `MembershipLeft` for each that was a member.
   *
   * @throws SegmentKindMismatchError for a dynamic segment.
   */
  async remove(segmentId: PublicId<"seg">, subjectIds: readonly string[]): Promise<void> {
    const segment = await this.ofKind(segmentId, SegmentKind.Manual);
    await this.memberships.leave(await this.memberships.membersOf(segment, subjectIds));
  }

  /**
   * Queues a full recompute of every dynamic segment the running scope session sees, each in its own scope: the hourly
   * job of a scope, which catches up conditions on the time and revisions published elsewhere.
   *
   * @returns how many recomputes were queued.
   */
  async queueRecomputes(): Promise<number> {
    const segments = await this.find({ kind: SegmentKind.Dynamic });
    await Promise.all(
      segments.map((segment) =>
        this.queue.push(
          RecomputeSegmentsAction,
          { segmentId: segment.id },
          { scope: scopeOf(segment) },
        ),
      ),
    );
    return segments.length;
  }

  /**
   * Recomputes the dynamic segment's membership in full against its published revision, in the running scope session
   * (the job runs in the segment's scope), and records the revision and the time.
   *
   * @throws SegmentKindMismatchError for a manual segment.
   * @throws NotFoundError when the segment is not visible.
   */
  async recompute(segmentId: PublicId<"seg">): Promise<void> {
    await this.reconcile(await this.ofKind(segmentId, SegmentKind.Dynamic));
  }

  /**
   * Recomputes `subject`'s membership in every dynamic segment over its model that the running scope session sees,
   * each in the segment's own scope session.
   */
  async recomputeSubject(subject: SubjectRef): Promise<void> {
    const segments = await this.find({ subjectModel: subject.model, kind: SegmentKind.Dynamic });
    for (const segment of segments)
      // oxlint-disable-next-line no-await-in-loop -- reason: one scope session at a time in the caller's transaction
      await this.database.withScope(scopeOf(segment), () => this.reconcile(segment, [subject.id]));
  }

  /**
   * Brings `segment`'s membership in line with its published revision, for `subjectIds` or (left out) every subject,
   * and records the revision and time of a full pass.
   */
  private async reconcile(segment: Segment, subjectIds?: readonly string[]): Promise<void> {
    const revision = await this.publishedOf(segment);
    if (revision === undefined) return;
    const subject = this.subjectOf(segment.subjectModel);
    const now = this.clock.now();
    const options = { now, revision: revision.number };
    // shortcut: the matched ids and the current members of a full pass are held in memory, fine to about a million
    // subjects per segment; upgrade to a staged table diffed in SQL when an audience grows past that.
    const matched = new Set<string>();
    const test = async (ids: readonly string[]): Promise<void> => {
      if (ids.length === 0) return;
      for (const [id, facts] of await subject.facts(ids))
        if (evaluate(subject.rules, revision.condition, facts, options).matched) matched.add(id);
    };
    if (subjectIds === undefined) {
      let after: string | null = null;
      let page: readonly string[];
      do {
        // oxlint-disable-next-line no-await-in-loop -- reason: a page starts after the last id of the one before
        page = await subject.ids(after, PAGE_SIZE);
        // oxlint-disable-next-line no-await-in-loop -- reason: one page of facts at a time bounds memory
        await test(page);
        after = page.at(-1) ?? null;
      } while (page.length === PAGE_SIZE);
    } else await test(subjectIds);
    const members = await this.memberships.membersOf(segment, subjectIds);
    const current = new Set(members.map((row) => row.subjectId));
    await this.memberships.enter(
      segment,
      [...matched].filter((id) => !current.has(id)),
    );
    await this.memberships.leave(members.filter((row) => !matched.has(row.subjectId)));
    if (subjectIds !== undefined) return;
    segment.revision = revision.number;
    segment.computedAt = now;
  }

  /** The segment's published revision, or `undefined` while none is published. */
  private async publishedOf(segment: Segment): Promise<RuleSetRevision | undefined> {
    try {
      return await this.ruleSets.revision(ruleSetOf(segment));
    } catch (error) {
      if (isRefusal(error, NotFoundError)) return undefined;
      throw error;
    }
  }

  /**
   * The segment `segmentId`, refused unless it is of `kind`.
   *
   * @throws NotFoundError when it is not visible.
   * @throws SegmentKindMismatchError when it is of the other kind.
   */
  private async ofKind(segmentId: PublicId<"seg">, kind: SegmentKind): Promise<Segment> {
    const segment = await this.findOneOrFail({ id: segmentId });
    if (segment.kind !== kind)
      throw SegmentKindMismatchError.create({ segmentId, segmentKind: segment.kind });
    return segment;
  }

  /**
   * The registered subject of model key `key`, from the connected container.
   *
   * @throws InputInvalidError when no subject has the key.
   * @throws Error before `connect`.
   */
  private subjectOf(key: string): SegmentSubject {
    const entry = SEGMENT_SUBJECTS.get(key);
    if (entry === undefined)
      throw InputInvalidError.create({}, { fieldErrors: { subject: "subject_unknown" } });
    if (this.resolver === undefined)
      throw new Error(
        "SegmentService is not connected: the boot calls segments.connect(container) before a segment is used",
      );
    return this.resolver.get(entry.type);
  }
}
