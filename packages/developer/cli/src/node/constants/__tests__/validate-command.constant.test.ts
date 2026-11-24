/**
 * Stackra file contract:
 * Purpose: unit tests of `VALIDATE_COMMAND`: without `--repository` it is the check command's phases; with it, it runs the repo checks
 *          and the repository's own finders at the workspace root (found from any folder inside it), prints each finding as
 *          `<dir>: <text>` (`.` for the root) in the order of the gate and a count, and exits 1, or prints nothing and exits 0;
 *          notices of the structure check go to stderr, and `CI` is passed on to it.
 * Boundary: test only; every finder is a fake, the workspace root is a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0129; ADR 0282 (decision 3).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import {
  catalogueFindings,
  configFindings,
  layoutFindings,
  readRepoContext,
  structureFindings,
} from "@stackra/repo-checks/node";

import { anyRatchetFindings } from "#node/any-ratchet/functions/any-ratchet-findings.function";
import { appNativeDependencyFindings } from "#node/app-native-deps/functions/app-native-dependency-findings.function";
import { architectureMapFindings } from "#node/architecture-map/functions/architecture-map-findings.function";
import { packageCycleFindings } from "#node/cycles/functions/package-cycle-findings.function";
import { duplicateExportFindings } from "#node/duplicate-exports/functions/duplicate-export-findings.function";
import { launchConfigFindings } from "#node/launch-config/functions/launch-config-findings.function";
import { langAssetsFindings } from "#node/lang-assets/functions/lang-assets-findings.function";
import { packageEntitiesFindings } from "#node/package-entities/functions/package-entities-findings.function";
import { pythonPlacementFindings } from "#node/python-placement/functions/python-placement-findings.function";
import { rowSecurityDeclarationFindings } from "#node/row-security-declarations/functions/row-security-declaration-findings.function";
import { sessionSettingFindings } from "#node/session-settings/functions/session-setting-findings.function";
import { VALIDATE_COMMAND } from "#node/constants/validate-command.constant";
import { captureIo } from "#node/functions/capture-io.function";
import type { CliContext } from "#node/types/cli-context.type";

const check = vi.hoisted(() => ({ run: vi.fn(async () => 7) }));

vi.mock("#node/functions/check-command.function", () => ({
  checkCommand: () => ({
    name: "validate",
    summary: "check",
    usage: "stackra validate [--fix]",
    options: { fix: { type: "boolean" } },
    run: check.run,
  }),
}));
vi.mock("@stackra/repo-checks/node", () => ({
  readRepoContext: vi.fn(() => ({ context: true })),
  configFindings: vi.fn(() => []),
  layoutFindings: vi.fn(() => []),
  catalogueFindings: vi.fn(() => []),
  structureFindings: vi.fn(async () => []),
}));
vi.mock("#node/any-ratchet/functions/any-ratchet-findings.function", () => ({
  anyRatchetFindings: vi.fn(() => []),
}));
vi.mock("#node/app-native-deps/functions/app-native-dependency-findings.function", () => ({
  appNativeDependencyFindings: vi.fn(() => []),
}));
vi.mock("#node/architecture-map/functions/architecture-map-findings.function", () => ({
  architectureMapFindings: vi.fn(() => []),
}));
vi.mock("#node/cycles/functions/package-cycle-findings.function", () => ({
  packageCycleFindings: vi.fn(() => []),
}));
vi.mock("#node/duplicate-exports/functions/duplicate-export-findings.function", () => ({
  duplicateExportFindings: vi.fn(() => []),
}));
vi.mock("#node/launch-config/functions/launch-config-findings.function", () => ({
  launchConfigFindings: vi.fn(() => []),
}));
vi.mock("#node/lang-assets/functions/lang-assets-findings.function", () => ({
  langAssetsFindings: vi.fn(() => []),
}));
vi.mock("#node/package-entities/functions/package-entities-findings.function", () => ({
  packageEntitiesFindings: vi.fn(() => []),
}));
vi.mock("#node/python-placement/functions/python-placement-findings.function", () => ({
  pythonPlacementFindings: vi.fn(() => []),
}));
vi.mock(
  "#node/row-security-declarations/functions/row-security-declaration-findings.function",
  () => ({ rowSecurityDeclarationFindings: vi.fn(() => []) }),
);
vi.mock("#node/session-settings/functions/session-setting-findings.function", () => ({
  sessionSettingFindings: vi.fn(() => []),
}));

/** Every finder of the gate, in the order the command runs them. */
const ORDER = [
  configFindings,
  layoutFindings,
  catalogueFindings,
  structureFindings,
  anyRatchetFindings,
  appNativeDependencyFindings,
  architectureMapFindings,
  packageCycleFindings,
  duplicateExportFindings,
  launchConfigFindings,
  langAssetsFindings,
  packageEntitiesFindings,
  pythonPlacementFindings,
  rowSecurityDeclarationFindings,
  sessionSettingFindings,
];

