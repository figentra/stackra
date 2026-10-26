/**
 * Stackra file contract:
 * Purpose: unit tests of `CommentService`: a post opens a thread, writes the comment with `CommentCreated`, a mention row
 *          and `MentionCreated` per target; a reply reuses and reopens its thread; the level and mention floors and the
 *          directory refuse; an edit keeps a revision and announces only added targets; a tombstone hides the text and
 *          drops mentions; a held comment is not changed; a resolve stamps the thread; the reads and `viewOf`.
 * Boundary: test only; a fake `Database.current()` hands out an in-memory entity manager, the directory is the memory
 *           driver and the clock is fixed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0433 (decisions 1 to 5).
 */
import type { Clock, PublicId, ScopeRef } from "@stackra/contracts";
import {
  connectHoldRegistry,
  Database,
  RecordHeldError,
  registerModelPartners,
} from "@stackra/database";
import type { HoldRegistry } from "@stackra/database/contracts";
import { NotFoundError } from "@stackra/errors";
import { takeRecordedEvents } from "@stackra/events";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CommentVisibility, MentionKind, ThreadStatus } from "#contracts/index";
import {
  CommentCreated,
  CommentTombstonedError,
  CommentVisibilityNotAllowedError,
  MentionCreated,
  MentionNotAllowedError,
} from "#core/index";
import { Comment } from "#node/models/comment.model";
import { CommentMention } from "#node/models/comment-mention.model";
import { CommentRevision } from "#node/models/comment-revision.model";
import { CommentThread } from "#node/models/comment-thread.model";
import { CommentService } from "#node/services/comment.service";
import { MemoryMentionDirectoryDriver } from "#testing/drivers/memory-mention-directory.driver";

registerModelPartners([[CommentService, Comment]]);

const ACME: ScopeRef = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1" as PublicId<"scp">,
  path: "platform.acme",
};
const AT = new Date("2026-10-26T09:00:00Z");
const MATTER = { model: "legal.matter", id: "mat_01j9z3k4m5n6p7q8r9s0t1v2w4" };
const RULES = { sharedComments: true, assistantHandle: "Tamo" };
const MONA = { kind: MentionKind.Member, id: "usr_mona" };
const OMAR = { kind: MentionKind.Member, id: "usr_omar" };
const CLIENT = { kind: MentionKind.ExternalParticipant, id: "prt_client" };

/** Whether `row` matches every key of `where`. */
const matches = (row: object, where: object): boolean =>
  Object.entries(where).every(([key, value]) => (row as Record<string, unknown>)[key] === value);

/** A service over an in-memory entity manager. */
function setup() {
  const stores = new Map<unknown, object[]>([
    [Comment, []],
    [CommentThread, []],
    [CommentRevision, []],
    [CommentMention, []],
  ]);
  const storeOf = (model: unknown): object[] => stores.get(model) ?? [];
  let next = 0;
  const em = {
    create: vi.fn((Type: new () => object, data: object) => {
      next += 1;
      const prefix = new Map<unknown, string>([
        [Comment, "cmt"],
        [CommentThread, "cth"],
        [CommentRevision, "cmr"],
        [CommentMention, "cmn"],
      ]).get(Type);
      // A well-formed public id: the events parse their ids.
      const row = Object.assign(
        new Type(),
        { id: `${prefix}_${String(next).padStart(26, "0")}`, createdAt: AT },
        data,
      );
      storeOf(Type).push(row);
      return row;
    }),
    find: vi.fn(async (model: unknown, where: object) =>
      storeOf(model).filter((row) => matches(row, where)),
    ),
    findOne: vi.fn(
      async (model: unknown, where: object) =>
        storeOf(model).find((row) => matches(row, where)) ?? null,
    ),
    findOneOrFail: vi.fn(async (model: unknown, where: object) => {
      const row = storeOf(model).find((candidate) => matches(candidate, where));
      if (row === undefined) throw NotFoundError.create();
      return row;
    }),
    remove: vi.fn((row: object) => {
      const store = storeOf(row.constructor);
      store.splice(store.indexOf(row), 1);
    }),
    flush: vi.fn(async () => undefined),
  };
  vi.spyOn(Database, "current").mockReturnValue({
    em: () => em as unknown as ReturnType<Database["em"]>,
  } as unknown as Database);
  const service = new CommentService(new MemoryMentionDirectoryDriver([MONA, OMAR, CLIENT]), {
    now: () => AT,
  } as unknown as Clock);
  return { service, stores, em };
}

