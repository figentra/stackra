/**
 * Stackra file contract:
 * Purpose: unit tests of `execWithSecrets`: a command naming no secret starts directly in the given directory and its
 *          exit code comes back; a program that cannot start rejects; with `secrets`, a fake `sops exec-env` puts a
 *          canary into the server's environment and the server's argv never holds it (STA-1617).
 * Boundary: test only; starts this Node binary and a fake `sops` on PATH (a shell script), never the real `sops`,
 *           and touches no secret.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 3).
 */
import { randomBytes } from "node:crypto";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";

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

  it("puts a named secret into the server's environment and never on its argv", async () => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), "stackra-mcp-secret-")));
    const value = `fake-${randomBytes(12).toString("hex")}`;
    const previous = { path: process.env["PATH"], value: process.env["FAKE_SOPS_VALUE"] };
    try {
      mkdirSync(join(dir, "bin"));
      // `sops exec-env <file> <line>`: export the canary under the file's name and run the line with sh, as sops does.
      writeFileSync(
        join(dir, "bin", "sops"),
        '#!/bin/sh\nname=$(basename "$2" .enc.yaml)\nexport "$name=$FAKE_SOPS_VALUE"\nexec sh -c "$3"\n',
      );
      chmodSync(join(dir, "bin", "sops"), 0o755);
      process.env["PATH"] = `${join(dir, "bin")}${delimiter}${previous.path ?? ""}`;
      process.env["FAKE_SOPS_VALUE"] = value;
      const script =
        "require('node:fs').writeFileSync('seen.json', JSON.stringify({ argv: process.argv, token: process.env.TEST_TOKEN }))";
      await expect(
        execWithSecrets([process.execPath, "-e", script], {
          cwd: dir,
          secretsDir: dir,
          secrets: ["TEST_TOKEN"],
        }),
      ).resolves.toBe(0);
      const seen = JSON.parse(readFileSync(join(dir, "seen.json"), "utf8")) as {
        argv: string[];
        token: string;
      };
      expect(seen.token).toBe(value);
      expect(JSON.stringify(seen.argv)).not.toContain(value);
    } finally {
      process.env["PATH"] = previous.path;
      if (previous.value === undefined) delete process.env["FAKE_SOPS_VALUE"];
      else process.env["FAKE_SOPS_VALUE"] = previous.value;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses a secret reference in the command before anything starts", () => {
    expect(() =>
      execWithSecrets(["node", "--api-key", "$TEST_TOKEN"], { secrets: ["TEST_TOKEN"] }),
    ).toThrow(/would show in every process listing/);
  });

  it("rejects when the program cannot start", async () => {
    await expect(execWithSecrets(["stackra-mcp-no-such-program"])).rejects.toThrow(/ENOENT/);
  });
});
