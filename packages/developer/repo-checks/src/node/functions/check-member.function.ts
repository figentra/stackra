/**
 * Stackra file contract:
 * Purpose: `checkMember(member)`, the manifest findings of one member: its name by placement, catalog-only versions,
 *          forbidden dependencies, no `@stackra-pro/*` dependency at all, HeroUI Pro in apps only, one tier tag
 *          matching its directory and a @stackra/typescript-config preset.
 * Boundary: pure: the caller passes the parsed package.json, turbo.jsonc and tsconfig.json (undefined when absent).
 * Runtime: node
 * Governing contract: ADR 0011; ADR 0019; ADR 0310; ADR 0461 (decision 3); ADR 0003 (tiers).
 */
import { DEPENDENCY_FIELDS } from "#node/constants/dependency-fields.constant";
import { FORBIDDEN_DEPENDENCIES } from "#node/constants/forbidden-dependencies.constant";
import { PRO_DEPENDENCIES } from "#node/constants/pro-dependencies.constant";
import { PRO_SCOPE } from "#node/constants/pro-scope.constant";
import { expectedName } from "#node/functions/expected-name.function";
import { tierFor } from "#node/functions/tier-for.function";
import type { PackageManifest } from "#node/types/package-manifest.type";

/**
 * The manifest findings of one member; the parsed files are passed in, so the rules are testable without the disk.
 *
 * @param member - `dir` (repository-relative, "" for the root), `pkg`, and `turbo`/`tsconfig` when present.
 * @example
 * checkMember({ dir: "packages/data/storage", pkg, turbo, tsconfig }); // []
 */
export function checkMember(member: {
  readonly dir: string;
  readonly pkg: PackageManifest;
  readonly turbo?:
    | { readonly extends?: string | readonly string[]; readonly tags?: readonly string[] }
    | undefined;
  readonly tsconfig?: { readonly extends?: string | readonly string[] } | undefined;
}): string[] {
  const { dir, pkg, turbo, tsconfig } = member;
  const out: string[] = [];
  const want = expectedName(dir);
  if (want && pkg.name !== want) out.push(`package name ${pkg.name} must be ${want}`);

  for (const field of DEPENDENCY_FIELDS) {
    for (const [dep, version] of Object.entries(pkg[field] ?? {})) {
      if (FORBIDDEN_DEPENDENCIES.includes(dep))
        out.push(`${field}.${dep} is a forbidden dependency`);
      const isApp = dir.startsWith("apps/");
      if (dep.startsWith(PRO_SCOPE))
        out.push(
          `${field}.${dep} is a Pro package: it lives in figentra/stackra-pro, and no member here may depend on it (ADR 0461)`,
        );
      if (PRO_DEPENDENCIES.includes(dep) && !isApp)
        out.push(`${field}.${dep} is HeroUI Pro: only apps may depend on it (ADR 0310)`);
      if (version === "catalog:uniwind-pro" && !isApp)
        out.push(
          `${field}.${dep} is Uniwind Pro: only apps may use catalog:uniwind-pro (ADR 0310)`,
        );
      // peerDependencies state a compatible range for consumers; they cannot name a catalog.
      if (field === "peerDependencies") continue;
      if (!version.startsWith("catalog:") && !version.startsWith("workspace:"))
        out.push(
          `${field}.${dep} = "${version}" — add it to a catalog in pnpm-workspace.yaml and use catalog:<name>`,
        );
    }
  }

  const tier = tierFor(dir);
  if (tier === null) return out;
  if (tier === "unknown")
    out.push("not under apps/*, packages/<category>/<name>, services/* or workers/*");
  if (!turbo) out.push("turbo.jsonc missing");
  else {
    if (!turbo.extends?.includes("//")) out.push('turbo.jsonc does not extend "//"');
    const tags = (turbo.tags ?? []).filter((t) => t.startsWith("tier:"));
    if (tags.length !== 1 || tags[0] !== tier)
      out.push(`turbo.jsonc tier tags ${JSON.stringify(tags)} — expected exactly ["${tier}"]`);
  }
  // The preset package extends its own files by relative path; it cannot depend on itself.
  if (tsconfig && dir !== "packages/tooling/typescript") {
    const presets = [tsconfig.extends].flat();
    if (!presets.every((p) => String(p ?? "").startsWith("@stackra/typescript-config/")))
      out.push("tsconfig.json must extend @stackra/typescript-config/<preset>");
  }
  return out;
}
