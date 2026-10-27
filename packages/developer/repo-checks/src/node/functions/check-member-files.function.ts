/**
 * Stackra file contract:
 * Purpose: `checkMemberFiles(member)`, the required-files and manifest-hygiene findings of one member: README, AGENTS (with a
 *          PII section), CHANGELOG and LICENSE, the licence by tier, a description, and a library's sideEffects,
 *          exports, repository and publishConfig.
 * Boundary: pure: the caller passes the top-level entry names and the texts it read.
 * Runtime: node
 * Governing contract: ADR 0195 (decision 7); ADR 0177 (amendment 2026-10-21); ADR 0025; ADR 0453 (the registry);
 *                     ADR 0461 (no Pro member here).
 */
import { checkExports } from "#node/functions/check-exports.function";
import { tierFor } from "#node/functions/tier-for.function";
import type { PackageManifest } from "#node/types/package-manifest.type";

/**
 * The file findings of one member.
 *
 * @param member - `dir`, `pkg`, the top-level entry names `files`, the AGENTS.md and LICENSE texts, and the root licence.
 * @example
 * checkMemberFiles({ dir, pkg, files: ["README.md"], agents: undefined, licenseText: undefined, rootLicense });
 */
export function checkMemberFiles(member: {
  readonly dir: string;
  readonly pkg: PackageManifest;
  readonly files: readonly string[];
  readonly agents?: string | undefined;
  readonly licenseText?: string | undefined;
  readonly rootLicense?: string | undefined;
}): string[] {
  const { dir, pkg, files, agents, licenseText, rootLicense } = member;
  const out: string[] = [];
  // ADR 0195 decision 7: @stackra/* is MIT with a LICENSE; @figentra/* apps and services are UNLICENSED with none.
  const unlicensed = ["tier:app", "tier:service"].includes(tierFor(dir) ?? "");
  for (const f of ["README.md", "AGENTS.md", "CHANGELOG.md", ...(unlicensed ? [] : ["LICENSE"])])
    if (!files.includes(f)) out.push(`${f} missing`);
  if (files.includes("AGENTS.md") && !/^## PII/m.test(agents ?? ""))
    out.push('AGENTS.md has no "## PII" section');
  if (unlicensed && files.includes("LICENSE")) out.push("LICENSE must not exist (ADR 0195)");
  if (!unlicensed && files.includes("LICENSE") && licenseText !== rootLicense)
    out.push("LICENSE differs from the root LICENSE");
  if (!pkg.description?.trim()) out.push("package.json has no description");
  const license = unlicensed ? "UNLICENSED" : "MIT";
  if (pkg.license !== license) out.push(`package.json license must be "${license}" (ADR 0195)`);
  if (tierFor(dir) === "tier:lib") {
    if (pkg.sideEffects !== false) out.push("package.json sideEffects must be false");
    out.push(...checkExports(pkg.exports));
    // ADR 0453: @stackra/* publishes to the Stackra registry, public, with provenance.
    // npm provenance rejects a package whose repository.url differs from the signing repository.
    if (
      pkg.repository?.url !== "git+https://github.com/figentra/stackra.git" ||
      !pkg.repository?.directory
    )
      out.push(
        'package.json repository must be { type: "git", url: "git+https://github.com/figentra/stackra.git", directory } (ADR 0177)',
      );
    const pc = pkg.publishConfig ?? {};
    if (pc.access !== "public" || pc.provenance !== true || "registry" in pc)
      // ADR 0453: the release workflow's `registry` input is the one place the registry is set, never a member.
      out.push(
        'package.json publishConfig must be { "access": "public", "provenance": true } with no registry (ADR 0453)',
      );
  }
  return out;
}
