/**
 * Stackra file contract:
 * Purpose: the golden snapshot tests of gen's frozen interface (STA-1320): each fixture workspace under
 *          `packages/developer/gen/__golden__/<fixture>/input/` is copied to `.cache/golden/<fixture>/`, `generate`
 *          runs over its members in order, and every file the runs wrote or changed (outside `node_modules`) must
 *          equal the committed tree in `<fixture>/expected/`, and the refusals must equal `<fixture>/refusals.json`.
 *          A clean member is also checked again (`check: true`) and must report nothing stale. With
 *          `UPDATE_GOLDEN=1` the run rewrites `expected/` and `refusals.json` instead of comparing; that is the only
 *          way the expected output changes, and its diff is reviewed like code.
 * Boundary: test only; reads `__golden__/`, writes only `.cache/golden/` (gitignored) and, with `UPDATE_GOLDEN=1`,
 *           the fixtures' `expected/` and `refusals.json`. Every golden file carries a `.golden` suffix so no tool
 *           (tsc, oxlint, oxfmt, knip, validate) reads fixture sources or expected output as repository code; the
 *           runner strips it. `input/_modules/` is written as `node_modules/` (git never tracks `node_modules`).
 *           Absolute fixture paths are written as `<workspace>`, so the snapshots do not depend on the machine.
 * Runtime: node (vitest)
 * Governing contract: STA-1320 (freeze gen's interface: generated file set, paths and refusal codes); ADR 0294
 *                     (decisions 10 and 22); ADR 0295 (decision 5); ADR 0022 (test placement).
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

import { generate } from "#node/functions/generate.function";

/** Where the fixtures live and where they run. */
const GOLDEN = fileURLToPath(new URL("../../../__golden__/", import.meta.url));
const CACHE = fileURLToPath(new URL("../../../.cache/golden/", import.meta.url));

/** `UPDATE_GOLDEN=1` rewrites the expected output instead of comparing with it. */
const UPDATE = process.env["UPDATE_GOLDEN"] === "1";

/** The suffix every golden file carries, and the input folder written as `node_modules`. */
const SUFFIX = ".golden";
const MODULES = "_modules";

/** One fixture: its members in run order (producers first) and an optional base fixture its input overlays. */
interface GoldenFixture {
  readonly name: string;
  readonly members: readonly string[];
  readonly base?: string;
}

/**
 * The fixtures, one per member kind (STA-1320) and one per whole-run refusal. A refusal fixture overlays a few files
 * on its base fixture's input.
 */
const FIXTURES: readonly GoldenFixture[] = [
  { name: "service", members: ["services/shop"] },
  { name: "package-drivers", members: ["packages/shop"] },
  { name: "app-clients", members: ["services/channels", "apps/web"] },
  { name: "docs", members: ["apps/handbook"] },
  { name: "consumer", members: ["services/catalogue", "services/channels"] },
  { name: "i18n-packages", members: ["packages/customers"] },
  { name: "refusal-reader", base: "package-drivers", members: ["packages/shop"] },
  { name: "refusal-shim-authored", base: "package-drivers", members: ["packages/shop"] },
  { name: "refusal-tool-reason", base: "package-drivers", members: ["packages/shop"] },
  { name: "refusal-encore-stray", base: "service", members: ["services/shop"] },
  { name: "refusal-encore-missing", base: "service", members: ["services/shop"] },
  { name: "refusal-docs-misplaced", base: "docs", members: ["apps/handbook"] },
  { name: "refusal-docs-config", base: "docs", members: ["apps/handbook"] },
  // The producer is not generated, so it has no manifest: `client_service_unknown`, manifest still written.
  { name: "refusal-client-unknown", base: "consumer", members: ["services/channels"] },
];

/** Every file under `root`, relative and `/`-separated, sorted; `node_modules` is skipped. */
function filesUnder(root: string): string[] {
  if (!existsSync(root)) return [];
  const found: string[] = [];
  const walk = (folder: string): void => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      if (entry.name === "node_modules") continue;
      const path = join(folder, entry.name);
      if (entry.isDirectory()) walk(path);
      else found.push(relative(root, path).split(sep).join("/"));
    }
  };
  walk(root);
  return found.sort();
}

