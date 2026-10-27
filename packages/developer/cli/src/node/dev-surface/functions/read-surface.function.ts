/**
 * Stackra file contract:
 * Purpose: `readSurface(root, surface)`, one surface of the product's root `runway.yaml` (`surfaces.<surface>`: its
 *          `shell` and `packages`) with the local API gateway port (`environments.dev.infra.gateway.port`).
 * Boundary: reads `<root>/runway.yaml` only. Refuses a surface it cannot serve in a shell (no `shell`, no `packages`:
 *           an ops `contributes` entry or a landing's `content`), naming why; never guesses a shell.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 6); app-shells sections 8.2, 8.3 and 15 point 2; ADR 0441 (root runway
 *                     surfaces); the root runway schema (stackra-06).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parse } from "yaml";

import { parseShellRef } from "#node/dev-surface/functions/parse-shell-ref.function";
import type { RootSurface } from "#node/dev-surface/types/root-surface.type";
import { CliUsageError } from "#node/errors/cli-usage.error";

/** The root runway fields the dev command reads. */
type RootRunway = {
  readonly surfaces?: Record<string, { shell?: unknown; packages?: unknown } | null>;
  readonly environments?: { dev?: { infra?: { gateway?: { port?: unknown } } } };
};

/**
 * The surface `surface` of the root runway at `root`.
 *
 * @param root - the product repository root.
 * @param surface - the surface key (`console`).
 * @throws CliUsageError when there is no root runway, no such surface, or the surface has no shell or packages.
 * @example
 * readSurface("/repo/mezzora", "console");
 * // { shell: { owner: "os", name: "console", line: 3 }, packages: ["@figentra/mezzora-console-ui"], gatewayPort: 4000 }
 */
export function readSurface(root: string, surface: string): RootSurface {
  const file = join(root, "runway.yaml");
  if (!existsSync(file)) {
    throw new CliUsageError(
      "--surface runs at the product root, beside the root runway.yaml (none here)",
    );
  }
  const runway = (parse(readFileSync(file, "utf8")) ?? {}) as RootRunway;
  const surfaces = runway.surfaces ?? {};
  const entry = surfaces[surface];
  if (entry === undefined || entry === null) {
    const known = Object.keys(surfaces);
    throw new CliUsageError(
      known.length === 0
        ? "runway.yaml declares no surfaces"
        : `unknown surface: ${surface} (runway.yaml has ${known.join(", ")})`,
    );
  }
  if (typeof entry.shell !== "string") {
    throw new CliUsageError(
      `surface ${surface} names no shell: an ops contribution runs in the OS ops release, landing content is imported into experience`,
    );
  }
  const packages = Array.isArray(entry.packages)
    ? entry.packages.filter((name): name is string => typeof name === "string")
    : [];
  if (packages.length === 0) throw new CliUsageError(`surface ${surface} lists no packages`);
  const port = runway.environments?.dev?.infra?.gateway?.port;
  return {
    shell: parseShellRef(entry.shell),
    packages,
    gatewayPort: typeof port === "number" ? port : undefined,
  };
}
