/**
 * Stackra file contract:
 * Purpose: declaration-emit test of the called form `Policy<M>({ permissions })`: a consumer's
 *          `export class ThreadPolicy extends Policy<Thread>({ permissions: ThreadPermissions }) {}` compiles with
 *          `tsc` (exit 0, no TS4094) and its emitted `.d.ts` names the exported `PolicyClass`.
 * Boundary: test only; writes the consumer and a tsconfig to a temp dir, maps `#core/*` to this package's
 *           `src/core/*`, and runs the workspace `tsc` binary with `execFile`. The compiler API is not imported: the
 *           workspace TypeScript is the native 7.x, which exports none.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; STA-1680.
 */
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";

import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

const run = promisify(execFile);
const core = resolve(import.meta.dirname, "../..");
const preset = resolve(core, "../../../../tooling/typescript/src/decorators-react.json");
// `typescript` resolves to <package>/lib/version.cjs; the launcher is <package>/bin/tsc.
const tsc = join(dirname(dirname(createRequire(import.meta.url).resolve("typescript"))), "bin/tsc");

const consumer = `import { Permission, Permissions } from "#core/index";
import { Policy } from "#core/bases/policy.base";

class Thread {}

class ThreadPermissions extends Permissions {
  static readonly read = Permission.L0;
}

export class ThreadPolicy extends Policy<Thread>({ permissions: ThreadPermissions }) {}
`;

let directory = "";

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "iam-policy-dts-"));
  await writeFile(join(directory, "consumer.ts"), consumer);
  await writeFile(
    join(directory, "tsconfig.json"),
    JSON.stringify({
      extends: preset,
      compilerOptions: {
        declaration: true,
        emitDeclarationOnly: true,
        noEmit: false,
        incremental: false,
        composite: false,
        outDir: join(directory, "out"),
        rootDir: "/",
        skipLibCheck: true,
        paths: { "#core/*": [join(core, "*")] },
      },
      files: [join(directory, "consumer.ts")],
    }),
  );
});

afterAll(async () => {
  if (directory !== "") await rm(directory, { recursive: true, force: true });
});

describe("Policy called form, declaration emit", () => {
  it("emits a declaration that names PolicyClass and raises no TS4094", async () => {
    let output: string;
    let code: number;
    try {
      const { stdout, stderr } = await run(process.execPath, [
        tsc,
        "-p",
        join(directory, "tsconfig.json"),
      ]);
      code = 0;
      output = `${stdout}${stderr}`;
    } catch (error) {
      const failure = error as { code?: number; stdout?: string; stderr?: string };
      code = failure.code ?? 1;
      output = `${failure.stdout ?? ""}${failure.stderr ?? ""}`;
    }

    expect(output).not.toContain("TS4094");
    expect(code, output).toBe(0);
    const emitted = await readFile(join(directory, "out", directory, "consumer.d.ts"), "utf8");
    expect(emitted).toContain("PolicyClass");
  }, 120_000);
});