/** Copies a fixture's `input/` to `target`, stripping `.golden` and writing `_modules/` as `node_modules/`. */
function copyInput(fixture: string, target: string): void {
  const input = join(GOLDEN, fixture, "input");
  for (const path of filesUnder(input)) {
    const out = path.endsWith(SUFFIX) ? path.slice(0, -SUFFIX.length) : path;
    const mapped = out.startsWith(`${MODULES}/`)
      ? `node_modules/${out.slice(MODULES.length + 1)}`
      : out;
    mkdirSync(dirname(join(target, mapped)), { recursive: true });
    cpSync(join(input, path), join(target, mapped));
  }
}

/** The workspace's files and their content, absolute paths written as `<workspace>`. */
function snapshot(workspace: string): Map<string, string> {
  return new Map(
    filesUnder(workspace).map((path) => [
      path,
      readFileSync(join(workspace, path), "utf8").replaceAll(workspace, "<workspace>"),
    ]),
  );
}

/** One refusal as the golden records it: the frozen code and where, never the wording. */
interface GoldenRefusal {
  readonly member: string;
  readonly code: string;
  readonly file: string;
  readonly subject: string;
}

describe("gen golden snapshots (STA-1320)", () => {
  for (const fixture of FIXTURES) {
    it(
      `${fixture.name}: writes exactly the committed expected tree`,
      { timeout: 180_000 },
      async () => {
        const workspace = join(CACHE, fixture.name);
        rmSync(workspace, { recursive: true, force: true });
        mkdirSync(workspace, { recursive: true });
        if (fixture.base !== undefined) copyInput(fixture.base, workspace);
        copyInput(fixture.name, workspace);

        const before = snapshot(workspace);
        const refusals: GoldenRefusal[] = [];
        for (const member of fixture.members) {
          const root = join(workspace, member);
          const result = await generate(root);
          for (const error of result.errors) {
            refusals.push({
              member,
              code: error.code,
              file: error.file.replaceAll(workspace, "<workspace>"),
              subject: error.subject,
            });
          }
          // Determinism: a clean run leaves nothing stale for `stackra gen --check`.
          if (result.errors.length === 0) {
            expect((await generate(root, { check: true })).changed).toEqual([]);
          }
        }

        const produced: Record<string, string> = {};
        for (const [path, content] of snapshot(workspace)) {
          if (before.get(path) !== content) produced[path] = content;
        }

        const expectedRoot = join(GOLDEN, fixture.name, "expected");
        const refusalsFile = join(GOLDEN, fixture.name, `refusals.json${SUFFIX}`);
        if (UPDATE) {
          rmSync(expectedRoot, { recursive: true, force: true });
          for (const [path, content] of Object.entries(produced)) {
            mkdirSync(dirname(join(expectedRoot, `${path}${SUFFIX}`)), { recursive: true });
            writeFileSync(join(expectedRoot, `${path}${SUFFIX}`), content);
          }
          writeFileSync(refusalsFile, `${JSON.stringify(refusals, null, 2)}\n`);
          return;
        }

        expect(
          existsSync(refusalsFile),
          `no golden for ${fixture.name}: run UPDATE_GOLDEN=1 pnpm --filter @stackra/gen exec vitest run src/node/__tests__/golden.test.ts and review the diff`,
        ).toBe(true);
        const expected: Record<string, string> = {};
        for (const path of filesUnder(expectedRoot)) {
          expected[path.slice(0, -SUFFIX.length)] = readFileSync(join(expectedRoot, path), "utf8");
        }
        expect(Object.keys(produced).sort()).toEqual(Object.keys(expected).sort());
        expect(produced).toEqual(expected);
        expect(refusals).toEqual(JSON.parse(readFileSync(refusalsFile, "utf8")) as GoldenRefusal[]);
      },
    );
  }
});
