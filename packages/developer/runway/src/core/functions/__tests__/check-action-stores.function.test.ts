/**
 * Stackra file contract:
 * Purpose: unit tests of `checkActionStores` (STA-2798): a service whose manifest binds the action stores passes when
 *          every deployed environment the root declares selects `postgres` or `valkey` (the member's own value, else
 *          the root's default), and is reported at `environments.<env>.config.actions.stores.<field>` when one keeps
 *          `memory`, explicitly or by default; `dev`, undeclared environments, unbound stores and a missing manifest
 *          are never checked.
 * Boundary: test only; runways are built through `parseRunway`, so each is a checked shape; manifests are the
 *           `drivers` rows gen writes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (enforcement); ADR 0266 (decision 2); STA-2798.
 */
import { describe, expect, it } from "@stackra/testing";

import { checkActionStores } from "#core/functions/check-action-stores.function";
import { parseRunway } from "#core/functions/parse-runway.function";

/** A root runway with `dev`, `staging` and `production`, whose services default to `stores` in production. */
const rootWith = (stores?: Record<string, string>) =>
  parseRunway("root", {
    version: 3,
    project: "acme-platform",
    environments: {
      dev: { defaults: { service: { config: { "actions.stores": {} } } } },
      staging: {},
      production:
        stores === undefined
          ? {}
          : { defaults: { service: { config: { "actions.stores": stores } } } },
    },
  });

/** A service runway with `environments`. */
const serviceWith = (environments: Record<string, unknown> = {}) =>
  parseRunway("service", { version: 3, environments });

/** A generated manifest that binds both action stores (and another port). */
const BOTH = {
  drivers: [
    { key: "actions.IdempotencyStore", selectedBy: "config:actions.stores.idempotency" },
    { key: "actions.RateLimitStore", selectedBy: "config:actions.stores.rateLimit" },
    { key: "cache.Cache", selectedBy: "config:cache.driver" },
  ],
};

const DURABLE = { idempotency: "postgres", rateLimit: "valkey" };

describe("checkActionStores", () => {
  it("passes when the root's defaults and the member select durable stores in every deployed environment", () => {
    expect(
      checkActionStores(
        rootWith(DURABLE),
        serviceWith({ staging: { config: { "actions.stores": DURABLE } } }),
        BOTH,
      ),
    ).toEqual([]);
  });

  it("reports each deployed environment that keeps a bound store in memory by default", () => {
    const issues = checkActionStores(rootWith(), serviceWith(), BOTH);

    expect(issues.map(({ path }) => path)).toEqual([
      "environments.staging.config.actions.stores.idempotency",
      "environments.staging.config.actions.stores.rateLimit",
      "environments.production.config.actions.stores.idempotency",
      "environments.production.config.actions.stores.rateLimit",
    ]);
    expect(issues[0]?.message).toMatch(
      /^staging keeps actions\.IdempotencyStore in memory \(the default\), .* set `config\.actions\.stores\.idempotency` to postgres or valkey/,
    );
  });

  it("reports an explicit memory store, the member's value winning over the root's", () => {
    const issues = checkActionStores(
      rootWith(DURABLE),
      serviceWith({
        staging: { config: { "actions.stores": DURABLE } },
        production: { config: { "actions.stores": { rateLimit: "memory" } } },
      }),
      BOTH,
    );

    expect(issues).toEqual([
      {
        path: "environments.production.config.actions.stores.rateLimit",
        message: expect.stringMatching(/^production keeps actions\.RateLimitStore in memory, /),
      },
    ]);
  });

  it("checks only the stores the manifest binds", () => {
    const manifest = { drivers: [{ key: "actions.RateLimitStore" }] };
    const issues = checkActionStores(
      rootWith({ rateLimit: "postgres" }),
      serviceWith({ staging: { config: { "actions.stores": { rateLimit: "valkey" } } } }),
      manifest,
    );

    expect(issues).toEqual([]);
  });

  it("checks nothing for a member that binds no store or has no manifest", () => {
    expect(
      checkActionStores(rootWith(), serviceWith(), { drivers: [{ key: "cache.Cache" }] }),
    ).toEqual([]);
    expect(checkActionStores(rootWith(), serviceWith(), undefined)).toEqual([]);
    expect(checkActionStores(rootWith(), serviceWith(), { drivers: "none" })).toEqual([]);
  });

  it("skips dev and every environment the root does not declare", () => {
    const root = parseRunway("root", {
      version: 3,
      project: "acme-platform",
      environments: { dev: {} },
    });

    expect(checkActionStores(root, serviceWith(), BOTH)).toEqual([]);
  });
});
