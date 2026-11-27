/**
 * Stackra file contract:
 * Purpose: `readRunwayConfig`, runway's `config` values of a service for each environment (ADR 0296: the last layer of
 *          configuration): the root runway's `environments.<name>.defaults.service.config`, then the member runway's
 *          `environments.<name>.config` over it, field by field within each config key. Gen writes them into
 *          `#stackra/runway-config`, which the runtime entries hand `bootApp`, so `config.actions.stores` (and every
 *          other runway value) reaches the configuration classes at run time (STA-2798).
 * Boundary: reads `<root>/runway.yaml` and the repository root's (the nearest folder above with `pnpm-workspace.yaml`,
 *           as `encoreApp` finds it) through `yaml`; writes nothing. Runway's own schemas validate the files at deploy,
 *           so a block that is not a mapping is skipped, never refused here. Values only: a runway file names secrets,
 *           never holds one (ADR 0173), and `buildConfig` refuses a value for a `@Secret` field.
 * Runtime: node
 * Governing contract: ADR 0296 (decision 1 and the 2026-10-24 note: `defaults.service.config`); ADR 0294 (decision
 *                     19: the layer order); ADR 0173; STA-2798.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { parse } from "yaml";

import type { MemberIR } from "#core/types/member-ir.type";

/** A mapping's entries, or none when `value` is not a mapping. */
function entriesOf(value: unknown): [string, unknown][] {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? Object.entries(value as Record<string, unknown>)
    : [];
}

/** The repository root above `root` (the nearest folder with `pnpm-workspace.yaml`), or undefined. */
function repositoryRootOf(root: string): string | undefined {
  for (let directory = root; ; directory = dirname(directory)) {
    if (existsSync(join(directory, "pnpm-workspace.yaml"))) return directory;
    if (dirname(directory) === directory) return undefined;
  }
}

/** The parsed runway file at `file`, or undefined when there is none. */
function runwayAt(file: string): unknown {
  return existsSync(file) ? (parse(readFileSync(file, "utf8")) as unknown) : undefined;
}

/**
 * The `config` values of each environment of the service at `root`, by config key; undefined when no environment
 * sets one.
 *
 * @param root - the member root.
 * @example
 * readRunwayConfig("services/orders")?.["production"]?.["actions.stores"]; // { idempotency: "postgres", rateLimit: "postgres" }
 */
export function readRunwayConfig(root: string): MemberIR["runwayConfig"] {
  const repository = repositoryRootOf(root);
  const own = runwayAt(join(root, "runway.yaml"));
  const shared = repository === undefined ? undefined : runwayAt(join(repository, "runway.yaml"));
  const found: Record<string, Record<string, Record<string, unknown>>> = {};
  /** Lays `config`'s keys over what `environment` already has, field by field. */
  const lay = (environment: string, config: unknown): void => {
    for (const [key, fields] of entriesOf(config)) {
      const values = entriesOf(fields);
      if (values.length === 0) continue;
      const byKey = (found[environment] ??= {});
      byKey[key] = { ...byKey[key], ...Object.fromEntries(values) };
    }
  };
  // The root's defaults first, so the member's own values win.
  for (const [environment, settings] of entriesOf(
    (shared as { environments?: unknown } | undefined)?.environments,
  ))
    lay(
      environment,
      (settings as { defaults?: { service?: { config?: unknown } } } | null)?.defaults?.service
        ?.config,
    );
  for (const [environment, settings] of entriesOf(
    (own as { environments?: unknown } | undefined)?.environments,
  ))
    lay(environment, (settings as { config?: unknown } | null)?.config);
  return Object.keys(found).length === 0 ? undefined : found;
}
