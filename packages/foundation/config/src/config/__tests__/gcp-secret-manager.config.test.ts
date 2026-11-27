/**
 * Stackra file contract:
 * Purpose: unit tests of `GcpSecretManagerConfig`, its shape and `GCP_SECRET_MANAGER_CONFIG_SCHEMA`: keyed
 *          `config.gcp_secret_manager`, built with the shipped defaults (equal to the initializers), taking a
 *          project, location, ids (pinned or not) and a timeout, and refusing a bad project, location, id or timeout.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 19, 20 and 26); ADR 0371 (amendment 2026-11-27).
 */
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { GcpSecretManagerConfig } from "#config/gcp-secret-manager.config";
import { GCP_SECRET_MANAGER_CONFIG_SCHEMA } from "#core/constants/gcp-secret-manager-config-schema.constant";
import { buildConfig } from "#core/functions/build-config.function";
import { configKey } from "#core/functions/config-key.function";
import { GcpSecretManagerOptions } from "#core/schemas/gcp-secret-manager-options.schema";

describe("GcpSecretManagerConfig", () => {
  it("is keyed config.gcp_secret_manager with defaults equal to the initializers", () => {
    expect(configKey(GcpSecretManagerConfig, "config")).toBe("config.gcp_secret_manager");
    expect(schemaOf(GcpSecretManagerOptions)).toBe(GCP_SECRET_MANAGER_CONFIG_SCHEMA);
    expect({ ...new GcpSecretManagerOptions() }).toEqual(
      GCP_SECRET_MANAGER_CONFIG_SCHEMA.parse({}),
    );
  });

  it("takes a project, location, pinned or latest ids and a timeout", () => {
    const config = buildConfig(GcpSecretManagerConfig, {
      values: {
        project: "acme-staging",
        location: "me-central2",
        secretIds: ["RESEND_API_KEY", "app-json@4", "other@latest"],
        timeoutMs: 2000,
      },
    });
    expect(config.secretIds).toEqual(["RESEND_API_KEY", "app-json@4", "other@latest"]);
    expect(config.timeoutMs).toBe(2000);
  });

  it("refuses a bad project, location, id or timeout", () => {
    for (const values of [
      { project: "Acme" },
      { project: "acme" },
      { location: "me central" },
      { secretIds: [""] },
      { secretIds: ["a/b"] },
      { secretIds: ["key@0"] },
      { timeoutMs: 50 },
      { timeoutMs: 60_001 },
    ])
      expect(GCP_SECRET_MANAGER_CONFIG_SCHEMA.safeParse(values).success).toBe(false);
  });
});
