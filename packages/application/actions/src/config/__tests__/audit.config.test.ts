/**
 * Stackra file contract:
 * Purpose: unit tests of `AuditConfig`, `AuditOptions` and `AUDIT_CONFIG_SCHEMA` (STA-1571): keyed `actions.audit`,
 *          the environment read from `STACKRA_ENVIRONMENT`, `dev` when it is unset (as every reader of it), the default
 *          equal to the initializer, and an empty name refused at boot, never read as `dev`; and `UNAUDITED_ENVIRONMENTS`, `dev`
 *          and `test` only.
 * Boundary: test only; the raw environment is passed in, never the process's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0212 (decisions 1 and 4); ADR 0294 (decisions 19, 20 and 26).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { AuditConfig } from "#config/audit.config";
import { AUDIT_CONFIG_SCHEMA } from "#core/constants/audit-config-schema.constant";
import { UNAUDITED_ENVIRONMENTS } from "#core/constants/unaudited-environments.constant";
import { AuditOptions } from "#core/schemas/audit-options.schema";

describe("AuditConfig", () => {
  it("is a configuration keyed actions.audit whose default is dev", () => {
    expect(new AuditConfig()).toBeInstanceOf(Config);
    expect(configKey(AuditConfig, "actions")).toBe("actions.audit");
    expect(schemaOf(AuditOptions)).toBe(AUDIT_CONFIG_SCHEMA);
    expect({ ...new AuditOptions() }).toEqual(AUDIT_CONFIG_SCHEMA.parse({}));
    expect(buildConfig(AuditConfig).environment).toBe("dev");
  });

  it("reads the environment from STACKRA_ENVIRONMENT", () => {
    expect(
      buildConfig(AuditConfig, { env: { STACKRA_ENVIRONMENT: "production" } }).environment,
    ).toBe("production");
  });

  it("refuses an empty environment name at boot instead of reading it as dev", () => {
    expect(() => buildConfig(AuditConfig, { env: { STACKRA_ENVIRONMENT: "" } })).toThrow(
      ConfigInvalidError,
    );
    expect(() => buildConfig(AuditConfig, { values: { environment: "" } })).toThrow(
      ConfigInvalidError,
    );
  });

  it("lets only dev and test run an action unaudited", () => {
    expect(UNAUDITED_ENVIRONMENTS).toEqual(["dev", "test"]);
    expect(Object.isFrozen(UNAUDITED_ENVIRONMENTS)).toBe(true);
  });
});
