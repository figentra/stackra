/**
 * Stackra file contract:
 * Purpose: `readRunway(file, kind)`, a runway file read from disk, parsed as YAML (duplicate keys refused) and checked
 *          by `parseRunway`: the runtime reader `stackra validate`, gen and `definesFor` share.
 * Boundary: reads one file; never writes, never resolves `ref:` values. The block-style YAML rule is the repository
 *           validator's (`checkYamlFlowMaps`), not this reader's.
 * Runtime: node
 * Governing contract: ADR 0296 (decisions 1, 2 and 6, and enforcement).
 */
import { readFileSync } from "node:fs";

import { parse } from "yaml";

import type { RunwayKind } from "#core/enums/runway-kind.enum";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { parseRunway } from "#core/functions/parse-runway.function";
import type { RunwayDocument } from "#core/types/runway-document.type";

/**
 * The parsed runway at `file`.
 *
 * @param file - the path of a `runway.yaml`.
 * @param kind - which runway it is.
 * @throws RunwayInvalidError when the file cannot be read, is not YAML, or breaks the schema of `kind`.
 * @example
 * const root = readRunway("runway.yaml", "root");
 * root.environments.production?.topology?.mode; // "grouped"
 */
export function readRunway<K extends RunwayKind>(file: string, kind: K): RunwayDocument[K] {
  let document: unknown;
  try {
    document = parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new RunwayInvalidError(file, [
      { path: "", message: `Not readable as YAML: ${(error as Error).message}` },
    ]);
  }
  return parseRunway(kind, document, file);
}
