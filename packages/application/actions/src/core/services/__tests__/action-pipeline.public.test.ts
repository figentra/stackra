/**
 * Stackra file contract:
 * Purpose: unit tests of `public` in `ActionPipeline` (STA-2646 B1): an `api_client` caller reaches only a `public`
 *          operation and only with a key; a publishable key calls a public write only when it opts in, and a read
 *          unless it opts out; the descriptor carries the key and what it must hold, exact-only for a gated operation;
 *          every other caller still goes by `actors`.
 * Boundary: test only; every port is a stand-in in a map resolver, and AccessControl records what it was asked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0278 (amendment of 2026-11-09); ADR 0098 (the `api_client` actor).
 */
import { type AnyClass, Driver } from "@stackra/container";
import { type Actor, ActorKind, AssuranceLevel, Clock } from "@stackra/contracts";
import { ForbiddenError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { AccessControl, IdempotencyStore } from "#contracts/index";
import type { CallCredential, CallDescriptor } from "#contracts/index";
import { Action } from "#core/bases/action.base";
import { MemoryIdempotencyStoreDriver } from "#core/drivers/memory-idempotency-store.driver";
import { IdempotencyKeyRequiredError } from "#core/errors/idempotency-key-required.error";
import { Query } from "#core/bases/query.base";
import { ActionPipeline } from "#core/services/action-pipeline.service";
import type { Resolver } from "#core/types/resolver.type";

const NOW = new Date("2026-11-09T10:00:00.000Z");
const merchant: Actor = { kind: ActorKind.ApiClient, id: "prn_key", scopeId: "scp_tenant" };
const KEY: CallCredential = {
  kind: "api_key",
  id: "key_1",
  scopes: ["payments.payment.read", "payments.refund.create"],
  publishable: false,
  versionPin: "2026-11-09",
};

class FixedClock extends Clock {
  now(): Date {
    return new Date(NOW);
  }
}

class RecordingAccess extends Driver(AccessControl) {
  readonly calls: CallDescriptor[] = [];

  async require(call: CallDescriptor): Promise<void> {
    this.calls.push(call);
  }

  async authorize(): Promise<void> {}
}

/** A read open to keys. */
class GetPaymentQuery extends Query({
  key: "payment.get",
  actors: [ActorKind.User],
  public: { scopes: ["payments.payment.read"] },
}) {
  async handle(): Promise<{ ok: true }> {
    return { ok: true };
  }
}

/** A write open to keys, secret keys only by default. */
class CreateRefundAction extends Action({
  key: "refund.create",
  actors: [ActorKind.User],
  public: { scopes: ["payments.refund.create"] },
}) {
  async handle(): Promise<{ ok: true }> {
    return { ok: true };
  }
}

/** A write a publishable key may call. */
class TrackVisitAction extends Action({
  key: "visit.track",
  actors: [ActorKind.User],
  public: { scopes: ["payments.payment.read"], publishable: true },
}) {
  async handle(): Promise<{ ok: true }> {
    return { ok: true };
  }
}

/** A step-up write: a selector on a key never covers it. */
class ResolvePaymentAction extends Action({
  key: "payment.resolve",
  actors: [ActorKind.User],
  stepUp: AssuranceLevel.Aal2,
  public: { scopes: ["payments.payment.resolve"] },
}) {
  async handle(): Promise<{ ok: true }> {
    return { ok: true };
  }
}

/** A public write that counts its effects, for the idempotency rules of a key caller. */
class IssueRefundAction extends Action({
  key: "refund.issue",
  actors: [ActorKind.User],
  public: { scopes: ["payments.refund.create"] },
}) {
  issued = 0;

  async handle(): Promise<{ count: number }> {
    this.issued += 1;
    return { count: this.issued };
  }
}

/** Not public: a key never reaches it. */
class CloseAccountAction extends Action({
  key: "account.close",
  actors: [ActorKind.User],
}) {
  async handle(): Promise<{ ok: true }> {
    return { ok: true };
  }
}

function setup() {
  const access = new RecordingAccess();
  const refunds = new IssueRefundAction();
  const map = new Map<AnyClass, object>([
    [Clock, new FixedClock()],
    [IdempotencyStore, new MemoryIdempotencyStoreDriver(new FixedClock())],
    [IssueRefundAction, refunds],
    [AccessControl, access],
    [GetPaymentQuery, new GetPaymentQuery()],
    [CreateRefundAction, new CreateRefundAction()],
    [TrackVisitAction, new TrackVisitAction()],
    [ResolvePaymentAction, new ResolvePaymentAction()],
    [CloseAccountAction, new CloseAccountAction()],
  ]);
  const resolver: Resolver = {
    has: (token) => map.has(token),
    get: <T extends object>(token: AnyClass<T>): T => map.get(token) as T,
  };
  return { pipeline: new ActionPipeline(resolver), access, refunds };
}

describe("ActionPipeline public", () => {
  it("lets a key call a public operation and hands AccessControl the key and what it must hold", async () => {
    const { pipeline, access } = setup();
    await expect(
      pipeline.execute(GetPaymentQuery, {}, { actor: merchant, credential: KEY }),
    ).resolves.toEqual({ ok: true });
    expect(access.calls.at(-1)).toMatchObject({
      credential: { id: "key_1", publishable: false },
      public: { scopes: ["payments.payment.read"], exactOnly: true },
    });
  });

  it("refuses a key on an operation that is not public, before any access check", async () => {
    const { pipeline, access } = setup();
    await expect(
      pipeline.execute(CloseAccountAction, {}, { actor: merchant, credential: KEY }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(access.calls).toHaveLength(0);
  });

  it("refuses an api_client call that carries no key", async () => {
    const { pipeline } = setup();
    await expect(pipeline.execute(GetPaymentQuery, {}, { actor: merchant })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("refuses a publishable key on a write unless the write opts in, and admits it on a read", async () => {
    const { pipeline } = setup();
    const browser = {
      actor: merchant,
      credential: { ...KEY, publishable: true },
      idempotencyKey: "k-visit",
    };
    await expect(pipeline.execute(CreateRefundAction, {}, browser)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(pipeline.execute(TrackVisitAction, {}, browser)).resolves.toEqual({ ok: true });
    await expect(pipeline.execute(GetPaymentQuery, {}, browser)).resolves.toEqual({ ok: true });
  });

  it("marks a step-up operation exact-only, so a selector on a key never covers it", async () => {
    const { pipeline, access } = setup();
    await pipeline.execute(
      ResolvePaymentAction,
      {},
      { actor: merchant, credential: KEY, idempotencyKey: "k-resolve" },
    );
    expect(access.calls.at(-1)?.public).toEqual({
      scopes: ["payments.payment.resolve"],
      exactOnly: true,
    });
  });

  it("requires a key on a key caller's write, and keeps a key per API key and mode", async () => {
    const { pipeline, refunds } = setup();
    await expect(
      pipeline.execute(IssueRefundAction, {}, { actor: merchant, credential: KEY }),
    ).rejects.toBeInstanceOf(IdempotencyKeyRequiredError);
    const live = { actor: merchant, credential: KEY, idempotencyKey: "k1" };
    expect(await pipeline.execute(IssueRefundAction, {}, live)).toEqual({ count: 1 });
    expect(await pipeline.execute(IssueRefundAction, {}, live)).toEqual({ count: 1 });
    // The same string from the principal's test key, or from another of its keys, is another answer.
    expect(await pipeline.execute(IssueRefundAction, {}, { ...live, sandbox: true })).toEqual({
      count: 2,
    });
    expect(
      await pipeline.execute(
        IssueRefundAction,
        {},
        { ...live, credential: { ...KEY, id: "key_2" } },
      ),
    ).toEqual({ count: 3 });
    expect(refunds.issued).toBe(3);
  });

  it("keeps the declared policy for any other caller: a user's write runs without a key", async () => {
    const { pipeline, refunds } = setup();
    const user: Actor = { kind: ActorKind.User, id: "usr_1", scopeId: "scp_tenant" };
    await pipeline.execute(IssueRefundAction, {}, { actor: user });
    await pipeline.execute(IssueRefundAction, {}, { actor: user });
    expect(refunds.issued).toBe(2);
  });
});
