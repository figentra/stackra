/**
 * Stackra file contract:
 * Purpose: `checkRunwayFiles(input)`, ADR 0296 enforcement (STA-598): each runway file parses as YAML with no repeated key
 *          and passes `parseRunway` for its kind; the root also passes `checkPlacement` against the service keys, and each
 *          service runway passes `checkRequires` against the root (STA-2049) and, when the runway build has it,
 *          `checkActionStores` against the root and the member's committed manifest (STA-2798); the root passes
 *          `checkDestinations`, when the runway build has it (O8, STA-2100), and `checkEnvironmentRegion` (ADR 0524).
 *          Every parsed file passes `checkRuntimeOnlyConfig` against `runtimeOnly`, when the runway build has it: a
 *          `config` block never sets a field only the runtime may set (STA-2844).
 * Boundary: pure apart from `read` and `readManifest`; `runway` is the built `@stackra/runway` entry (or a fake).
 *           Errors other than `RunwayInvalidError` propagate.
 * Runtime: node
 * Governing contract: ADR 0296 (and its amendment of 2026-11-26, STA-2844); STA-2798.
 */
import { parseDocument } from "yaml";

import { runwayKindOf } from "#node/functions/runway-kind-of.function";
import type { RunwayApi } from "#node/types/runway-api.type";
import type { RuntimeOnlyFieldShape } from "#node/types/runtime-only-field-shape.type";

/**
 * The runway-file findings.
 *
 * @param input - the runway `files`, `read` for their text, the `runway` API, the service member keys `services` and
 *                `readManifest` for a member's parsed `stackra.manifest.json` (`undefined` when it has none), and the
 *                repository's runtime-only fields `runtimeOnly` (none when omitted).
 * @example
 * checkRunwayFiles({ files: ["runway.yaml"], read, runway, services: ["notes"] });
 */
export function checkRunwayFiles(input: {
  readonly files: readonly string[];
  readonly read: (path: string) => string;
  readonly runway: RunwayApi;
  readonly services: readonly string[];
  readonly readManifest?: (path: string) => unknown;
  readonly runtimeOnly?: readonly RuntimeOnlyFieldShape[];
}): string[] {
  const { files, read, runway, services, readManifest, runtimeOnly = [] } = input;
  const out: string[] = [];
  let root: unknown;
  const parsedServices: [file: string, runway: unknown][] = [];
  for (const file of files) {
    const kind = runwayKindOf(file);
    if (!kind) {
      out.push(
        `${file}: no runway kind applies here; a runway file sits at the repository root or at a member root (ADR 0296)`,
      );
      continue;
    }
    const doc = parseDocument(read(file), { uniqueKeys: true });
    const [error] = doc.errors;
    if (error) {
      out.push(`${file}: not valid YAML (${error.message.split("\n")[0]})`);
      continue;
    }
    let parsed: unknown;
    try {
      parsed = runway.parseRunway(kind, doc.toJS(), file);
    } catch (thrownError) {
      if (!(thrownError instanceof runway.RunwayInvalidError)) throw thrownError;
      for (const { path, message } of thrownError.issues)
        out.push(`${file}: ${path || "(document)"}: ${message}`);
      continue;
    }
    // STA-2844: the running environment and every other safety-critical field come from the runtime only.
    for (const { path, message } of runway.checkRuntimeOnlyConfig?.(parsed, runtimeOnly) ?? [])
      out.push(`${file}: ${path}: ${message}`);
    if (kind === "service") parsedServices.push([file, parsed]);
    if (kind === "root") {
      root = parsed;
      for (const { code, message } of runway.checkPlacement(parsed, services))
        out.push(`${file}: ${message} (${code})`);
      // Owner decision O8: a destination or target block no driver serves is refused.
      for (const { path, message } of [
        ...(runway.checkDestinations?.(parsed) ?? []),
        // ADR 0524: a product's staging and production each name their tenant region.
        ...(runway.checkEnvironmentRegion?.(parsed) ?? []),
      ])
        out.push(`${file}: ${path}: ${message}`);
    }
  }
  // A requirement is served by an environment's driver, which the root's defaults may set (STA-2049).
  if (root !== undefined)
    for (const [file, parsed] of parsedServices)
      for (const { path, message } of [
        ...runway.checkRequires(root, parsed),
        // STA-2798: a deployed environment never keeps a bound action store in memory.
        ...(runway.checkActionStores?.(
          root,
          parsed,
          readManifest?.(file.replace(/runway\.yaml$/, "stackra.manifest.json")),
        ) ?? []),
      ])
        out.push(`${file}: ${path}: ${message}`);
  return out;
}
