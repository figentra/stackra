/**
 * Stackra file contract:
 * Purpose: tests of `HOOKS_PHASE` over a temp-dir fixture: a class component with hook fields passes after the compile,
 *          a function component that calls a hook conditionally is reported at its source line, a compile refusal is
 *          one finding, and the temp folder is removed. oxlint is the package's own binary, started by the replaced
 *          `runCaptured`.
 * Boundary: test only; spawns oxlint.
 * Runtime: node (vitest)
 * Governing contract: ADR 0305 (rule 41); ADR 0022 (test placement).
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { HOOKS_PHASE } from "#node/constants/hooks-phase.constant";
import type { CheckRun } from "#node/types/check-run.type";

const seen = vi.hoisted(() => ({ configs: [] as string[] }));

const oxlint = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../node_modules/.bin/oxlint",
);

vi.mock("#node/functions/run-captured.function", () => ({
  runCaptured: async (_command: string, args: readonly string[]) => {
    seen.configs.push(args[1] ?? "");
    const run = spawnSync(oxlint, [...args], { encoding: "utf8" });
    return { code: run.status ?? 1, stdout: run.stdout, stderr: run.stderr };
  },
}));

const CLASS_COMPONENT = `import { Component } from "#stackra/ui";
import { useState } from "react";

export class Counter extends Component<{}> {
  state = useState(0);

  render() {
    return <p>{this.state[0]}</p>;
  }
}
`;

const BAD_FUNCTION = `import { useState } from "react";

export function Bad({ on }: { on: boolean }) {
  if (on) {
    useState(0);
  }
  return null;
}
`;

/** A run over a folder holding `files`. */
function fixture(files: Record<string, string>): CheckRun {
  const root = mkdtempSync(join(tmpdir(), "hooks-phase-"));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  // the phase reads no `io`, so the run leaves it out
  return {
    root,
    fix: false,
    files: Object.keys(files),
    base: undefined,
    ci: false,
  } as unknown as CheckRun;
}

describe("HOOKS_PHASE", () => {
  it("is skipped when no file is in a component home", async () => {
    expect(await HOOKS_PHASE.run(fixture({ "src/core/a.tsx": BAD_FUNCTION }))).toEqual({
      findings: [],
      skipped: "no component files",
    });
  });

  it("passes a class component and reports a conditional hook at its source line", async () => {
    const run = fixture({
      "src/react/counter/counter.tsx": CLASS_COMPONENT,
      "src/react/bad/bad.tsx": BAD_FUNCTION,
    });
    const { findings } = await HOOKS_PHASE.run(run);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toEqual(
      expect.objectContaining({
        phase: "hooks",
        rule: "rules-of-hooks",
        path: "src/react/bad/bad.tsx",
        line: 5,
      }),
    );
    expect(existsSync(seen.configs.at(-1) ?? "")).toBe(false);
  });

  it("reports a compile refusal as one finding of that file", async () => {
    const { findings } = await HOOKS_PHASE.run(
      fixture({
        "src/react/a/a.tsx": `import { Component } from "#stackra/ui";\nexport class {{ }\n`,
      }),
    );
    expect(findings).toEqual([
      expect.objectContaining({ rule: "compile", path: "src/react/a/a.tsx" }),
    ]);
  });
});
