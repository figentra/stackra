/**
 * Stackra file contract:
 * Purpose: unit tests of the audit step's fail-closed rule in `ActionPipeline` (STA-1571, on the one reader of
 *          STA-2844): in a deployed environment an action with no `AuditTrail` bound is an error before any step runs,
 *          so `handle` never runs and nothing is permitted. The environment is the bound `AuditConfig`'s, else the one
 *          reader's answer over the process environment: an unset `AuditConfig` field and a container with no
 *          `AuditConfig` are not exempt by themselves, and a misspelt runtime variable fails the call. In `dev` and
 *          `test`, and for a query, the call runs as before; with a trail bound every environment audits the success
 *          and the refusal.
 * Boundary: test only; every port is a stand-in in a map resolver; the config is built from a raw environment the test
 *           passes, and the process's `STACKRA_ENVIRONMENT` is stubbed and restored after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0212 (decisions 1 and 4); ADR 0138 (the audit around the steps);
 *                     ADR 0296 (amendment 2026-11-26: the environment comes from the runtime only).
 */
import { buildConfig, ConfigInvalidError } from "@stackra/config";
import { type AnyClass, Driver } from "@stackra/container";
import { type Actor, ActorKind, Clock, Realm } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { AuditConfig } from "#config/audit.config";
import { AccessControl, AuditTrail, IdempotencyStore } from "#contracts/index";
import type { AuditEntry, CallDescriptor } from "#contracts/index";
import { Action } from "#core/bases/action.base";
import { Query } from "#core/bases/query.base";
import { MemoryIdempotencyStoreDriver } from "#core/drivers/memory-idempotency-store.driver";
import { ActionPipeline } from "#core/services/action-pipeline.service";
import type { Resolver } from "#core/types/resolver.type";