/** A post by `usr_lead` with `mentions`. */
const draft = (mentions = [MONA], visibility: CommentVisibility = CommentVisibility.Internal) => ({
  record: MATTER,
  body: "Please review clause 4",
  visibility,
  mentions,
  isExternalAuthor: false,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe(CommentService, () => {
  it("opens a thread and records the comment and its mentions", async () => {
    const { service, stores } = setup();
    const comment = await service.post(ACME, draft([MONA, MONA]), "usr_lead", RULES);
    const [thread] = stores.get(CommentThread) as CommentThread[];
    expect(thread).toMatchObject({ recordModel: MATTER.model, status: ThreadStatus.Open });
    expect(comment).toMatchObject({ threadId: thread?.id, authorId: "usr_lead", mentions: [MONA] });
    expect(stores.get(CommentMention)).toHaveLength(1);
    const events = takeRecordedEvents(comment);
    expect(events[0]).toBeInstanceOf(CommentCreated);
    expect(events[1]).toBeInstanceOf(MentionCreated);
    expect(events).toHaveLength(2);
  });

  it("replies in a thread, reopening it, and refuses a thread of another record", async () => {
    const { service, stores } = setup();
    const first = await service.post(ACME, draft([]), "usr_lead", RULES);
    await service.resolveThread(first.threadId, "usr_lead");
    const [thread] = stores.get(CommentThread) as CommentThread[];
    expect(thread).toMatchObject({ status: ThreadStatus.Resolved, resolvedAt: AT });
    await service.post(ACME, { ...draft([]), threadId: first.threadId }, "usr_mona", RULES);
    expect(thread).toMatchObject({ status: ThreadStatus.Open, resolvedAt: null });
    expect(stores.get(CommentThread)).toHaveLength(1);
    await expect(
      service.post(
        ACME,
        { ...draft([]), record: { ...MATTER, id: "mat_2" }, threadId: first.threadId },
        "usr_mona",
        RULES,
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("enforces the level and mention floors and the directory", async () => {
    const { service } = setup();
    await expect(
      service.post(ACME, { ...draft([]), isExternalAuthor: true }, "prt_client", RULES),
    ).rejects.toBeInstanceOf(CommentVisibilityNotAllowedError);
    await expect(
      service.post(ACME, draft([], CommentVisibility.Shared), "usr_lead", {
        ...RULES,
        sharedComments: false,
      }),
    ).rejects.toBeInstanceOf(CommentVisibilityNotAllowedError);
    await expect(service.post(ACME, draft([CLIENT]), "usr_lead", RULES)).rejects.toBeInstanceOf(
      MentionNotAllowedError,
    );
    await expect(
      service.post(ACME, draft([{ kind: MentionKind.Member, id: "usr_gone" }]), "usr_lead", RULES),
    ).rejects.toBeInstanceOf(MentionNotAllowedError);
    await expect(
      service.post(ACME, draft([CLIENT], CommentVisibility.Shared), "usr_lead", RULES),
    ).resolves.toMatchObject({ visibility: CommentVisibility.Shared });
  });

  it("edits with a revision and announces only added targets", async () => {
    const { service, stores } = setup();
    const comment = await service.post(ACME, draft([MONA]), "usr_lead", RULES);
    takeRecordedEvents(comment);
    await service.edit(comment.id, "Clause 5, sorry", [MONA, OMAR], "usr_lead", RULES);
    expect(comment).toMatchObject({ body: "Clause 5, sorry", editedAt: AT });
    expect(stores.get(CommentRevision)).toEqual([
      expect.objectContaining({ body: "Please review clause 4", editedBy: "usr_lead" }),
    ]);
    expect(stores.get(CommentMention)).toHaveLength(2);
    const events = takeRecordedEvents(comment) as MentionCreated[];
    expect(events.map((event) => event.targetId)).toEqual(["usr_omar"]);
    await expect(service.history(comment.id)).resolves.toHaveLength(1);
  });

  it("tombstones once, hiding text, mentions and history, and refuses an edit after", async () => {
    const { service, stores } = setup();
    const comment = await service.post(ACME, draft([MONA]), "usr_lead", RULES);
    await service.tombstone(comment.id, "usr_lead");
    await service.tombstone(comment.id, "usr_other");
    expect(comment).toMatchObject({ tombstonedAt: AT, tombstonedBy: "usr_lead", mentions: [] });
    expect(stores.get(CommentMention)).toEqual([]);
    expect(service.viewOf(comment)).toMatchObject({ body: null, mentions: [] });
    await expect(service.history(comment.id)).resolves.toEqual([]);
    await expect(service.edit(comment.id, "x", [], "usr_lead", RULES)).rejects.toBeInstanceOf(
      CommentTombstonedError,
    );
  });

  it("reads threads, comments and a target's mentions", async () => {
    const { service, em } = setup();
    const comment = await service.post(ACME, draft([MONA]), "usr_lead", RULES);
    await expect(service.threadsOf(MATTER)).resolves.toHaveLength(1);
    await expect(service.commentsOf(comment.threadId)).resolves.toEqual([comment]);
    await expect(service.mentionsOf(MONA)).resolves.toHaveLength(1);
    expect(service.viewOf(comment)).toMatchObject({ body: "Please review clause 4" });
    expect(em.flush).toHaveBeenCalled();
  });
});

describe("CommentService under a legal hold", () => {
  afterEach(() => {
    connectHoldRegistry(undefined);
  });

  it("refuses to edit or tombstone a held comment", async () => {
    const { service } = setup();
    const comment = await service.post(ACME, draft([]), "usr_lead", RULES);
    connectHoldRegistry({
      heldAmong: async (_model: unknown, ids: readonly string[]) => new Set(ids),
    } as unknown as HoldRegistry);
    await expect(service.edit(comment.id, "x", [], "usr_lead", RULES)).rejects.toBeInstanceOf(
      RecordHeldError,
    );
    await expect(service.tombstone(comment.id, "usr_lead")).rejects.toBeInstanceOf(RecordHeldError);
    expect(comment.tombstonedAt).toBeNull();
  });
});
