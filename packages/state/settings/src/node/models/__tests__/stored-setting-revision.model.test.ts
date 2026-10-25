/**
 * Stackra file contract:
 * Purpose: unit and type tests of `StoredSettingRevision`: a model with the `ssr` public id and the timestamps, no
 *          `@Index`, and its status and environment typed by the contracts enums.
 * Boundary: test only; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 5); ADR 0135.
 */
import { Index, Model, traitsOf } from "@stackra/model";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { SettingEnvironment, SettingRevisionStatus } from "#contracts/index";
import { StoredSettingRevision } from "#node/models/stored-setting-revision.model";

describe("StoredSettingRevision", () => {
  it("is a model with the ssr public id and the timestamps", () => {
    expect(new StoredSettingRevision()).toBeInstanceOf(Model);
    expect(traitsOf(StoredSettingRevision)[0]?.options).toEqual({ prefix: "ssr" });
    expect(new StoredSettingRevision().id).toMatch(/^ssr_[0-9a-z]{26}$/);
  });

  it("leaves its indexes to the migration and types its state", () => {
    expect(Index.on(StoredSettingRevision)).toEqual([]);
    expectTypeOf<StoredSettingRevision["status"]>().toEqualTypeOf<SettingRevisionStatus>();
    expectTypeOf<StoredSettingRevision["environment"]>().toEqualTypeOf<SettingEnvironment>();
    expectTypeOf<StoredSettingRevision["effectiveAt"]>().toEqualTypeOf<Date>();
  });
});
