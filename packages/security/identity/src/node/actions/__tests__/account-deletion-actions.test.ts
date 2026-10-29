/**
 * Stackra file contract:
 * Purpose: unit tests of account deletion: the user calls are the caller's own and no tool, asking needs a step-up;
 *          asking schedules the deletion a grace period out and is idempotent; cancelling removes it; another actor or
 *          a call on someone's behalf is refused; the job queues the privacy erasure of due deletions only, defers a
 *          held subject by a day, never calls the identity provider itself (the `SubjectErased` listener removes the provider
 *          user after the saga), and does nothing on a second run.
 * Boundary: test only; the memory driver stands in for the store, a stub for privacy's hold check.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; App Store Review Guideline 5.1.1(v); STA-1567.
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { ActorKind, AssuranceLevel, Logger, Realm } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import { ForbiddenError } from "@stackra/errors";
import type { SubjectHolds } from "@stackra/privacy/contracts";
import { EraseSubjectAction } from "@stackra/privacy/node";
import { describe, expect, Fake, it } from "@stackra/testing";
import { vi } from "vitest";

import { IdentityConfig } from "#config/identity.config";
import { MemoryAccountDeletionsDriver } from "#core/drivers/memory-account-deletions.driver";
import { AccountDeletionCancelled } from "#core/events/account-deletion-cancelled.event";
import { AccountDeletionScheduled } from "#core/events/account-deletion-scheduled.event";
import { AccountDeletionStarted } from "#core/events/account-deletion-started.event";
import { CancelAccountDeletionAction } from "#node/actions/cancel-account-deletion.action";
import { DeleteMyAccountAction } from "#node/actions/delete-my-account.action";
import { EraseDueAccountsAction } from "#node/actions/erase-due-accounts.action";
import { ShowAccountDeletionQuery } from "#node/queries/show-account-deletion.query";
import { AccountDeletionInput } from "#node/schemas/account-deletion-input.schema";

const NOW = new Date("2026-10-29T09:00:00.000Z");
const DUE = "2026-11-28T09:00:00.000Z";
const AFTER = new Date("2026-11-28T10:00:00.000Z");
const INPUT = AccountDeletionInput.create({});
const USER = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"usr">;
const OTHER = "usr_01j9z3k4m5n6p7q8r9s0t1v2w4" as PublicId<"usr">;

/** Records every log line; the methods are left to the spies. */
class LoggerFake extends Fake.of(Logger) {
  declare debug: Logger["debug"];

  declare info: Logger["info"];

  declare warn: Logger["warn"];

  declare error: Logger["error"];
}

/** A user call context for `id` at `now`. */
function userCtx(id: PublicId<"usr"> = USER, now = NOW, onBehalfOf?: PublicId<"usr">) {
  const actor = {
    kind: ActorKind.User,
    id,
    realm: Realm.Staff,
    ...(onBehalfOf === undefined
      ? {}
      : { onBehalfOf: { kind: ActorKind.User, id: onBehalfOf, realm: Realm.Staff } }),
  };
  return fakeActionContext({ actor, now: () => now } as never);
}

/** The store, the actions and a job whose hold check holds `held`. */
function setup(held: readonly string[] = []) {
  const deletions = new MemoryAccountDeletionsDriver();
  const config = buildConfig(IdentityConfig);
  const holds = { isHeld: async (subject: string) => held.includes(subject) } as SubjectHolds;
  const logger = new LoggerFake();
  return {
    deletions,
    logger,
    request: new DeleteMyAccountAction(deletions, config),
    cancel: new CancelAccountDeletionAction(deletions),
    show: new ShowAccountDeletionQuery(deletions),
    job: new EraseDueAccountsAction(deletions, holds, logger),
  };
}

/** A job context at `now` that records each queued job. */
function jobCtx(now = AFTER) {
  const dispatch = vi.fn(async () => undefined);
  return { dispatch, ctx: fakeActionContext({ now: () => now, dispatch } as never) };
}

