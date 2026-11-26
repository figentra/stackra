/**
 * Stackra file contract:
 * Purpose: unit tests of `spawnStackra`: the runner starts `stackra` from PATH in the root, or in the folder a call
 *          names, with the given arguments, collects stdout and stderr with the exit code, and reports a missing
 *          binary as exit 127.
 * Boundary: test only; puts a throwaway `stackra` shell script first on PATH for the duration of a test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5).
 */
import { chmodSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { spawnStackra } from "#node/functions/spawn-stackra.function";

let bin: string;
let path: string | undefined;

beforeEach(() => {
  bin = realpathSync(mkdtempSync(join(tmpdir(), "stackra-mcp-")));
  path = process.env["PATH"];
});

afterEach(() => {
  process.env["PATH"] = path;
  rmSync(bin, { recursive: true, force: true });
});

describe("spawnStackra", () => {
  it("runs stackra in the root and collects its output and exit code", async () => {
    const script = join(bin, "stackra");
    writeFileSync(script, '#!/bin/sh\necho "args: $*"\necho "cwd: $(pwd)" >&2\nexit 2\n');
    chmodSync(script, 0o755);
    process.env["PATH"] = `${bin}${delimiter}${path ?? ""}`;

    const outcome = await spawnStackra(bin)(["gen", "--check"]);
    expect(outcome.exitCode).toBe(2);
    expect(outcome.output).toContain("args: gen --check");
    expect(outcome.output).toContain(`cwd: ${bin}`);
  });

  it("runs stackra in the folder a call names", async () => {
    const script = join(bin, "stackra");
    writeFileSync(script, '#!/bin/sh\necho "cwd: $(pwd)"\n');
    chmodSync(script, 0o755);
    process.env["PATH"] = `${bin}${delimiter}${path ?? ""}`;
    const member = join(bin, "services", "commerce");
    mkdirSync(member, { recursive: true });

    const outcome = await spawnStackra(bin)(["test"], { cwd: member });
    expect(outcome).toEqual({ exitCode: 0, output: `cwd: ${member}\n` });
  });

  it("reports a missing binary as exit 127", async () => {
    process.env["PATH"] = bin;
    await expect(spawnStackra(bin)(["validate"])).resolves.toMatchObject({ exitCode: 127 });
  });
});
