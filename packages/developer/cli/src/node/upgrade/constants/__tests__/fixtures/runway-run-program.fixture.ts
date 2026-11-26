/**
 * Stackra file contract:
 * Purpose: the `runway-run-program` codemod fixture (0.10.0): runway's `runCommand` import renamed `runProgram` with its
 *          uses, and `@stackra/console`'s own `runCommand` left alone.
 * Boundary: test fixture only; the sources are strings, never compiled.
 * Runtime: node (vitest)
 * Governing contract: ADR 0199 (Enforcement); STA-145; changeset c4348cd.
 */
import type { CodemodFixture } from "#node/upgrade/constants/__tests__/fixtures/codemod-fixture.type";

const consoleRun = `import { runCommand } from "@stackra/console";

export const run = () => runCommand(["--help"]);
`;

export const RUNWAY_RUN_PROGRAM_FIXTURE: CodemodFixture = {
  files: [
    {
      path: "tools/deploy/ship.ts",
      before: `import { parseRunway, runCommand } from "@stackra/runway/node";

export async function ship(): Promise<void> {
  parseRunway("root", {});
  await runCommand("wrangler", ["deploy"]);
}
`,
      after: `import { parseRunway, runProgram } from "@stackra/runway/node";

export async function ship(): Promise<void> {
  parseRunway("root", {});
  await runProgram("wrangler", ["deploy"]);
}
`,
    },
    { path: "tools/console/run.ts", before: consoleRun, after: consoleRun },
  ],
};
