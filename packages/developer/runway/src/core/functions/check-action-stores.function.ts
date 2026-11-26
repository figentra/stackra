/**
 * Stackra file contract:
 * Purpose: `checkActionStores(root, service, manifest)`, the durable-store check of a parsed service runway (STA-2798):
 *          for each action store the member's generated manifest binds (`actions.IdempotencyStore`,
 *          `actions.RateLimitStore`), every deployed environment the root declares (`preview`, `staging`,
 *          `production`) must select `postgres` or `valkey` in `config.actions.stores.<field>` (the member's, else the
 *          root's `defaults.service.config`). The default `memory` store forgets every Idempotency-Key on a restart, so a
 *          retried write runs twice, and keeps one set of token buckets per instance.
 * Boundary: pure; returns every failure instead of throwing, for `runway validate` and `stackra validate` to print with
 *           the file. `manifest` is the member's parsed `stackra.manifest.json` (or `undefined`): a member that binds
 *           neither store, or has no manifest yet, has nothing to check. `dev` is never checked. The same refusal runs
 *           at boot in @stackra/actions' `StoresConfig`; this one reports it before a deploy.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (enforcement: a value that cannot serve the environment fails `stackra validate`); ADR
 *                     0266 (decision 2); STA-2798.
 */
import { Enum } from "@stackra/contracts";

import { ACTION_STORE_PORTS } from "#core/constants/action-store-ports.constant";
import { DURABLE_ACTION_STORES } from "#core/constants/durable-action-stores.constant";
import { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import type { RootRunway } from "#core/types/root-runway.type";
import type { RunwayIssue } from "#core/types/runway-issue.type";
import type { ServiceRunway } from "#core/types/service-runway.type";

/** The config key of the action stores in a runway `config` map. */
const STORES_KEY = "actions.stores";

/** The manifest driver keys `manifest` binds; none when it is not a manifest. */
function driverKeysOf(manifest: unknown): Set<string> {
  const drivers: unknown =
    typeof manifest === "object" && manifest !== null
      ? (manifest as { drivers?: unknown }).drivers
      : undefined;
  const keys = new Set<string>();
  if (!Array.isArray(drivers)) return keys;
  for (const driver of drivers as unknown[]) {
    const key: unknown =
      typeof driver === "object" && driver !== null ? (driver as { key?: unknown }).key : undefined;
    if (typeof key === "string") keys.add(key);
  }
  return keys;
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
  const bound = driverKeysOf(manifest);
  const issues: RunwayIssue[] = [];
  for (const environment of Enum.values(RunwayEnvironment)) {
    if (environment === RunwayEnvironment.Dev || root.environments[environment] === undefined)
      continue;
    const own = service.environments[environment]?.config?.[STORES_KEY];
    const defaults = root.environments[environment]?.defaults?.service?.config?.[STORES_KEY];
    for (const [field, port] of Object.entries(ACTION_STORE_PORTS)) {
      if (!bound.has(port)) continue;
      const driver = own?.[field] ?? defaults?.[field];
      if (typeof driver === "string" && DURABLE_ACTION_STORES.includes(driver)) continue;
      issues.push({
        path: `environments.${environment}.config.${STORES_KEY}.${field}`,
        message:
          `${environment} keeps ${port} in ${typeof driver === "string" ? driver : "memory (the default)"}, ` +
          "which loses every record on a restart and is not shared between instances, so boot refuses it: set " +
          `\`config.${STORES_KEY}.${field}\` to ${DURABLE_ACTION_STORES.join(" or ")}, in the member or in the ` +
          "root's `defaults.service.config`",
      });
    }
  }
  return issues;
}
