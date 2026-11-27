/**
 * Stackra file contract:
 * Purpose: unit tests of `inspectionSetup`: a set `DATABASE_URL` (or a non-dev environment) passes through untouched;
 *          in local dev with nothing set it asks `encore db conn-uri` for the database gen declared and hands the
 *          answer on in the environment; a folder that is not a member, a member with no Encore database and an
 *          Encore without the local database are refused with the fix.
 * Boundary: test only; each case builds a throwaway member folder, and the process runner is a fake.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5); STA-2906.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { CommandIo } from "@stackra/console";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { inspectionSetup } from "#node/functions/inspection-setup.function";

const folders: string[] = [];

afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

/** A workspace with `services/notes`, which declares the Encore database `database` when given. */
function workspace(database?: string): string {
  const root = mkdtempSync(join(tmpdir(), "stackra-cli-inspect-"));
  folders.push(root);
  const member = join(root, "services", "notes");
  mkdirSync(join(member, "stackra-encore", "notes"), { recursive: true });
  writeFileSync(join(member, "package.json"), '{"name":"notes"}');
  if (database !== undefined)
    writeFileSync(
      join(member, "stackra-encore", "notes", "database.ts"),
      `export const database = new SQLDatabase("${database}", {\n  migrations: { path: "./migrations" },\n});\n`,
    );
  return root;
}

/** An io in `cwd` whose process answers `encore …` with `code` and `output`. */
function ioAt(cwd: string, code = 0, output = "") {
  const run = vi.fn(async () => ({ code, output }));
  return { io: { cwd, process: { run } } as unknown as CommandIo, run };
}

describe("inspectionSetup", () => {
  it("passes a set DATABASE_URL through without asking Encore", async () => {
    const root = workspace("notes");
    const { io, run } = ioAt(root);
    const env = { DATABASE_URL: "postgres://localhost/notes" };
    expect(await inspectionSetup(io, "services/notes", env)).toEqual({
      cwd: join(root, "services", "notes"),
      env,
    });
    expect(run).not.toHaveBeenCalled();
  });

  it("leaves a non-dev environment to the inspection, which refuses it", async () => {
    const { io, run } = ioAt(workspace("notes"));
    const env = { STACKRA_ENVIRONMENT: "production" };
    expect((await inspectionSetup(io, "services/notes", env)).env).toBe(env);
    expect(run).not.toHaveBeenCalled();
  });

  it("asks Encore for the local database gen declared, in the member's folder", async () => {
    const root = workspace("notes");
    const { io, run } = ioAt(
      root,
      0,
      "postgresql://app:local@127.0.0.1:9500/notes?sslmode=disable\n",
    );
    const { env } = await inspectionSetup(io, "services/notes", { HOME: "/home/dev" });
    expect(env).toEqual({
      HOME: "/home/dev",
      DATABASE_URL: "postgresql://app:local@127.0.0.1:9500/notes?sslmode=disable",
    });
    expect(run).toHaveBeenCalledWith("encore", ["db", "conn-uri", "notes"], {
      cwd: join(root, "services", "notes"),
      check: false,
    });
  });

  it("refuses a folder that is not a member", async () => {
    const { io } = ioAt(workspace("notes"));
    await expect(inspectionSetup(io, "services/none", {})).rejects.toThrow(
      "services/none is not a member folder",
    );
  });

  it("refuses a member with no Encore database, naming the fix", async () => {
    const { io } = ioAt(workspace());
    await expect(inspectionSetup(io, "services/notes", {})).rejects.toThrow(
      "declares no Encore database",
    );
  });

  it("refuses when Encore has no local database running", async () => {
    const { io } = ioAt(workspace("notes"), 1, "error: app not running\n");
    await expect(inspectionSetup(io, "services/notes", {})).rejects.toThrow(
      "Encore has no local notes database to read",
    );
  });
});
