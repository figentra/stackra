/**
 * Stackra file contract:
 * Purpose: `checkMember(member)`, the manifest findings of one member: its name by placement, catalog-only versions,
 *          forbidden and HeroUI Pro dependencies, the Pro wrapper's publishing fields, one tier tag matching its
 *          directory and a @stackra/typescript-config preset.
 * Boundary: pure: the caller passes the parsed package.json, turbo.jsonc and tsconfig.json (undefined when absent).
 * Runtime: node
 * Governing contract: ADR 0011; ADR 0019; ADR 0310; ADR 0316 (decision 2); ADR 0003 (tiers).
 */
import { DEPENDENCY_FIELDS } from "#node/constants/dependency-fields.constant";
import { FORBIDDEN_DEPENDENCIES } from "#node/constants/forbidden-dependencies.constant";
import { PRO_DEPENDENCIES } from "#node/constants/pro-dependencies.constant";
import { PRO_WRAPPER } from "#node/constants/pro-wrapper.constant";
import { expectedName } from "#node/functions/expected-name.function";
import { tierFor } from "#node/functions/tier-for.function";
import type { PackageManifest } from "#node/types/package-manifest.type";

/** A `files` entry that would pack the source folder: `src` in any spelling, or the whole package (`.`, `*`, `**`). */
const isSourceEntry = (entry: string): boolean =>
  /^(\.\/?|(\.\/)?\*{1,2}|(\.\/)?src(\/.*)?)$/.test(entry);

/** Every path a conditional `exports` value names, condition objects walked to their leaves. */
const exportTargets = (value: unknown): string[] =>
  typeof value === "string"
    ? [value]
    : Object.values((value ?? {}) as object).flatMap((inner: unknown) => exportTargets(inner));

/**
 * Findings for the Pro wrapper's publishing fields: private, the restricted registry, and the Pro tarball of ADR 0316
 * decision 2 (no `src` and, last, no source maps in `files`; packed exports for the same entries, on `dist` or
 * `assets` only, with no `@stackra/source`).
 */
function checkProWrapper(pkg: PackageManifest): string[] {
  const out: string[] = [];
  const publishConfig = pkg.publishConfig ?? {};
  const files = pkg.files ?? [];
  const name = PRO_WRAPPER.name;
  if (pkg.private !== true)
    out.push(`${name} must be "private": true, so nothing publishes it to npmjs (ADR 0310)`);
  if (!PRO_WRAPPER.registry.test(publishConfig.registry ?? ""))
    out.push(
      `${name} publishConfig.registry must be Keygen's npm engine, https://npm.pkg.keygen.sh/<account>/ (ADR 0310)`,
    );
  // A negated `files` entry only drops what the entries before it added, so the map exclusion comes last.
  if (files.some(isSourceEntry) || files.at(-1) !== PRO_WRAPPER.noSourceMaps)
    out.push(
      `${name} files must list no src and must end with "${PRO_WRAPPER.noSourceMaps}": its tarball ships dist only (ADR 0316)`,
    );
  const entries = Object.keys((pkg.exports ?? {}) as object).sort();
  const packed = Object.keys((publishConfig.exports ?? {}) as object).sort();
  const targets = exportTargets(publishConfig.exports);
  if (
    packed.length === 0 ||
    packed.join() !== entries.join() ||
    JSON.stringify(publishConfig.exports).includes("@stackra/source") ||
    !targets.every((target) => /^\.\/(dist|assets)\//.test(target))
  )
    out.push(
      `${name} publishConfig.exports must name every entry of exports, on dist or assets only, with no @stackra/source condition (ADR 0316)`,
    );
  return out;
}

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
      if (
        PRO_DEPENDENCIES.includes(dep) &&
        !isApp &&
        (pkg.name !== PRO_WRAPPER.name || dep === PRO_WRAPPER.name)
      )
        out.push(
          `${field}.${dep} is HeroUI Pro: only apps and ${PRO_WRAPPER.name} may depend on it (ADR 0310)`,
        );
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

  if (pkg.name === PRO_WRAPPER.name) out.push(...checkProWrapper(pkg));

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