const NOW = new Date("2026-11-26T10:00:00.000Z");
const user: Actor = {
  kind: ActorKind.User,
  id: "usr_1",
  realm: Realm.Customer,
  scopeId: "ten_1",
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

class Trail extends Driver(AuditTrail) {
  readonly entries: AuditEntry[] = [];

  async record(entry: AuditEntry): Promise<void> {
    this.entries.push(entry);
  }
}

class NoteTakenError extends Refusal({ kind: ErrorKind.Conflict }) {}

/** A write that counts its runs and refuses when asked. */
class SaveNoteAction extends Action({
  key: "note.save",
  actors: [ActorKind.User],
}) {
  runs = 0;

  async handle(input: { taken?: boolean }): Promise<{ saved: true }> {
    this.runs += 1;
    if (input.taken === true) throw NoteTakenError.create();
    return { saved: true };
  }
}

/** A read: never audited, so never refused for a missing trail. */
class GetNoteQuery extends Query({
  key: "note.get",
  actors: [ActorKind.User],
}) {
  async handle(): Promise<{ text: string }> {
    return { text: "hello" };
  }
}

/**
 * A pipeline over stand-ins: `environment` builds an `AuditConfig` from that `STACKRA_ENVIRONMENT` (`null`: no config
 * bound; `undefined`: bound, the variable unset), and `trail` binds an `AuditTrail`.
 */
function setup(options: {
  readonly environment?: string | null | undefined;
  readonly trail?: boolean;
}) {
  const access = new RecordingAccess();
  const save = new SaveNoteAction();
  const trail = new Trail();
  const map = new Map<AnyClass, object>([
    [Clock, new FixedClock()],
    [AccessControl, access],
    [IdempotencyStore, new MemoryIdempotencyStoreDriver(new FixedClock())],
    [SaveNoteAction, save],
    [GetNoteQuery, new GetNoteQuery()],
  ]);
  if (options.environment !== null)
    map.set(
      AuditConfig,
      buildConfig(AuditConfig, {
        env: options.environment === undefined ? {} : { STACKRA_ENVIRONMENT: options.environment },
      }),
    );
  if (options.trail === true) map.set(AuditTrail, trail);
  const resolver: Resolver = {
    has: (token) => map.has(token),
    get: <T extends object>(token: AnyClass<T>): T => map.get(token) as T,
  };
  return { pipeline: new ActionPipeline(resolver), access, save, trail };
}

describe("ActionPipeline audit (STA-1571)", () => {
  beforeEach(() => {
    vi.stubEnv("STACKRA_ENVIRONMENT", undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(["production", "staging", "preview"])(
    "refuses an action with no AuditTrail in %s, before any step runs",
    async (environment) => {
      const { pipeline, access, save } = setup({ environment });
      await expect(pipeline.execute(SaveNoteAction, {}, { actor: user })).rejects.toThrow(
        `AuditTrail is not bound in ${environment}: bind an AuditTrail driver`,
      );
      expect(save.runs).toBe(0);
      expect(access.calls).toEqual([]);
    },
  );

  it("still answers a query with no AuditTrail in production: reads are not audited here", async () => {
    const { pipeline } = setup({ environment: "production" });
    await expect(pipeline.execute(GetNoteQuery, {}, { actor: user })).resolves.toEqual({
      text: "hello",
    });
  });

  it.each(["dev", "test"])("runs an action with no AuditTrail in %s", async (environment) => {
    const { pipeline, save } = setup({ environment });
    await expect(pipeline.execute(SaveNoteAction, {}, { actor: user })).resolves.toEqual({
      saved: true,
    });
    expect(save.runs).toBe(1);
  });

  it("asks the one reader when the bound AuditConfig is unset: dev only where the runtime says so", async () => {
    const dev = setup({ environment: undefined });
    await expect(dev.pipeline.execute(SaveNoteAction, {}, { actor: user })).resolves.toEqual({
      saved: true,
    });
    vi.stubEnv("STACKRA_ENVIRONMENT", "production");
    const deployed = setup({ environment: undefined });
    await expect(deployed.pipeline.execute(SaveNoteAction, {}, { actor: user })).rejects.toThrow(
      "AuditTrail is not bound in production",
    );
    expect(deployed.save.runs).toBe(0);
  });

  it("refuses with no AuditConfig bound (a wiring gen has not regenerated) when the runtime is deployed", async () => {
    vi.stubEnv("STACKRA_ENVIRONMENT", "staging");
    const { pipeline, save, access } = setup({ environment: null });
    await expect(pipeline.execute(SaveNoteAction, {}, { actor: user })).rejects.toThrow(
      "AuditTrail is not bound in staging",
    );
    expect(save.runs).toBe(0);
    expect(access.calls).toEqual([]);
  });

  it("runs with no AuditConfig bound only where the reader answers dev or test", async () => {
    const dev = setup({ environment: null });
    await dev.pipeline.execute(SaveNoteAction, {}, { actor: user });
    expect(dev.save.runs).toBe(1);
    vi.stubEnv("STACKRA_ENVIRONMENT", "test");
    const test = setup({ environment: null });
    await test.pipeline.execute(SaveNoteAction, {}, { actor: user });
    expect(test.save.runs).toBe(1);
  });

  it("fails the action closed on a misspelt runtime variable, never reading it as dev", async () => {
    vi.stubEnv("STACKRA_ENVIRONMENT", "prod");
    const { pipeline, save } = setup({ environment: null });
    await expect(pipeline.execute(SaveNoteAction, {}, { actor: user })).rejects.toThrow(
      ConfigInvalidError,
    );
    expect(save.runs).toBe(0);
    expect(() => setup({ environment: "prod" })).toThrow(ConfigInvalidError);
  });

  it("audits the success and the refusal in production when a trail is bound", async () => {
    const { pipeline, trail } = setup({ environment: "production", trail: true });
    await pipeline.execute(SaveNoteAction, {}, { actor: user });
    const refused = await pipeline
      .execute(SaveNoteAction, { taken: true }, { actor: user })
      .catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(NoteTakenError);
    expect(trail.entries.map((entry) => [entry.call.key, entry.outcome, entry.code])).toEqual([
      ["note.save", "ok", undefined],
      ["note.save", "refused", (refused as NoteTakenError).code],
    ]);
  });
});
