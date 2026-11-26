/**
 * Stackra file contract:
 * Purpose: `checkVitestPair(workspaceYaml)`, the `vitest-pair` rule: the catalogs pin `vitest` and `@vitest/coverage-v8`
 *          at one version. vitest peers the coverage package at exactly its own version, so a split pair installs two
 *          copies of vitest, and a test file that imports `describe` through `@stackra/testing` then throws "Cannot read
 *          properties of undefined (reading 'config')" in the consumer (0.33.0 shipped 5.0.5 beside 5.0.3).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: the versions rule (catalogs are the one source); ADR 0022 (the shared vitest presets).
 */
import { parse } from "yaml";

/** The two packages that must share a version. */
const VITEST = "vitest";
const COVERAGE = "@vitest/coverage-v8";

/** A catalog's name and its pinned version of a package. */
interface Pin {
  readonly catalog: string;
  readonly version: string;
}

/**
 * The findings for a `vitest` pin that differs from a `@vitest/coverage-v8` pin.
 *
 * @param workspaceYaml - `pnpm-workspace.yaml`'s text; undefined when the file is missing.
 * @example
 * checkVitestPair("catalog:\n  vitest: 5.0.5\n  \"@vitest/coverage-v8\": 5.0.3\n"); // ["vitest 5.0.5 (catalog) …"]
 */
export function checkVitestPair(workspaceYaml?: string): string[] {
  const workspace = (parse(workspaceYaml ?? "") ?? {}) as {
    readonly catalog?: Readonly<Record<string, unknown>>;
    readonly catalogs?: Readonly<Record<string, Readonly<Record<string, unknown>> | null>>;
  };
  const catalogs: ReadonlyArray<readonly [string, Readonly<Record<string, unknown>>]> = [
    ["catalog", workspace.catalog ?? {}],
    ...Object.entries(workspace.catalogs ?? {}).map(
      ([name, pins]) => [`catalogs.${name}`, pins ?? {}] as const,
    ),
  ];
  const pinsOf = (name: string): Pin[] =>
    catalogs.flatMap(([catalog, pins]) =>
      pins[name] === undefined ? [] : [{ catalog, version: String(pins[name]) }],
    );
  const coverage = pinsOf(COVERAGE);
  return pinsOf(VITEST).flatMap((test) =>
    coverage
      .filter((pin) => pin.version !== test.version)
      .map(
        (pin) =>
          `${VITEST} ${test.version} (${test.catalog}) and ${COVERAGE} ${pin.version} (${pin.catalog}) differ; vitest peers the coverage package at exactly its own version, so pin both at ${test.version}`,
      ),
  );
}
