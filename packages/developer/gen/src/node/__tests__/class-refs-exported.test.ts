/**
 * Stackra file contract:
 * Purpose: proves every class gen names by hand (`SERVER_CONTRIBUTIONS`, `PLATFORM_BINDINGS` and the follow-the-system
 *          rows of `systemDriverDefaults`) is exported by the package entry it names, read from this repository's
 *          packages: a generated wiring imports exactly that pair, so a wrong entry fails a host's typecheck
 *          (`BearerConfig` from `@stackra/app` in 0.21.0, which only `@stackra/app/server` exports).
 * Boundary: node test; reads each package's package.json `exports` (`@stackra/source`) and that barrel's text. A class
 *           of a package that is not in this repository is not checked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0263 (gen writes the wiring); ADR 0294 (decision 15: entry folders).
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "@stackra/testing";

import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";
import { PLATFORM_BINDINGS } from "#core/constants/platform-bindings.constant";
import { SERVER_CONTRIBUTIONS } from "#core/constants/server-contributions.constant";
import { systemDriverDefaults } from "#core/functions/system-driver-defaults.function";
import type { ClassRef } from "#core/types/class-ref.type";

/** The repository root: the nearest folder above this file with a `pnpm-workspace.yaml`. */
function repositoryRoot(): string {
  let folder = dirname(fileURLToPath(import.meta.url));
  while (!existsSync(join(folder, "pnpm-workspace.yaml"))) folder = dirname(folder);
  return folder;
}

const ROOT = repositoryRoot();

/** Every package folder of the repository by its package name. */
const PACKAGES = new Map(
  readdirSync(join(ROOT, "packages")).flatMap((category) => {
    const categoryFolder = join(ROOT, "packages", category);
    if (!statSync(categoryFolder).isDirectory()) return [];
    return readdirSync(categoryFolder)
      .map((name) => join(categoryFolder, name))
      .filter((folder) => existsSync(join(folder, "package.json")))
      .map((folder) => {
        const manifest = JSON.parse(readFileSync(join(folder, "package.json"), "utf8")) as {
          name: string;
        };
        return [manifest.name, folder] as const;
      });
  }),
);

/** Whether the entry `from` exports `name`, or undefined when `from` is not a package of this repository. */
function exports(ref: ClassRef): boolean | undefined {
  const pkg = ref.from.split("/").slice(0, 2).join("/");
  const folder = PACKAGES.get(pkg);
  if (folder === undefined) return undefined;
  const subpath = ref.from === pkg ? "." : `./${ref.from.slice(pkg.length + 1)}`;
  const manifest = JSON.parse(readFileSync(join(folder, "package.json"), "utf8")) as {
    exports?: Record<string, { "@stackra/source"?: string } | string>;
  };
  const entry = manifest.exports?.[subpath];
  const source = typeof entry === "object" ? entry["@stackra/source"] : undefined;
  if (source === undefined) return false;
  const text = readFileSync(join(folder, source), "utf8");
  return new RegExp(
    `export\\s*(?:type\\s*)?\\{[^}]*\\b${ref.name}\\b[^}]*\\}|export\\s+(?:declare\\s+)?(?:abstract\\s+)?(?:class|const|function|interface|type)\\s+${ref.name}\\b`,
  ).test(text);
}

/** Every package a follow-the-system row may name. */
const SYSTEM_PACKAGES = [
  "@stackra/actions",
  "@stackra/app",
  "@stackra/identity",
  "@stackra/native-share",
  "@stackra/native-spotlight",
  "@stackra/platform",
  "@stackra/theming",
];

/** Every class gen names by hand, with where it names it. */
const REFS: readonly (readonly [string, ClassRef])[] = [
  ...SERVER_CONTRIBUTIONS.flatMap((row) => [
    [`server contribution ${row.provide.name}`, row.provide] as const,
    ...row.deps.map((dep) => [`server contribution ${row.provide.name} dep`, dep] as const),
    ...row.configs.map(
      (config) => [`server contribution ${row.provide.name} config`, config.provide] as const,
    ),
  ]),
  ...Object.entries(PLATFORM_BINDINGS).flatMap(([binding, tokens]) =>
    tokens.map(
      (token) => [`platform binding ${binding}`, "class" in token ? token.class : token] as const,
    ),
  ),
  ...[
    ...systemDriverDefaults({ ...COMMERCE_IR, packages: SYSTEM_PACKAGES }),
    ...systemDriverDefaults({ ...WEB_APP_IR, targets: ["ios"], packages: SYSTEM_PACKAGES }),
  ].flatMap((row) => [
    [`system port ${row.port.name}`, row.port] as const,
    ...(row.config === undefined
      ? []
      : [[`system port ${row.port.name} config`, row.config] as const]),
  ]),
];

/** The class references gen writes into wirings. */
describe("hand-named class references", () => {
  /** A wrong entry is a host's typecheck failure (TS2305), so each pair is checked against the real barrel. */
  it("are each exported by the entry they name", () => {
    const wrong = REFS.filter(([, ref]) => exports(ref) === false).map(
      ([where, ref]) => `${where}: ${ref.name} from ${ref.from}`,
    );

    expect(wrong).toEqual([]);
    expect(REFS.filter(([, ref]) => exports(ref) === true).length).toBeGreaterThan(10);
  });
});
