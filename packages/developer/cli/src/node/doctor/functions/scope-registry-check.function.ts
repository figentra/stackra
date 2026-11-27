/**
 * Stackra file contract:
 * Purpose: `scopeRegistryCheck(scope, config, origin)`, the doctor row `<scope> scope mapped`: whether the package
 *          manager's effective config sends the Stackra scope to a Stackra registry. It fails when the scope is not
 *          mapped (it would install from the default registry, where anyone can publish under that name) or is mapped
 *          to a public registry (`isPublicNpmRegistry`), and prints the exact `.npmrc` line to add; it warns when the
 *          scope maps to another host than the registry origin (a mirror, a local registry); it warns when the config
 *          could not be read. An origin that is itself a public registry (an `.npmrc` line `registryOrigin` read back)
 *          is never offered: the fix then names `REGISTRY_ORIGIN_DEFAULT`.
 * Boundary: pure; registry URLs only, no auth value is read or shown.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 4: never npmjs; decision 10: the consumer `.npmrc` maps the scopes).
 */
import { REGISTRY_ORIGIN_DEFAULT } from "#node/constants/registry-origin-default.constant";
import type { DoctorResult } from "#node/doctor/types/doctor-result.type";
import type { ScopeRegistryConfig } from "#node/doctor/types/scope-registry-config.type";
import { isPublicNpmRegistry } from "#node/functions/public-npm-registry.function";

/** The registry URL in one comparable form: lower-case host, a trailing slash. */
function normal(url: string): string {
  if (!URL.canParse(url)) return url;
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.host.toLowerCase()}${parsed.pathname.replace(/\/*$/, "/")}`;
}

/**
 * The doctor row of one Stackra scope's mapping.
 *
 * @param scope - `@stackra` or `@stackra-pro`.
 * @param config - the effective config, or undefined when the package manager could not be asked.
 * @param registryOrigin - the Stackra registry origin (`registryOrigin`); a public one is replaced by the default.
 * @example
 * scopeRegistryCheck("@stackra", { scoped: undefined, registry: "https://registry.npmjs.org/" }, origin).status; // "fail"
 */
export function scopeRegistryCheck(
  scope: string,
  config: ScopeRegistryConfig | undefined,
  registryOrigin: string,
): DoctorResult {
  const origin = isPublicNpmRegistry(registryOrigin) ? REGISTRY_ORIGIN_DEFAULT : registryOrigin;
  const name = `${scope} scope mapped`;
  const line = `${scope}:registry=${origin}`;
  if (config === undefined)
    return {
      name,
      status: "warn",
      detail: "could not read the package manager's config",
      fix: `make sure the workspace .npmrc has the line ${line}`,
    };
  const { scoped, registry } = config;
  if (scoped === undefined) {
    if (registry !== undefined && normal(registry) === normal(origin))
      return { name, status: "ok", detail: `${origin} (the default registry)` };
    return {
      name,
      status: "fail",
      detail: `not mapped: ${scope}/* would install from ${registry ?? "the default registry"}, where anyone can publish under that name`,
      fix: `add this line to the workspace .npmrc: ${line}`,
    };
  }
  if (isPublicNpmRegistry(scoped))
    return {
      name,
      status: "fail",
      detail: `mapped to ${scoped}, a public registry; Stackra packages never come from there (ADR 0453)`,
      fix: `replace the ${scope}:registry line (in .npmrc, ~/.npmrc or the registries of pnpm-workspace.yaml) with: ${line}`,
    };
  if (normal(scoped) !== normal(origin))
    return {
      name,
      status: "warn",
      detail: `mapped to ${scoped}, not the Stackra registry ${origin}`,
      fix: `keep it only if that host is a Stackra registry that never proxies npmjs; otherwise set ${line}`,
    };
  return { name, status: "ok", detail: scoped };
}