describe("account deletion", () => {
  it("keeps the user calls the caller's own and no tool, asks a step-up to delete, and runs the job as the system", () => {
    for (const kind of [
      DeleteMyAccountAction,
      CancelAccountDeletionAction,
      ShowAccountDeletionQuery,
    ]) {
      const options = kindOf(kind)?.options;
      expect(options?.["actors"]).toEqual([ActorKind.User]);
      expect(options?.["tool"]).toBe(false);
    }
    expect(kindOf(DeleteMyAccountAction)?.options?.["stepUp"]).toBe(AssuranceLevel.Aal2);
    expect(kindOf(CancelAccountDeletionAction)?.options?.["stepUp"]).toBeUndefined();
    expect(kindOf(EraseDueAccountsAction)?.options?.["actors"]).toEqual([ActorKind.System]);
    expect(kindOf(EraseDueAccountsAction)?.options?.["job"]).toMatchObject({
      cron: { perScope: true },
    });
  });

  it("schedules the caller's own deletion after the grace period and records it", async () => {
    const { request, show, deletions } = setup();
    const ctx = userCtx();
    const output = await request.handle(INPUT, ctx);
    expect(output).toMatchObject({ requestedAt: NOW.toISOString(), dueAt: DUE });
    expect((await deletions.find(USER))?.erasureId).toMatch(/^era_/);
    expect(await deletions.find(OTHER)).toBeUndefined();
    expect(ctx.recorded.published).toEqual([
      AccountDeletionScheduled.create({ subject: USER, dueAt: DUE }),
    ]);
    expect((await show.handle(INPUT, userCtx())).dueAt).toBe(DUE);
    expect((await show.handle(INPUT, userCtx(OTHER))).dueAt).toBeNull();
  });

  it("answers the same date when asked again, recording nothing", async () => {
    const { request } = setup();
    await request.handle(INPUT, userCtx());
    const again = userCtx(USER, new Date("2026-10-30T09:00:00.000Z"));
    expect((await request.handle(INPUT, again)).dueAt).toBe(DUE);
    expect(again.recorded.published).toEqual([]);
  });

  it("refuses a call made on someone else's behalf", async () => {
    const { request, cancel, deletions } = setup();
    await expect(request.handle(INPUT, userCtx(USER, NOW, OTHER))).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(cancel.handle(INPUT, userCtx(USER, NOW, OTHER))).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(await deletions.find(USER)).toBeUndefined();
  });

  it("cancels within the grace period, and cancelling nothing records nothing", async () => {
    const { request, cancel, deletions } = setup();
    await request.handle(INPUT, userCtx());
    const ctx = userCtx();
    expect(await cancel.handle(INPUT, ctx)).toMatchObject({ requestedAt: null, dueAt: null });
    expect(await deletions.find(USER)).toBeUndefined();
    expect(ctx.recorded.published).toEqual([
      AccountDeletionCancelled.create({ subject: USER, at: NOW.toISOString() }),
    ]);
    const again = userCtx();
    await cancel.handle(INPUT, again);
    expect(again.recorded.published).toEqual([]);
  });

  it("queues the erasure of due deletions only, and leaves the provider user to the erasure's listener", async () => {
    const { request, job, deletions } = setup();
    await request.handle(INPUT, userCtx());
    await request.handle(INPUT, userCtx(OTHER, new Date("2026-11-20T09:00:00.000Z")));
    const erasureId = (await deletions.find(USER))?.erasureId ?? "";
    const { dispatch, ctx } = jobCtx();
    expect(await job.handle(INPUT, ctx)).toMatchObject({ started: 1, held: 0 });
    expect(dispatch).toHaveBeenCalledExactlyOnceWith(EraseSubjectAction, {
      erasureId,
      subject: USER,
    });
    expect(ctx.recorded.published).toEqual([
      AccountDeletionStarted.create({ subject: USER, erasureId }),
    ]);
    expect(await deletions.find(USER)).toBeUndefined();
    expect(await deletions.find(OTHER)).toBeDefined();
    // The job takes no IdpAdmin: the provider user goes only on SubjectErased (EndErasedSubjectSessionsListener).
    expect(EraseDueAccountsAction.length).toBe(3);
  });

  it("defers a subject a legal hold names by a day, so it leaves the batch, and starts nothing twice", async () => {
    const { request, job, deletions, logger } = setup([USER]);
    await request.handle(INPUT, userCtx());
    const erasureId = (await deletions.find(USER))?.erasureId;
    const held = jobCtx();
    expect(await job.handle(INPUT, held.ctx)).toMatchObject({ started: 0, held: 1 });
    expect(held.dispatch).not.toHaveBeenCalled();
    expect((await deletions.find(USER))?.dueAt).toEqual(new Date(AFTER.getTime() + 86_400_000));
    expect(await deletions.due(AFTER, 100)).toEqual([]);
    expect(logger.warn).toHaveBeenCalledWith("identity.account_deletion.held", { erasureId });

    const free = setup();
    await free.request.handle(INPUT, userCtx());
    await free.job.handle(INPUT, jobCtx().ctx);
    const second = jobCtx();
    expect(await free.job.handle(INPUT, second.ctx)).toMatchObject({ started: 0, held: 0 });
    expect(second.dispatch).not.toHaveBeenCalled();
  });
});
