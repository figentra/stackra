/**
 * Stackra file contract:
 * Purpose: unit tests of `execWithSecrets`: a command naming no secret starts directly in the given directory and its
 *          exit code comes back; a program that cannot start rejects. The Infisical path is `mcpExecCommand`'s test.
 * Boundary: test only; starts this Node binary, never `infisical`, and touches no secret.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 3).
 */
import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { execWithSecrets } from "#node/functions/exec-with-secrets.function";

describe("execWithSecrets", () => {
  it("starts a command without secrets and returns its exit code", async () => {
    await expect(execWithSecrets([process.execPath, "-e", "process.exit(3)"])).resolves.toBe(3);
  });

  it("runs in the given directory", async () => {
    const cwd = realpathSync(mkdtempSync(join(tmpdir(), "stackra-mcp-")));
    try {
      const script = "require('node:fs').writeFileSync('cwd.txt', process.cwd())";
      await expect(execWithSecrets([process.execPath, "-e", script], { cwd })).resolves.toBe(0);
      expect(readFileSync(join(cwd, "cwd.txt"), "utf8")).toBe(cwd);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("rejects when the program cannot start", async () => {
    await expect(execWithSecrets(["stackra-mcp-no-such-program"])).rejects.toThrow(/ENOENT/);
  });
});
