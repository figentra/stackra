/**
 * Stackra file contract:
 * Purpose: unit and type tests of `StoredSetting`: a model with the `sst` public id and the timestamps, a fresh id per
 *          created row, no `@Index` (the indexes are the migration's), and a node or a user as its holder.
 * Boundary: test only; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decisions 3 and 9); ADR 0135.
 */
import type { PublicId } from "@stackra/contracts";
import { Index, Model, traitsOf } from "@stackra/model";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { SettingValue } from "#contracts/index";
import { StoredSetting } from "#node/models/stored-setting.model";

describe("StoredSetting", () => {
  it("is a model with the sst public id and the timestamps", () => {
    expect(new StoredSetting()).toBeInstanceOf(Model);
    expect(traitsOf(StoredSetting).map((trait) => trait.name)).toEqual([
      "has_public_id",
      "timestamps",
    ]);
    expect(traitsOf(StoredSetting)[0]?.options).toEqual({ prefix: "sst" });
  });

  it("mints a fresh sst id per created row", () => {
    const first = new StoredSetting();
    expect(first.id).toMatch(/^sst_[0-9a-z]{26}$/);
    expect(new StoredSetting().id).not.toBe(first.id);
    expectTypeOf(first.id).toEqualTypeOf<PublicId<"sst">>();
  });

  it("leaves its indexes to the migration and types its holder and values", () => {
    expect(Index.on(StoredSetting)).toEqual([]);
    expectTypeOf<StoredSetting["scopeId"]>().toEqualTypeOf<PublicId<"scp"> | null>();
    expectTypeOf<StoredSetting["userId"]>().toEqualTypeOf<PublicId<"usr"> | null>();
    expectTypeOf<StoredSetting["values"]>().toEqualTypeOf<Readonly<Record<string, SettingValue>>>();
  });
});
