/**
 * Stackra file contract:
 * Purpose: `readRunways(root)`, the root runway and every member runway under `apps/`, `services/` and `workers/` of a
 *          repository, parsed as plain YAML for the `runway` binary, with the environment names each member's committed
 *          `stackra.manifest.json` declares (`env`, ADR 0173 amendment 2026-11-04).
 * Boundary: reads files only; never validates (that is `pnpm validate`'s checkRunwayFiles) and never reads a secret.
 * Runtime: node
 * Governing contract: ADR 0170; ADR 0296 (member roots); ADR 0284 (`workers/`); STA-268.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parse } from "yaml";

import type { DeployRunways } from "#node/types/deploy-runways.type";

/** The member roots that may hold a member runway (ADR 0296; `workers/` per ADR 0284). */
const MEMBER_ROOTS = ["apps", "services", "workers"];

/** The names a member's committed manifest declares (gen's `env` rows), when it has any (STA-2104). */
function envOf(file: string): {
  env?: { name: string; kind?: string; environments?: readonly string[] }[];
} {
  if (!existsSync(file)) return {};
  const rows = (JSON.parse(readFileSync(file, "utf8")) as { env?: unknown }).env;
  if (!Array.isArray(rows)) return {};
  return {
    env: rows.flatMap((row: { name?: unknown; kind?: unknown; environments?: unknown }) =>
      typeof row.name === "string"
        ? [
            {
              name: row.name,
              ...(typeof row.kind === "string" ? { kind: row.kind } : {}),
              ...(Array.isArray(row.environments)
                ? { environments: row.environments.filter((item) => typeof item === "string") }
                : {}),
            },
          ]
        : [],
    ),
  };
}

/**
 * The root runway and every member runway under `root`, each with the names its committed manifest declares.
 *
 * @example
 * readRunways("/work/acme").members.map((m) => m.member); // ["docs"]
 */
export function readRunways(root: string): DeployRunways {
  const read = (path: string) => parse(readFileSync(join(root, path), "utf8"));
  const members = MEMBER_ROOTS.flatMap((dir) =>
    existsSync(join(root, dir))
      ? readdirSync(join(root, dir))
          .filter((name) => existsSync(join(root, dir, name, "runway.yaml")))
          .map((name) => ({
            member: name,
            folder: dir,
            runway: read(`${dir}/${name}/runway.yaml`),
            ...envOf(join(root, dir, name, "stackra.manifest.json")),
          }))
      : [],
  );
  return { root: read("runway.yaml"), members };
}
