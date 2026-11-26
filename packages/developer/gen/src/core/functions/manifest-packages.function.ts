/**
 * Stackra file contract:
 * Purpose: `manifestPackages`, the `@stackra/*` packages a package's manifest wires from (driver candidates, their
 *          tokens and config, and service tokens).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 25: a dependency's facts come from its manifest); ADR 0003.
 */
import type { StackraManifest } from "@stackra/contracts";

/** The package a specifier names. */
function packageOf(specifier: string): string {
  const parts = specifier.split("/");
  return (specifier.startsWith("@") ? parts.slice(0, 2) : parts.slice(0, 1)).join("/");
}

/** Every `from` string under a token, class reference or list of them. */
function froms(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(froms);
  if (typeof value !== "object" || value === null) return [];
  const { from, class: type, of } = value as Record<string, unknown>;
  return [...(typeof from === "string" ? [from] : []), ...froms(type), ...froms(of)];
}

/**
 * The `@stackra/*` packages `manifest`'s drivers and services wire from, sorted.
 *
 * @param manifest - a package's committed manifest.
 * @example
 * manifestPackages(identityManifest); // ["@stackra/config", "@stackra/scope", "@stackra/storage"]
 */
export function manifestPackages(manifest: StackraManifest): string[] {
  const found = new Set<string>();
  const add = (value: unknown): void => {
    for (const from of froms(value)) if (from.startsWith("@stackra/")) found.add(packageOf(from));
  };
  for (const driver of manifest.drivers ?? []) {
    add(driver["config"]);
    for (const candidate of Object.values((driver["classes"] ?? {}) as Record<string, unknown>)) {
      const { deps } = (candidate ?? {}) as Record<string, unknown>;
      add(deps);
    }
  }
  const services = manifest["services"];
  if (Array.isArray(services))
    for (const entry of services as unknown[])
      add(((entry ?? {}) as Record<string, unknown>)["deps"]);
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds
  return [...found].sort();
}
