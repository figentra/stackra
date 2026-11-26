/**
 * Stackra file contract:
 * Purpose: `runwayDevSecretNames(memberRoot)`, the secret names a member's `runway.yaml` lists under
 *          `environments.dev.secrets`: a product's explicit "dev needs a value for these", whether or not its
 *          configuration requires them (a key production reads from KMS is optional there, but dev needs a value).
 * Boundary: reads one file; names only, never a value. No runway, no dev block or no list is no names; a name that is
 *           not a string is skipped (runway's own schema refuses it).
 * Runtime: node
 * Governing contract: ADR 0525 (amendment of 2026-11-10); STA-2679 (PAY, pay#227).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parse } from "yaml";

/**
 * The dev secret names the runway of the member at `memberRoot` lists.
 *
 * @param memberRoot - the absolute member folder.
 * @example
 * runwayDevSecretNames("/repo/services/pay"); // ["PAY_CONNECTIONS_DATA_KEY"]
 */
export function runwayDevSecretNames(memberRoot: string): readonly string[] {
  const file = join(memberRoot, "runway.yaml");
  if (!existsSync(file)) return [];
  const runway = parse(readFileSync(file, "utf8")) as {
    environments?: { dev?: { secrets?: unknown } };
  } | null;
  const names = runway?.environments?.dev?.secrets;
  return Array.isArray(names)
    ? names.filter((name): name is string => typeof name === "string")
    : [];
}
