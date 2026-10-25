/**
 * Stackra file contract:
 * Purpose: barrel test of the `./node` entry: exactly the two models, their services and the two Postgres drivers; the
 *          migrations are found by their path and not re-exported.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/settings/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "PostgresSettingRevisionStoreDriver",
      "PostgresSettingValueStoreDriver",
      "StoredSetting",
      "StoredSettingRevision",
      "StoredSettingRevisionService",
      "StoredSettingService",
    ]);
  });
});
