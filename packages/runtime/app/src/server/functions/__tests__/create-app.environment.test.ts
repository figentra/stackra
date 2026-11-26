/**
 * Stackra file contract:
 * Purpose: unit tests of the server `createApp` with a provided runtime environment (STA-1571): a deployed runtime
 *          with no `STACKRA_ENVIRONMENT` (Encore Cloud cannot set one) boots as its deployed environment, so an action
 *          with no `AuditTrail` bound is refused and never runs; a local runtime boots as `dev` and runs it unaudited;
 *          a deployed runtime that names `dev` fails boot; with no runtime provided the variable's own default holds.
 * Boundary: test only; boots real containers with the `@stackra/actions` audit config row gen writes; the process's
 *           `STACKRA_ENVIRONMENT` is stubbed and the provided runtime reset after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0212 (decisions 1 and 4); ADR 0295 (decision 8).
 */
import { Action, ActionPipeline, AuditConfig } from "@stackra/actions";
import { AccessControl } from "@stackra/actions/contracts";
import { ConfigInvalidError } from "@stackra/config";
import { Driver, Module } from "@stackra/container";
import type { Wiring } from "@stackra/container";
import { type Actor, ActorKind, Realm } from "@stackra/contracts";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RUNTIME_ENVIRONMENT_HOST } from "#server/constants/runtime-environment-host.constant";
import { createApp } from "#server/functions/create-app.function";
import { provideRuntimeEnvironment } from "#server/functions/provide-runtime-environment.function";

const user: Actor = { kind: ActorKind.User, id: "usr_1", realm: Realm.Customer, scopeId: "ten_1" };

/** Allows every call. */
class AllowAll extends Driver(AccessControl) {
  async require(): Promise<void> {}

  async authorize(): Promise<void> {}
}

/** A write that counts its runs. */
class SaveNoteAction extends Action({
  key: "note.save",
  actors: [ActorKind.User],
  idempotency: "never",
}) {
  static runs = 0;

  async handle(): Promise<{ saved: true }> {
    SaveNoteAction.runs += 1;
    return { saved: true };
  }
}

class NotesModule extends Module({}) {}

const wiring: Wiring = {
  member: "notes",
  root: NotesModule,
  modules: { notes: { exports: [], dependsOn: [], type: NotesModule } },
  bindings: [{ module: "notes", kind: "action", provide: SaveNoteAction }],
  drivers: [{ port: AccessControl, candidates: { allow: () => Promise.resolve(AllowAll) } }],
  config: [{ key: "actions.audit", provide: AuditConfig }],
};

/** Boots the app, runs the action once and closes; the outcome and the running environment. */
async function saveNote(): Promise<{ environment: string; outcome: unknown }> {
  const app = await createApp(NotesModule, { wiring });
  try {
    return await app.handlers.run(async (container) => ({
      environment: container.get(AuditConfig).environment,
      outcome: await new ActionPipeline(container)
        .execute(SaveNoteAction, {}, { actor: user })
        .catch((error: unknown) => error),
    }));
  } finally {
    await app.close();
  }
}

describe("createApp (server) running environment", () => {
  beforeEach(() => {
    vi.stubEnv("STACKRA_ENVIRONMENT", undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    RUNTIME_ENVIRONMENT_HOST.current = undefined;
    SaveNoteAction.runs = 0;
  });

  it("refuses an unaudited action on a deployed runtime that sets no STACKRA_ENVIRONMENT", async () => {
    provideRuntimeEnvironment({ name: "acme-prod", type: "production", cloud: "encore" });
    const { environment, outcome } = await saveNote();
    expect(environment).toBe("production");
    expect(outcome).toBeInstanceOf(Error);
    expect((outcome as Error).message).toContain("AuditTrail is not bound in production");
    expect(SaveNoteAction.runs).toBe(0);
  });

  it("runs it unaudited on a local runtime, as dev", async () => {
    provideRuntimeEnvironment({ name: "local", type: "development", cloud: "local" });
    expect(await saveNote()).toEqual({ environment: "dev", outcome: { saved: true } });
    expect(SaveNoteAction.runs).toBe(1);
  });

  it("fails boot on a deployed runtime that names dev", async () => {
    vi.stubEnv("STACKRA_ENVIRONMENT", "dev");
    provideRuntimeEnvironment({ name: "production", type: "production", cloud: "aws" });
    await expect(createApp(NotesModule, { wiring })).rejects.toThrow(ConfigInvalidError);
  });

  it("keeps the variable's own default with no runtime provided (a hand-built app)", async () => {
    expect((await saveNote()).environment).toBe("dev");
  });
});
