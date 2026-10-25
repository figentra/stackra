/**
 * Stackra file contract:
 * Purpose: `readIdentitySeed(file)`, the seed file read from disk, parsed as YAML (duplicate keys refused) and checked
 *          by `parseIdentitySeed`: the reader the generated Pulumi program and `stackra dev` share.
 * Boundary: reads one file; never writes. Gen writes the file (`.stackra/zitadel/seed.yaml`).
 * Runtime: node
 * Governing contract: ADR 0199 (decision 3: the seeded dev container), ADR 0171 (decision 3).
 */
import { readFileSync } from "node:fs";

import { parse } from "yaml";

import { IdentityInfraInvalidError } from "#core/errors/identity-infra-invalid.error";
import { parseIdentitySeed } from "#core/functions/parse-identity-seed.function";
import type { IdentitySeed } from "#core/types/identity-seed.type";

/**
 * The checked seed at `file`.
 *
 * @param file - the path of a `seed.yaml`.
 * @throws IdentityInfraInvalidError when the file cannot be read, is not YAML, or breaks the seed format.
 * @example
 * const seed = readIdentitySeed(".stackra/zitadel/seed.yaml");
 * seed.org.name; // "Acme staff"
 */
export function readIdentitySeed(file: string): IdentitySeed {
  let document: unknown;
  try {
    document = parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new IdentityInfraInvalidError(file, [
      { path: "", message: `Not readable as YAML: ${(error as Error).message}` },
    ]);
  }
  return parseIdentitySeed(document, file);
}
