/**
 * Stackra file contract:
 * Purpose: `encoreMembers(root)`, the service members of a repository that gen wrote an Encore app for
 *          (`services/<key>/encore.app`): the members root `stackra dev` runs as one Encore app.
 * Boundary: reads folder existence only.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2 as amended 2026-11-09); ADR 0296 (decision 3); STA-2840.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * The service members of `root` that hold a generated Encore app (`services/<key>/encore.app`), sorted.
 *
 * @example
 * encoreMembers("/work/acme"); // ["/work/acme/services/billing", "/work/acme/services/usage"]
 */
export function encoreMembers(root: string): string[] {
  const services = join(root, "services");
  if (!existsSync(services)) return [];
  return readdirSync(services, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(services, entry.name, "encore.app")))
    .map((entry) => join(services, entry.name))
    .toSorted();
}
