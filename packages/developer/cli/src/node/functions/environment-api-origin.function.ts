/**
 * Stackra file contract:
 * Purpose: `environmentApiOrigin(root, environment)`, the API origin of one runway environment:
 *          `https://<edge.apiHost>.<environments.<env>.domains.zone>` from the root `runway.yaml`, the host the edge
 *          routes `/{public,app,admin,platform}` from.
 * Boundary: reads the root `runway.yaml` only; writes nothing and calls nothing. An absent file, environment or zone is
 *           a `CliUsageError` that names `--api`, the override.
 * Runtime: node
 * Governing contract: ADR 0237 (the edge routes `api.<zone>`); ADR 0296 (the runway environments); STA-1586.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parse } from "yaml";

import { CliUsageError } from "#node/errors/cli-usage.error";

/** The API host label when `edge.apiHost` is absent, as the template's runway names it. */
const API_HOST = "api";

/** `value[key]` when `value` is an object, else undefined. */
const field = (value: unknown, key: string): unknown =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>)[key] : undefined;

/**
 * The environment's API origin.
 *
 * @param root - the workspace root holding `runway.yaml`.
 * @param environment - the runway environment (`staging`, `production`, …).
 * @throws CliUsageError when the runway names no zone for the environment.
 * @example
 * environmentApiOrigin("/repo", "production"); // "https://api.acme.example"
 */
export function environmentApiOrigin(root: string, environment: string): string {
  const file = join(root, "runway.yaml");
  const runway: unknown = existsSync(file) ? parse(readFileSync(file, "utf8")) : undefined;
  const zone = field(field(field(field(runway, "environments"), environment), "domains"), "zone");
  if (typeof zone !== "string" || zone === "")
    throw new CliUsageError(
      `runway.yaml names no environments.${environment}.domains.zone: pass --api <origin>`,
    );
  const host = field(field(runway, "edge"), "apiHost");
  return `https://${typeof host === "string" && host !== "" ? host : API_HOST}.${zone}`;
}
