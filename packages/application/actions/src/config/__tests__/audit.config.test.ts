/**
 * Stackra file contract:
 * Purpose: unit tests of `AuditConfig`, `AuditOptions` and `AUDIT_CONFIG_SCHEMA` (STA-1571, STA-2844): keyed
 *          `actions.audit`, the environment read from `STACKRA_ENVIRONMENT` as one of `StackraEnvironment`, no default
 *          of its own (unset stays unset, so the one reader decides, never this package), the default equal to the
 *          initializer, and a misspelt or empty name and any value from the values layer refused at boot.
 * Boundary: test only; the raw environment is passed in, never the process's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0212 (decisions 1 and 4); ADR 0294 (decisions 19, 20 and 26); ADR 0296
 *                     (amendment 2026-11-26).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { AuditConfig } from "#config/audit.config";
import { AUDIT_CONFIG_SCHEMA } from "#core/constants/audit-config-schema.constant";
import { AuditOptions } from "#core/schemas/audit-options.schema";

describe("AuditConfig", () => {
  it("is a configuration keyed actions.audit with no default environment of its own", () => {
    expect(new AuditConfig()).toBeInstanceOf(Config);
    expect(configKey(AuditConfig, "actions")).toBe("actions.audit");
    expect(schemaOf(AuditOptions)).toBe(AUDIT_CONFIG_SCHEMA);
    expect({ ...new AuditOptions() }).toEqual(AUDIT_CONFIG_SCHEMA.parse({}));
    expect(buildConfig(AuditConfig).environment).toBeUndefined();
  });

  it.each(["dev", "test", "preview", "staging", "production"])(
    "reads %s from STACKRA_ENVIRONMENT",
    (environment) => {
      expect(
        buildConfig(AuditConfig, { env: { STACKRA_ENVIRONMENT: environment } }).environment,
      ).toBe(environment);
    },
  );

  it.each(["prod", "Production", "development", ""])(
    "refuses %o at boot instead of reading it as some environment",
    (named) => {
      expect(() => buildConfig(AuditConfig, { env: { STACKRA_ENVIRONMENT: named } })).toThrow(
        ConfigInvalidError,
      );
    },
  );

  it("refuses the environment as a value: it is read from the runtime only", () => {
    expect(() => buildConfig(AuditConfig, { values: { environment: "dev" } })).toThrow(
      /is safety-critical: it is read from STACKRA_ENVIRONMENT in the runtime environment only/,
    );
  });
});
