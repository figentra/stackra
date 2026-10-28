/**
 * Stackra file contract:
 * Purpose: unit tests of `gcpRuntimeConfig`: production's Postgres server in KSA with a standby, 35 daily backups and
 *          seven days of point-in-time recovery on its VPC; staging's with Cloud SQL's default backups and no recovery
 *          window; a dedicated tenant's in its own project; pgaudit on by default, sized by the runway or off on
 *          `false`, an unknown class refused; no server where the runway declares none; a server without a tier or
 *          version refused.
 * Boundary: test only; roots are built through `parseRunway`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0186, ADR 0238, ADR 0401.
 */
import { RunwayInvalidError } from "@stackra/runway";
import { describe, expect, it } from "@stackra/testing";

import { gcpRuntimeConfig } from "#core/functions/gcp-runtime-config.function";
import { at, gcpRoot } from "#core/functions/__tests__/fixtures/gcp-root.fixture";

describe("gcpRuntimeConfig", () => {
  it("sizes production's server, backups and recovery window in its KSA region", () => {
    const config = gcpRuntimeConfig(gcpRoot(), "production");

    expect(config.region).toBe("me-central2");
    expect(config.database).toEqual({
      tier: "db-custom-2-7680",
      version: "POSTGRES_17",
      highAvailability: true,
      retainedBackups: 35,
      pitr: { days: 7 },
      pgaudit: { log: ["ddl", "role"], retentionDays: 400 },
      network: "ref:gcp.network.prod",
    });
  });

  it("keeps backups on with Cloud SQL's defaults when the runway does not size them", () => {
    expect(gcpRuntimeConfig(gcpRoot(), "staging").database).toEqual({
      tier: "db-custom-1-3840",
      version: "POSTGRES_17",
      highAvailability: false,
      retainedBackups: null,
      pitr: false,
      pgaudit: { log: ["ddl", "role"], retentionDays: 400 },
      network: null,
    });
  });

  it("puts a dedicated tenant's server in its own project", () => {
    const config = gcpRuntimeConfig(gcpRoot(), "production", "firm");
    expect(config.deployment).toBe("acme-firm");
    expect(config.cloudProject.id).toBe("acme-firm");
    expect(config.database?.pitr).toEqual({ days: 7 });
  });

  it("audits with pgaudit by default, takes the runway's classes and days, and turns it off on false", () => {
    const sized = gcpRoot((draft) => {
      at(draft, "environments", "production", "shared", "database").pgaudit = {
        log: ["ddl", "role", "write"],
        retentionDays: 730,
      };
      at(draft, "environments", "staging", "shared", "database").pgaudit = false;
    });

    expect(gcpRuntimeConfig(sized, "production").database?.pgaudit).toEqual({
      log: ["ddl", "role", "write"],
      retentionDays: 730,
    });
    expect(gcpRuntimeConfig(sized, "staging").database?.pgaudit).toBe(false);
    const unknown = gcpRoot((draft) => {
      at(draft, "environments", "staging", "shared", "database").pgaudit = { log: ["all"] };
    });
    expect(() => gcpRuntimeConfig(unknown, "staging")).toThrow(
      /environments\.staging\.shared\.database\.pgaudit/,
    );
  });

  it("gives no server where the runway declares none and refuses one without a tier or version", () => {
    const none = gcpRoot((draft) => {
      delete at(draft, "environments", "staging", "shared").database;
    });
    expect(gcpRuntimeConfig(none, "staging").database).toBeNull();
    const partial = gcpRoot((draft) => {
      at(draft, "environments", "staging", "shared").database = { backups: { pitr: true } };
    });
    expect(() => gcpRuntimeConfig(partial, "staging")).toThrow(RunwayInvalidError);
  });
});
