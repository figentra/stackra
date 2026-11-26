/**
 * Stackra file contract:
 * Purpose: unit tests of `UpgradeNotesCommand` on the console over a throwaway repository: a pending `@stackra/*`
 *          changeset with a break and no upgrade entry is a failed row (exit 1, the finding as `--json` data); the same
 *          changeset naming an existing entry passes with the all-clear line.
 * Boundary: test only; writes the repository under the OS temp folder and removes it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0199 (Enforcement); STA-145.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";

import { UpgradeNotesCommand } from "#node/commands/upgrade-notes.command";
import { fixtureWorkspace } from "#node/upgrade/functions/__tests__/fixture-workspace";

const repository = (note: string) =>
  fixtureWorkspace({
    "pnpm-workspace.yaml": "packages:\n  - packages/*\n",
    ".changeset/drop-x.md": `---\n"@stackra/queue": minor\n---\n\n${note}\n`,
  });

describe("UpgradeNotesCommand", () => {
  it("fails a breaking changeset with no stackra upgrade entry", async () => {
    const { root, remove } = repository("### Breaking\n\n- `X` is removed.");
    try {
      const result = await runCommandForTest([UpgradeNotesCommand], ["upgrade-notes", "--json"], {
        cwd: root,
      });
      expect(result.exitCode).toBe(1);
      expect(result.json).toEqual({
        ok: false,
        data: [
          {
            dir: "",
            text: expect.stringContaining(
              ".changeset/drop-x.md: a break with no stackra upgrade entry",
            ),
          },
        ],
      });
    } finally {
      remove();
    }
  });

  it("passes a breaking changeset that names its entry", async () => {
    const { root, remove } = repository(
      "### Breaking\n\n- The relay must drain first.\n\nUpgrade entry: `outbox-row-owners`",
    );
    try {
      const result = await runCommandForTest([UpgradeNotesCommand], ["upgrade-notes"], {
        cwd: root,
      });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(
        "every breaking @stackra/* release note has a stackra upgrade entry",
      );
    } finally {
      remove();
    }
  });
});
