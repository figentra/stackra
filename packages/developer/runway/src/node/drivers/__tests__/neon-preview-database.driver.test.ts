/**
 * Stackra file contract:
 * Purpose: unit tests of `NeonPreviewDatabaseDriver`: create runs `neonctl branches create` from the parent only when
 *          the branch is missing, remove runs `neonctl branches delete` only when it exists (both read the list in
 *          either output shape), and the connection string is neonctl's trimmed answer.
 * Boundary: test only; the command runner is a fake, nothing runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0238 (decision 1), ADR 0352 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { PreviewDatabaseBrancher } from "#core/ports/preview-database-brancher.port";
import { NeonPreviewDatabaseDriver } from "#node/drivers/neon-preview-database.driver";
import type { CommandRunner } from "#node/types/command-runner.type";

const DATABASE = {
  from: "branch",
  provider: "neon",
  project: "acme-db",
  parent: "main",
  name: "preview-feat-x",
} as const;

/** A driver whose runner records every call and answers `list` with `branches`. */
function driver(branches: unknown): {
  neon: NeonPreviewDatabaseDriver;
  calls: Parameters<CommandRunner>[];
} {
  const calls: Parameters<CommandRunner>[] = [];
  const neon = new NeonPreviewDatabaseDriver();
  neon.run = async (command, args, options) => {
    calls.push([command, args, options]);
    if (args[0] === "branches" && args[1] === "list") return JSON.stringify(branches);
    if (args[0] === "connection-string") return "postgresql://u:p@ep-1.neon.tech/app\n";
    return "";
  };
  return { neon, calls };
}

describe("NeonPreviewDatabaseDriver", () => {
  it("is the neon driver of the brancher port", () => {
    const { neon } = driver([]);
    expect(neon).toBeInstanceOf(PreviewDatabaseBrancher);
    expect(neon.provider).toBe("neon");
  });

  it("creates a missing branch from its parent and skips an existing one", async () => {
    const missing = driver([{ name: "main" }]);
    await missing.neon.create(DATABASE);
    expect(missing.calls.at(-1)).toEqual([
      "neonctl",
      [
        "branches",
        "create",
        "--project-id",
        "acme-db",
        "--name",
        "preview-feat-x",
        "--parent",
        "main",
        "--output",
        "json",
      ],
      {},
    ]);
    const present = driver({ branches: [{ name: "preview-feat-x" }] });
    await present.neon.create(DATABASE);
    expect(present.calls).toHaveLength(1);
  });

  it("removes an existing branch and skips a missing one", async () => {
    const present = driver([{ name: "preview-feat-x" }]);
    await present.neon.remove(DATABASE);
    expect(present.calls.at(-1)).toEqual([
      "neonctl",
      ["branches", "delete", "preview-feat-x", "--project-id", "acme-db"],
      {},
    ]);
    const missing = driver([]);
    await missing.neon.remove(DATABASE);
    expect(missing.calls).toHaveLength(1);
  });

  it("answers the branch's connection string", async () => {
    const { neon, calls } = driver([]);
    expect(await neon.connectionString(DATABASE)).toBe("postgresql://u:p@ep-1.neon.tech/app");
    expect(calls).toEqual([
      ["neonctl", ["connection-string", "preview-feat-x", "--project-id", "acme-db"], {}],
    ]);
  });
});
