/**
 * Stackra file contract:
 * Purpose: unit tests of `checkRuntimeOnlyConfig`: a member's `environments.<name>.config` and the root's
 *          `environments.<name>.defaults.service.config` that set a runtime-only field are refused at their path,
 *          naming the variable and never the value; another field of the same block, another config key and a document
 *          without `config` pass, and no fields means no findings (STA-2844).
 * Boundary: test only; pure inputs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0296 (amendment
 *                     2026-11-26); STA-2844.
 */
import { describe, expect, it } from "@stackra/testing";

import { checkRuntimeOnlyConfig } from "#core/functions/check-runtime-only-config.function";
import type { RuntimeOnlyField } from "#core/types/runtime-only-field.type";

const FIELDS: RuntimeOnlyField[] = [
  { config: "outbox.relay_inbox", field: "environment", variable: "STACKRA_ENVIRONMENT" },
  { config: "market_packs", field: "environment", variable: "STACKRA_ENVIRONMENT" },
];

describe("checkRuntimeOnlyConfig", () => {
  it("refuses a member's config block that sets the running environment, never printing the value", () => {
    const issues = checkRuntimeOnlyConfig(
      {
        version: 3,
        environments: {
          production: {
            config: { "outbox.relay_inbox": { environment: "dev-relaxed", keys: {} } },
          },
          staging: { config: { outbox: { batch: 10 } } },
        },
      },
      FIELDS,
    );
    expect(issues).toEqual([
      {
        path: "environments.production.config.outbox.relay_inbox.environment",
        message: expect.stringContaining(
          "is read from STACKRA_ENVIRONMENT in the runtime environment only, never set as a runway config value",
        ) as string,
      },
    ]);
    expect(JSON.stringify(issues)).not.toContain("dev-relaxed");
  });

  it("refuses the root's service defaults that set it", () => {
    expect(
      checkRuntimeOnlyConfig(
        {
          environments: {
            staging: {
              defaults: { service: { config: { market_packs: { environment: "dev" } } } },
            },
          },
        },
        FIELDS,
      ).map((issue) => issue.path),
    ).toEqual(["environments.staging.defaults.service.config.market_packs.environment"]);
  });

  it("passes other fields, other keys, documents without config, and no fields", () => {
    expect(
      checkRuntimeOnlyConfig(
        {
          environments: {
            dev: {
              config: {
                "outbox.relay_inbox": { keys: {} },
                observability: { environment: "dev" },
              },
            },
          },
        },
        FIELDS,
      ),
    ).toEqual([]);
    expect(checkRuntimeOnlyConfig({ version: 3, port: 4000 }, FIELDS)).toEqual([]);
    expect(
      checkRuntimeOnlyConfig(
        { environments: { dev: { config: { market_packs: { environment: "dev" } } } } },
        [],
      ),
    ).toEqual([]);
  });
});
