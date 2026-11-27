/**
 * Stackra file contract:
 * Purpose: `checkActionStores(root, service, manifest)`, the durable-store check of a parsed service runway (STA-2798):
 *          for each action store the member's generated manifest binds (`actions.IdempotencyStore`,
 *          `actions.RateLimitStore`), every deployed environment the root declares (`preview`, `staging`,
 *          `production`) must select `postgres` or `valkey` in `config.actions.stores.<field>` (the member's, else the
 *          root's `defaults.service.config`), and the manifest must list that driver as a candidate of the port (a
 *          durable name no package of the member provides fails driver resolution at boot). The default `memory` store
 *          forgets every Idempotency-Key on a restart, so a retried write runs twice, and keeps one set of token
 *          buckets per instance.
 * Boundary: pure; returns every failure instead of throwing, for `runway validate` and `stackra validate` to print with
 *           the file. `manifest` is the member's parsed `stackra.manifest.json` (or `undefined`): a member that binds
 *           neither store, or has no manifest yet, has nothing to check; a manifest row without `candidates` (older
 *           than them) is held to durability only. An environment is checked when `isDeployedEnvironment` of
 *           @stackra/config (the one gate the boot refusal uses, STA-2844) says it is deployed, so `dev` never is. The
 *           same refusal runs at boot in @stackra/actions' `StoresConfig`, which gen's `#stackra/runway-config`
 *           feeds these values; this one reports it before a deploy.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (enforcement: a value that cannot serve the environment fails `stackra validate`); ADR
 *                     0266 (decision 2); ADR 0296 (amendment 2026-11-26); STA-2844; STA-2798.
 */
import { isDeployedEnvironment } from "@stackra/config";
import { Enum } from "@stackra/contracts";

import { ACTION_STORE_PORTS } from "#core/constants/action-store-ports.constant";
import { DURABLE_ACTION_STORES } from "#core/constants/durable-action-stores.constant";
import { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import type { RootRunway } from "#core/types/root-runway.type";
import type { RunwayIssue } from "#core/types/runway-issue.type";
import type { ServiceRunway } from "#core/types/service-runway.type";

/** The config key of the action stores in a runway `config` map. */
const STORES_KEY = "actions.stores";

/**
 * The action-store ports `manifest` binds, each with the driver names its rows list as candidates (every row of the
 * key: `@stackra/actions` lists `memory` and `valkey`, `@stackra/database` adds `postgres`, as the wiring merges
 * them); none when it is not a manifest.
 */
function candidatesOf(manifest: unknown): Map<string, Set<string>> {
  const drivers: unknown =
    typeof manifest === "object" && manifest !== null
      ? (manifest as { drivers?: unknown }).drivers
      : undefined;
  const ports = new Map<string, Set<string>>();
  if (!Array.isArray(drivers)) return ports;
  for (const driver of drivers as unknown[]) {
    if (typeof driver !== "object" || driver === null) continue;
    const { key, candidates } = driver as { key?: unknown; candidates?: unknown };
    if (typeof key !== "string") continue;
    const names = ports.get(key) ?? new Set<string>();
    for (const name of Array.isArray(candidates) ? (candidates as unknown[]) : [])
      if (typeof name === "string") names.add(name);
    ports.set(key, names);
  }
  return ports;
}

/** Why `driver` cannot keep `port` in a deployed environment, or undefined when it can. */
function refusalOf(
  driver: unknown,
  port: string,
  candidates: ReadonlySet<string>,
): string | undefined {
  if (typeof driver !== "string") return "memory (the default)";
  if (!DURABLE_ACTION_STORES.includes(driver)) return driver;
  // A manifest that lists no candidates for the port predates them; only durability is known then.
  if (candidates.size > 0 && !candidates.has(driver))
    return `${driver}, which no package of the member provides for ${port} (its candidates: ${[...candidates].join(", ")})`;
  return undefined;
}

/**
 * Every deployed environment of `service` that keeps a bound action store in memory; `[]` when each is durable.
 *
 * @param root - the parsed root runway.
 * @param service - the parsed service runway.
 * @param manifest - the member's parsed `stackra.manifest.json`, or `undefined` when it has none.
 * @example
 * checkActionStores(root, commerce, manifest);
 * // [{ path: "environments.production.config.actions.stores.idempotency", message: "production keeps …" }]
 */
export function checkActionStores(
  root: RootRunway,
  service: ServiceRunway,
  manifest: unknown,
): RunwayIssue[] {
  const bound = candidatesOf(manifest);
  const issues: RunwayIssue[] = [];
  for (const environment of Enum.values(RunwayEnvironment)) {
    if (!isDeployedEnvironment(environment) || root.environments[environment] === undefined)
      continue;
    const own = service.environments[environment]?.config?.[STORES_KEY];
    const defaults = root.environments[environment]?.defaults?.service?.config?.[STORES_KEY];
    for (const [field, port] of Object.entries(ACTION_STORE_PORTS)) {
      const candidates = bound.get(port);
      if (candidates === undefined) continue;
      const driver = own?.[field] ?? defaults?.[field];
      const refused = refusalOf(driver, port, candidates);
      if (refused === undefined) continue;
      const durable = DURABLE_ACTION_STORES.filter(
        (name) => candidates.size === 0 || candidates.has(name),
      );
      issues.push({
        path: `environments.${environment}.config.${STORES_KEY}.${field}`,
        message:
          `${environment} keeps ${port} in ${refused}, so boot cannot keep its records across a restart and ` +
          `between instances: set \`config.${STORES_KEY}.${field}\` to ` +
          `${durable.length > 0 ? durable.join(" or ") : `${DURABLE_ACTION_STORES.join(" or ")} (after adding the package that provides it)`}, ` +
          "in the member or in the root's `defaults.service.config`",
      });
    }
  }
  return issues;
}
