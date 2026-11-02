/**
 * Stackra file contract:
 * Purpose: `publishedDependency(manifests, scope)`, the first dependency of `scope` (`@stackra`, `@figentra`) read
 *          from the registry (not a `workspace:` member) in these package.json files, or undefined: whether a
 *          workspace reads that scope from the registry, and the name the registry check looks up.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: STA-1952 spec FR-017.
 */

/** The value as a record, or an empty one. */
const record = (value: unknown): Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

/**
 * The first published dependency of a scope.
 *
 * @param manifests - parsed package.json files.
 * @param scope - the npm scope, `@stackra` or `@figentra`.
 * @example
 * publishedDependency([{ dependencies: { "@figentra/os-console": "^3.0.0" } }], "@figentra"); // "@figentra/os-console"
 */
export function publishedDependency(
  manifests: readonly unknown[],
  scope: string,
): string | undefined {
  for (const manifest of manifests)
    for (const field of ["dependencies", "devDependencies"])
      for (const [name, spec] of Object.entries(record(record(manifest)[field])))
        if (name.startsWith(`${scope}/`) && !String(spec).startsWith("workspace:")) return name;
  return undefined;
}
