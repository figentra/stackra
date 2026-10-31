/**
 * Stackra file contract:
 * Purpose: `appFiles(spec)`, the files of a new standalone console app by path: package.json, tsconfig files, the
 *          vitest config, .npmrc (the `@stackra` registry scope line only), .gitignore, README, `src/main.ts`,
 *          `src/theme.ts`, the `greet` command and its tests.
 * Boundary: pure; returns text. No `.stackra/`: the app registers its commands explicitly. Never writes a token.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-031.
 */
import { APP_VERSIONS } from "#node/constants/app-versions.constant";
import type { AppSpec } from "#node/types/app-spec.type";

/** The Stackra registry (ADR 0453). */
const REGISTRY = "https://npm.stackra.figentra.com/";

/** `value` as a JSON file. */
const json = (value: unknown) => `${JSON.stringify(value, undefined, 2)}\n`;

/** The files of the app `spec` describes. */
export function appFiles(spec: AppSpec): Readonly<Record<string, string>> {
  const stackraOf = (name: string) => spec.stackra[name] ?? "latest";
  const pkg = {
    name: spec.name,
    version: "0.1.0",
    private: true,
    type: "module",
    bin: { [spec.bin]: "./dist/main.js" },
    scripts: {
      build: "tsc -p tsconfig.build.json",
      typecheck: "tsc --noEmit",
      test: "vitest run",
      start: "node dist/main.js",
    },
    dependencies: {
      "@stackra/console": stackraOf("@stackra/console"),
      "@stackra/validation": stackraOf("@stackra/validation"),
    },
    devDependencies: { ...APP_VERSIONS },
    engines: { node: ">=24.0.0" },
    ...(spec.override ? { pnpm: { overrides: spec.stackra }, overrides: spec.stackra } : {}),
  };
  const compilerOptions = {
    target: "ES2023",
    module: "NodeNext",
    moduleResolution: "NodeNext",
    rewriteRelativeImportExtensions: true,
    experimentalDecorators: true,
    strict: true,
    exactOptionalPropertyTypes: true,
    noUncheckedIndexedAccess: true,
    skipLibCheck: true,
    types: ["node"],
    outDir: "dist",
    rootDir: "src",
  };
  return {
    "package.json": json(pkg),
    "tsconfig.json": json({
      compilerOptions: { ...compilerOptions, noEmit: true },
      include: ["src", "vitest.config.ts"],
    }),
    "tsconfig.build.json": json({
      extends: "./tsconfig.json",
      compilerOptions: { noEmit: false },
      include: ["src"],
      exclude: ["src/**/__tests__"],
    }),
    "vitest.config.ts": `import { defineConfig } from "vitest/config";

// Legacy decorators, as tsconfig's experimentalDecorators.
export default defineConfig({ oxc: { decorator: { legacy: true, emitDecoratorMetadata: false } } });
`,
    ".npmrc": `@stackra:registry=${REGISTRY}\n`,
    ".gitignore": "node_modules\ndist\n",
    "README.md": `# ${spec.name}

A console app built on [@stackra/console](https://github.com/figentra/stackra/tree/main/packages/developer/console).

\`\`\`sh
pnpm build
node dist/main.js greet Ada
node dist/main.js greet Ada --json
pnpm test
\`\`\`

Add a command: a class in \`src/commands/<name>.command.ts\` that extends \`Command({ name, description })\`, then list
it in \`src/main.ts\`.
`,
    "src/main.ts": `#!/usr/bin/env node
import { createConsole } from "@stackra/console";
import { nodePorts } from "@stackra/console/node";

import { GreetCommand } from "./commands/greet.command.ts";
import { THEME } from "./theme.ts";

const app = createConsole({ name: ${JSON.stringify(spec.bin)}, version: "0.1.0", theme: THEME, commands: [GreetCommand] });

process.exitCode = await app.run(process.argv.slice(2), nodePorts());
`,
    "src/theme.ts": `import type { ConsoleTheme } from "@stackra/console/contracts";

/** This app's look: change the logo, the gradient, the accent and the glyph; the layout stays the same. */
export const THEME: ConsoleTheme = {
  name: ${JSON.stringify(spec.name)},
  logo: [${JSON.stringify(spec.bin.toUpperCase().split("").join(" "))}],
  gradient: [${JSON.stringify(spec.accent)}, "#E2E9F0"],
  accent: ${JSON.stringify(spec.accent)},
  glyph: "◆",
  asciiGlyph: "*",
};
`,
    "src/commands/greet.command.ts": `import { Argument, Command, Option } from "@stackra/console";
import type { CommandIo } from "@stackra/console";
import { Int } from "@stackra/validation";

/** Greets someone, asking who when no name is given. */
export class GreetCommand extends Command({ name: "greet", description: "Greet someone" }) {
  /** Who to greet. */
  @Argument({ description: "Who to greet", optional: true })
  who?: string;

  /** Shout the greeting. */
  @Option({ short: "s", description: "Shout the greeting" })
  shout = false;

  /** How many times to greet. */
  @Option({ short: "t", description: "How many times" })
  @Int({ min: 1, max: 5 })
  times = 1;

  /** Greets, and returns the data \`--json\` prints. */
  async handle(io: CommandIo) {
    const who = this.who ?? (await io.prompt.text({ message: "Who should we greet?", default: "world" }));
    const greeting = \`Hello, \${who}!\`;
    for (let time = 0; time < this.times; time += 1) io.output.success(this.shout ? greeting.toUpperCase() : greeting);
    io.output.table(["Name", "Letters"], [[who, [...who].length]]);
    return { who, times: this.times };
  }
}
`,
    "src/commands/__tests__/greet.command.test.ts": `import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "vitest";

import { GreetCommand } from "../greet.command.ts";

describe("greet", () => {
  it("prints its help", async () => {
    const result = await runCommandForTest([GreetCommand], ["greet", "--help"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Greet someone");
    expect(result.stdout).toContain("--times=TIMES");
  });

  it("greets the name it is given", async () => {
    const result = await runCommandForTest([GreetCommand], ["greet", "Ada", "-t", "2"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.match(/Hello, Ada!/g)).toHaveLength(2);
  });

  it("asks who to greet when interactive", async () => {
    const result = await runCommandForTest([GreetCommand], ["greet"], { answers: ["Grace"] });
    expect(result.asked).toEqual(["Who should we greet?"]);
    expect(result.stdout).toContain("Hello, Grace!");
  });

  it("uses the default without a terminal", async () => {
    const result = await runCommandForTest([GreetCommand], ["greet"], { env: { CI: "1" } });
    expect(result.stdout).toContain("Hello, world!");
  });

  it("writes no colour under NO_COLOR", async () => {
    const result = await runCommandForTest([GreetCommand], ["greet", "Ada"], { env: { NO_COLOR: "1" } });
    expect(result.stdout).not.toContain("\\u001B");
  });

  it("writes one JSON document with --json", async () => {
    const result = await runCommandForTest([GreetCommand], ["greet", "Ada", "--json"]);
    expect(result.json).toEqual({ ok: true, data: { who: "Ada", times: 1 } });
  });

  it("refuses --times above 5", async () => {
    const result = await runCommandForTest([GreetCommand], ["greet", "Ada", "--times", "9"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("--times must be at most 5");
  });
});
`,
  };
}
