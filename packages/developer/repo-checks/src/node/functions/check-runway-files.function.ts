/**
 * Stackra file contract:
 * Purpose: `checkRunwayFiles(input)`, ADR 0296 enforcement (STA-598): each runway file parses as YAML with no repeated key
 *          and passes `parseRunway` for its kind; the root also passes `checkPlacement` against the service keys, and each
 *          service runway passes `checkRequires` against the root (STA-2049); the root passes `checkDestinations`, when
 *          the runway build has it (O8, STA-2100).
 * Boundary: pure apart from `read`; `runway` is the built `@stackra/runway` entry (or a fake). Errors other than
 *           `RunwayInvalidError` propagate.
 * Runtime: node
 * Governing contract: ADR 0296.
 */
import { parseDocument } from "yaml";

import { runwayKindOf } from "#node/functions/runway-kind-of.function";
import type { RunwayApi } from "#node/types/runway-api.type";

/**
 * The runway-file findings.
 *
 * @param input - the runway `files`, `read` for their text, the `runway` API and the service member keys `services`.
 * @example
 * checkRunwayFiles({ files: ["runway.yaml"], read, runway, services: ["notes"] });
 */
export function checkRunwayFiles(input: {
  readonly files: readonly string[];
  readonly read: (path: string) => string;
  readonly runway: RunwayApi;
  readonly services: readonly string[];
}): string[] {
  const { files, read, runway, services } = input;
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
    if (kind === "service") parsedServices.push([file, parsed]);
    if (kind === "root") {
      root = parsed;
      for (const { code, message } of runway.checkPlacement(parsed, services))
        out.push(`${file}: ${message} (${code})`);
      // Owner decision O8: a destination or target block no driver serves is refused.
      for (const { path, message } of runway.checkDestinations?.(parsed) ?? [])
        out.push(`${file}: ${path}: ${message}`);
    }
  }
  // A requirement is served by an environment's driver, which the root's defaults may set (STA-2049).
  if (root !== undefined)
    for (const [file, parsed] of parsedServices)
      for (const { path, message } of runway.checkRequires(root, parsed))
        out.push(`${file}: ${path}: ${message}`);
  return out;
}
