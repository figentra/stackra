/**
 * Stackra file contract:
 * Purpose: `readRunways(root)`, the root runway and every member runway under `apps/`, `services/` and `workers/` of a
 *          repository, parsed as plain YAML for the `runway` binary.
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

/**
 * The root runway and every member runway under `root`.
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
          .map((name) => ({ member: name, runway: read(`${dir}/${name}/runway.yaml`) }))
      : [],
  );
  return { root: read("runway.yaml"), members };
}
