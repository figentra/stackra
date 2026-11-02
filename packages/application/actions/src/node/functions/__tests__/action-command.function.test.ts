/**
 * Stackra file contract:
 * Purpose: proves `ActionCommand` derives its options from the input schema (kinds and bounds), runs the action as the
 *          signed-in `CommandActor` and returns its output (`--json` emits it unchanged), refuses a run with nobody
 *          signed in, refuses a missing required field with a usage error, and shows a pipeline refusal's message.
 * Boundary: unit test; a fake pipeline and container stand in for the runtime.
 * Runtime: node (vitest)
 * Governing contract: STA-1966 spec FR-022, FR-026, FR-027; ADR 0022 (test placement).
 */
// @covers sta-1966:FR-022 sta-1966:FR-026 sta-1966:FR-027
import { readCommand } from "@stackra/console";
import { runCommandForTest } from "@stackra/console/testing";
import type { Actor } from "@stackra/contracts";
import { ForbiddenError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";
import { Int, Schema, Str, registerSchemas } from "@stackra/validation";
import { vi } from "vitest";
import { z } from "zod";

import type { CommandActor } from "#contracts/ports/command-actor.port";
import type { ActionPipeline } from "#core/services/action-pipeline.service";
import { ActionCommand } from "#node/functions/action-command.function";

class FreezeAccountInput extends Schema {
  @Str({ min: 2 })
  reason!: string;

  @Int({
    min: 1,
    max: 30,
  })
  days?: number;
}

registerSchemas([
  [
    FreezeAccountInput,
    z.object({ reason: z.string(), days: z.number().optional(), force: z.boolean().optional() }),
  ],
]);

class FreezeAccountAction {}

class FreezeAccountCommand extends ActionCommand(FreezeAccountAction as never, FreezeAccountInput, {
  name: "account:freeze",
}) {}

const ACTOR = { kind: "user", id: "usr_1" } as unknown as Actor;

/** A run of `argv` with a fake pipeline and actor; `actor` undefined binds a port that is signed out. */
function run(
  argv: string[],
  execute: (...args: unknown[]) => Promise<unknown> = async () => ({ frozen: true }),
  actor: { current: () => Promise<Actor | undefined> } | null = { current: async () => ACTOR },
) {
  const pipeline = { execute } as unknown as ActionPipeline;
  return runCommandForTest([FreezeAccountCommand], argv, {
    container: () => ({
      get: (type: abstract new (...args: never[]) => object) =>
        Reflect.construct(type, [pipeline, (actor as unknown as CommandActor) ?? undefined]),
      close: async () => {},
    }),
  });
}

describe("ActionCommand", () => {
  it("takes its options from the input schema's fields", () => {
    const structure = readCommand(FreezeAccountCommand);
    const byProperty = Object.fromEntries(
      structure.options.map((field) => [field.property, field]),
    );
    expect(structure.name).toBe("account:freeze");
    expect(byProperty["reason"]).toMatchObject({ kind: "string", flag: "reason", min: 2 });
    expect(byProperty["days"]).toMatchObject({ kind: "integer", flag: "days", min: 1, max: 30 });
    expect(byProperty["force"]).toMatchObject({ kind: "boolean" });
  });

  it("runs the action as the signed-in actor and emits its output under --json", async () => {
    const execute = vi.fn(async () => ({ frozen: true }));
    const result = await run(
      ["account:freeze", "--reason", "fraud", "--days", "3", "--json"],
      execute,
    );
    expect(result.exitCode).toBe(0);
    expect(result.json).toEqual({ ok: true, data: { frozen: true } });
    expect(execute).toHaveBeenCalledWith(
      FreezeAccountAction,
      { reason: "fraud", days: 3 },
      { actor: ACTOR },
    );
  });

  it("refuses a run with no CommandActor bound", async () => {
    const execute = vi.fn();
    const result = await run(["account:freeze", "--reason", "fraud"], execute, null);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Sign in to run account:freeze");
    expect(execute).not.toHaveBeenCalled();
  });

  it("refuses a run when nobody is signed in", async () => {
    const result = await run(["account:freeze", "--reason", "fraud"], undefined, {
      current: async () => undefined,
    });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Sign in to run account:freeze");
  });

  it("exits 2 naming a missing required option", async () => {
    const result = await run(["account:freeze"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("--reason");
  });

  it("shows a pipeline refusal's message and exits 1", async () => {
    const refusal = ForbiddenError.create();
    const result = await run(["account:freeze", "--reason", "fraud"], async () => {
      throw refusal;
    });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(refusal.message);
  });
});
