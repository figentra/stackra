/**
 * Stackra file contract:
 * Purpose: unit tests of `DevSecretsInitCommand` on the console: it writes the generated values with mode 600 and
 *          prints names, never a value; it lists the names that need a value; a second run with nothing missing is
 *          refused with exit 2; `--rotate` regenerates; `--from` copies a shared name.
 * Boundary: test only; the workspace root is a temporary folder and the declared rows are a stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0525 (amendment of 2026-11-10); STA-2679.
 */
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DevSecretsInitCommand } from "#node/commands/dev-secrets-init.command";
import { declaredDevSecrets } from "#node/dev-secrets/functions/declared-dev-secrets.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";

vi.mock("#node/dev-secrets/functions/declared-dev-secrets.function", () => ({
  declaredDevSecrets: vi.fn(),
}));
vi.mock("#node/functions/workspace-root.function", () => ({ workspaceRoot: vi.fn() }));

let root = "";

const row = (name: string, config = "identity") => ({
  name,
  kind: "secret",
  required: true,
  config,
  class: "C",
  field: "f",
});

const file = (): Record<string, string> =>
  JSON.parse(readFileSync(join(root, ".stackra", "dev-secrets.json"), "utf8")) as Record<
    string,
    string
  >;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - services/*\n");
  vi.mocked(workspaceRoot).mockReturnValue(root);
  vi.mocked(declaredDevSecrets).mockReturnValue([
    row("SESSION_SECRET"),
    row("DATABASE_URL"),
    row("STACKRA_EVENTS_SIGNING_KEY", "outbox.events_relay"),
  ]);
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("DevSecretsInitCommand", () => {
  it("writes the generated values with mode 600 and prints names, never a value", async () => {
    const result = await runCommandForTest([DevSecretsInitCommand], ["dev", "secrets", "init"]);
    expect(result.exitCode).toBe(0);
    const values = file();
    expect(Object.keys(values)).toEqual(["SESSION_SECRET"]);
    expect(values["SESSION_SECRET"]).toMatch(/^[\w-]{43}$/);
    expect(statSync(join(root, ".stackra", "dev-secrets.json")).mode & 0o777).toBe(0o600);
    expect(result.stdout).toContain("1 generated, 0 copied");
    expect(result.stdout).toContain("SESSION_SECRET");
    expect(result.stdout).toContain("DATABASE_URL");
    expect(result.stdout).toContain("STACKRA_EVENTS_SIGNING_KEY");
    expect(result.stdout).not.toContain(values["SESSION_SECRET"]);
  });

  it("returns the name lists under --json", async () => {
    const result = await runCommandForTest([DevSecretsInitCommand], ["dev:secrets:init", "--json"]);
    expect(result.json).toEqual({
      ok: true,
      data: {
        file: ".stackra/dev-secrets.json",
        generated: ["SESSION_SECRET"],
        copied: [],
        needsValue: ["DATABASE_URL", "STACKRA_EVENTS_SIGNING_KEY"],
        optional: [],
      },
    });
  });

  it("refuses a second run with nothing missing, and --rotate regenerates", async () => {
    await runCommandForTest([DevSecretsInitCommand], ["dev:secrets:init"]);
    const first = file()["SESSION_SECRET"];
    const again = await runCommandForTest([DevSecretsInitCommand], ["dev:secrets:init"]);
    expect(again.exitCode).toBe(2);
    // The error box wraps the message at its width, so each fragment is one that fits on a line.
    expect(again.stderr).toContain("already holds every generated name");
    expect(again.stderr).toContain("regenerates them");
    const rotated = await runCommandForTest(
      [DevSecretsInitCommand],
      ["dev:secrets:init", "--rotate"],
    );
    expect(rotated.exitCode).toBe(0);
    expect(file()["SESSION_SECRET"]).not.toBe(first);
  });

  it("copies a shared name from --from", async () => {
    const other = join(root, "other-dev-secrets.json");
    writeFileSync(other, JSON.stringify({ SESSION_SECRET: "shared-dev-value" }));
    const result = await runCommandForTest(
      [DevSecretsInitCommand],
      ["dev:secrets:init", "--from", other],
    );
    expect(result.exitCode).toBe(0);
    expect(file()).toEqual({ SESSION_SECRET: "shared-dev-value" });
    expect(result.stdout).toContain("0 generated, 1 copied");
    expect(result.stdout).not.toContain("shared-dev-value");
  });
});
