/**
 * Stackra file contract:
 * Purpose: `checkPublish`: the content checks of one publish.
 * Boundary: pure; the size limit, the immutability check and the provenance check are the publish handler's.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 7, 8 and 11); ADR 0316 (decision 2); ADR 0024 (decision 5); ADR 0013.
 */
import { STACKRA_KINDS } from "#src/constants/stackra-kinds.constant";
import { splitName } from "#src/http/split-name";
import type { PublishCandidate } from "#src/interfaces/publish-candidate.interface";
import type { PublishVerdict } from "#src/interfaces/publish-verdict.type";
import type { StackraKind } from "#src/interfaces/stackra-kind.type";

/** semver 2.0.0, as npm accepts it (no leading `v`, no `=`). */
const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/** A licence file at the package root. */
const LICENCE_FILE = /^LICEN[CS]E(\.(md|txt))?$/i;

/** A notice file at the package root. */
const NOTICE_FILE = /^NOTICE(\.(md|txt))?$/i;

/** The item kind named by package.json, or null for an unknown one. */
function kindOf(pkg: Readonly<Record<string, unknown>>): StackraKind | null {
  const stackra = pkg.stackra as { kind?: unknown } | undefined;
  const kind = stackra?.kind ?? "package";
  return (STACKRA_KINDS as readonly unknown[]).includes(kind) ? (kind as StackraKind) : null;
}

/** The licence rule of the scope. */
function licenceReasons(candidate: PublishCandidate): string[] {
  const { scope, contents } = candidate;
  const licence = contents.packageJson.license;
  const files = contents.files;
  if (scope.licence_rule === "commercial") {
    return [
      ...(licence === scope.commercial_licence
        ? []
        : [`${scope.scope} packages must name the licence "${scope.commercial_licence}"`]),
      ...(files.some((file) => LICENCE_FILE.test(file)) ? [] : ["LICENSE file is missing"]),
      ...(files.some((file) => file.startsWith("src/")) ? ["src/ must not be published"] : []),
      ...(files.some((file) => file.endsWith(".map")) ? ["source maps must not be published"] : []),
    ];
  }
  if (typeof licence !== "string" || licence === "") return ["license is missing"];
  if (licence === scope.commercial_licence || licence === "UNLICENSED")
    return [`${scope.scope} packages must carry an open-source licence`];
  if (licence !== "MIT" && !files.some((file) => NOTICE_FILE.test(file)))
    return [`a ${licence} item needs a NOTICE file`];
  return [];
}

/**
 * The content checks of one publish.
 *
 * @example
 * const verdict = checkPublish({ name, version, scope, contents, digests, clientDist });
 * if (!verdict.ok) return failure(400, verdict.reasons.join("; "));
 */
export function checkPublish(candidate: PublishCandidate): PublishVerdict {
  const { name, version, contents, digests, clientDist } = candidate;
  const pkg = contents.packageJson;
  const reasons: string[] = [];
  if (pkg.name !== name) reasons.push(`package.json name is not ${name}`);
  if (pkg.version !== version) reasons.push(`package.json version is not ${version}`);
  if (!SEMVER.test(version)) reasons.push(`${version} is not a semver version`);
  const kind = kindOf(pkg);
  if (kind === null) reasons.push(`stackra.kind must be one of ${STACKRA_KINDS.join(", ")}`);
  else if (kind !== "package" && !splitName(name).bare.startsWith(`${kind}-`))
    reasons.push(`a ${kind} item is named ${splitName(name).scope}/${kind}-<name>`);
  reasons.push(...licenceReasons(candidate));
  if (clientDist.integrity !== digests.integrity)
    reasons.push("dist.integrity differs from the tarball");
  if (clientDist.shasum !== digests.shasum) reasons.push("dist.shasum differs from the tarball");
  return reasons.length === 0 && kind !== null ? { ok: true, kind } : { ok: false, reasons };
}