let root: string;
let inside: string;
let originalCi: string | undefined;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-validate-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");
  inside = join(root, "packages", "data", "storage");
  mkdirSync(inside, { recursive: true });
  originalCi = process.env["CI"];
  delete process.env["CI"];
  check.run.mockClear();
  for (const finder of ORDER) vi.mocked(finder as (...args: never[]) => unknown).mockClear();
});

afterEach(() => {
  if (originalCi === undefined) delete process.env["CI"];
  else process.env["CI"] = originalCi;
  rmSync(root, { recursive: true, force: true });
});

const run = async (values: CliContext["values"]) => {
  const { io, output } = captureIo();
  const code = await VALIDATE_COMMAND.run({
    cwd: inside,
    io,
    values,
    positionals: [],
    rest: [],
    cli: async () => 0,
  });
  return { code, output: output() };
};

describe("VALIDATE_COMMAND", () => {
  it("adds --repository to the check command's usage and options", () => {
    expect(VALIDATE_COMMAND.usage).toBe("stackra validate [--fix] [--repository]");
    expect(Object.keys(VALIDATE_COMMAND.options ?? {})).toEqual(["fix", "repository"]);
  });

  it("is the check command's phases without --repository", async () => {
    const { code } = await run({});
    expect(code).toBe(7);
    expect(check.run).toHaveBeenCalledTimes(1);
    expect(readRepoContext).not.toHaveBeenCalled();
  });

  it("runs every finder of the gate at the workspace root, found from a folder inside it, and prints nothing when clean", async () => {
    const { code, output } = await run({ repository: true });

    expect(code).toBe(0);
    expect(output).toBe("");
    expect(check.run).not.toHaveBeenCalled();
    expect(readRepoContext).toHaveBeenCalledWith(root);
    for (const finder of ORDER) expect(finder).toHaveBeenCalledTimes(1);
    expect(configFindings).toHaveBeenCalledWith({ context: true });
    expect(anyRatchetFindings).toHaveBeenCalledWith(root);
    expect(sessionSettingFindings).toHaveBeenCalledWith(root);
  });

  it("prints each finding as `<dir>: <text>` (`.` for the root) in the gate's order, with a count, and exits 1", async () => {
    vi.mocked(configFindings).mockReturnValueOnce([{ dir: "", text: "config one" }] as never);
    vi.mocked(structureFindings).mockResolvedValueOnce([
      { dir: "packages/data/storage", text: "structure two" },
    ] as never);
    vi.mocked(sessionSettingFindings).mockReturnValueOnce([
      { dir: ".claude", text: "session three" },
    ] as never);
    const { code, output } = await run({ repository: true });

    expect(code).toBe(1);
    expect(output).toBe(
      ".: config one\npackages/data/storage: structure two\n.claude: session three\n\n3 finding(s).\n",
    );
  });

  it("sends the structure check's notices to stderr as lines and passes CI on to it", async () => {
    vi.mocked(structureFindings).mockImplementationOnce((async (
      _repo: unknown,
      options: { warn: (text: string) => void },
    ) => {
      options.warn("runway package not built");
      return [];
    }) as never);
    const { code, output } = await run({ repository: true });
    expect(code).toBe(0);
    expect(output).toBe("runway package not built\n");
    expect(structureFindings).toHaveBeenLastCalledWith(
      { context: true },
      expect.objectContaining({ ci: false }),
    );

    process.env["CI"] = "true";
    await run({ repository: true });
    expect(structureFindings).toHaveBeenLastCalledWith(
      { context: true },
      expect.objectContaining({ ci: true }),
    );
  });
});
