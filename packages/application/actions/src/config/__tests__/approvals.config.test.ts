/**
 * Stackra file contract:
 * Purpose: unit tests of `ApprovalsConfig`, `ApprovalsOptions` and `APPROVALS_CONFIG_SCHEMA`: keyed
 *          `actions.approvals`, defaults equal to the initializers (an empty store service, which trusts nothing), a
 *          member name set by values, and a value that is not a member name refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 19, 20 and 26); ADR 0509 (decision 7).
 */
import { buildConfig, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { ApprovalsConfig } from "#config/approvals.config";
import { APPROVALS_CONFIG_SCHEMA } from "#core/constants/approvals-config-schema.constant";
import { ApprovalsOptions } from "#core/schemas/approvals-options.schema";

describe("ApprovalsConfig", () => {
  it("is keyed actions.approvals and trusts no service by default", () => {
    expect(configKey(ApprovalsConfig, "actions")).toBe("actions.approvals");
    expect(schemaOf(ApprovalsOptions)).toBe(APPROVALS_CONFIG_SCHEMA);
    expect({ ...new ApprovalsOptions() }).toEqual(APPROVALS_CONFIG_SCHEMA.parse({}));
    expect(APPROVALS_CONFIG_SCHEMA.parse({})).toEqual({ storeService: "" });
  });

  it("takes the store's member and refuses anything else", () => {
    expect(buildConfig(ApprovalsConfig, { values: { storeService: "tasks" } }).storeService).toBe(
      "tasks",
    );
    expect(() =>
      buildConfig(ApprovalsConfig, { values: { storeService: "Tasks Service" } }),
    ).toThrow(ConfigInvalidError);
  });
});
