/**
 * Stackra file contract:
 * Purpose: declaration-emit test of the `./react` entry: a consumer's exported class that keeps the hooks' results in
 *          fields (`readonly i18n = useTranslation()`, the house idiom) compiles with `tsc --declaration` (exit 0, no
 *          TS4029 or TS2742), and its `.d.ts` names `Translation`, `MoneyFormatter`, `LocaleState` and `LocaleChoice`
 *          through `@stackra/i18n/react`.
 * Boundary: test only; links this package into a temp `node_modules` (with `preserveSymlinks`, so the types are seen
 *           as a dependency's, as in a consumer repository), writes the consumer and a tsconfig there, and runs the
 *           workspace `tsc` binary with `execFile`. The compiler API is not imported: the workspace TypeScript is the
 *           native 7.x, which exports none.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15, entries).
 */
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";

import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

const run = promisify(execFile);
const member = resolve(import.meta.dirname, "../../..");
const preset = resolve(member, "../../tooling/typescript/src/decorators-react.json");
// `typescript` resolves to <package>/lib/version.cjs; the launcher is <package>/bin/tsc.
const tsc = join(dirname(dirname(createRequire(import.meta.url).resolve("typescript"))), "bin/tsc");

const consumer = `import { useLocale, useLocaleChoice, useMoney, useTranslation } from "@stackra/i18n/react";

export class Screen {
  readonly i18n = useTranslation();
  readonly money = useMoney();
  readonly locale = useLocale();
  readonly choice = useLocaleChoice();
}
`;

let directory = "";

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "i18n-react-dts-"));
  await mkdir(join(directory, "node_modules", "@stackra"), { recursive: true });
  await symlink(member, join(directory, "node_modules", "@stackra", "i18n"), "dir");
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
        rootDir: directory,
        skipLibCheck: true,
        // a path inside node_modules can only be named through the package's exports, which is what a consumer sees
        preserveSymlinks: true,
        // the preset's node and vitest/globals do not resolve from a temp dir outside the workspace; the consumer needs neither
        types: [],
      },
      files: [join(directory, "consumer.ts")],
    }),
  );
});

afterAll(async () => {
  if (directory !== "") await rm(directory, { recursive: true, force: true });
});

describe("@stackra/i18n/react, declaration emit", () => {
  it("names every hook's return type through the entry and raises no TS4029", async () => {
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

    expect(output).not.toContain("TS4029");
    expect(output).not.toContain("TS2742");
    expect(code, output).toBe(0);
    const emitted = await readFile(join(directory, "out", "consumer.d.ts"), "utf8");
    for (const name of ["Translation", "MoneyFormatter", "LocaleState", "LocaleChoice"])
      expect(emitted).toContain(`"@stackra/i18n/react").${name}`);
  }, 120_000);
});
