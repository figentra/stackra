/**
 * Stackra file contract:
 * Purpose: data tests of the draft `sa`, `ae` and `eg` base packs in `assets/data/packs/`: each passes `MarketPack$`
 *          and the `identity.*` schemas of `BASE_PACK_SCHEMAS`, is `draft` with a counsel review pending, and its
 *          `identity.national_ids` and `identity.address_format` feed @stackra/validation's `nationalId` and `address`
 *          without a cast; the `us` address format passes the same schema.
 * Boundary: test only; reads the shipped JSON from disk. It checks shape and that sample numbers of each issued kind
 *           pass, never whether a value is legally right: that is the reviewer sign-off the launch gate asks for.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370; ADR 0405;
 *                     ADR 0417; STA-1269; STA-1301.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "@stackra/testing";
import { AddressFormat$, NationalIdFormats$, address, nationalId } from "@stackra/validation";

import { BASE_PACK_SCHEMAS } from "#core/constants/base-pack-schemas.constant";
import { MARKET_PACK_SCHEMA } from "#core/constants/market-pack-schema.constant";
import { PackStatus } from "#core/enums/pack-status.enum";
import { launchGate } from "#core/functions/launch-gate.function";
import { resolvePack } from "#core/functions/resolve-pack.function";
import { valueOf } from "#core/functions/value-of.function";
import { PackSchemaRegistry } from "#core/values/pack-schema-registry.value";

const folder = new URL("../../../assets/data/packs/", import.meta.url);

/** The shipped pack of `market`. */
const read = (market: string) =>
  MARKET_PACK_SCHEMA.parse(JSON.parse(readFileSync(new URL(`${market}.json`, folder), "utf8")));

const packs = ["sa", "ae", "eg"].map(read);

const drafts = { statuses: [PackStatus.Draft] };

const registry = PackSchemaRegistry.create(BASE_PACK_SCHEMAS);

/** The identity formats `market` resolves to. */
const identityOf = (market: string) => {
  const resolved = resolvePack(packs, market, drafts);
  return {
    ids: NationalIdFormats$.parse(valueOf(resolved, "identity.national_ids", "2026-07-01")?.value),
    format: AddressFormat$.parse(valueOf(resolved, "identity.address_format", "2026-07-01")?.value),
  };
};

describe("SA, AE and EG seed packs", () => {
  it("are draft base packs that pass the identity schemas and wait for counsel", () => {
    for (const pack of packs) {
      expect(pack.status).toBe(PackStatus.Draft);
      expect(pack.extends).toBeUndefined();
      expect(registry.check(pack)).toEqual([]);
      expect(launchGate(resolvePack(packs, pack.market, drafts), "os").ready).toBe(false);
    }
  });

  it("check each document kind the market issues", () => {
    const sa = nationalId(identityOf("sa").ids);
    expect(sa.safeParse({ country: "SA", kind: "national_id", number: "1012345672" }).success).toBe(
      true,
    );
    expect(
      sa.safeParse({ country: "SA", kind: "residence_permit", number: "2012345670" }).success,
    ).toBe(true);
    expect(
      sa.safeParse({ country: "SA", kind: "residence_permit", number: "2012345671" }).success,
    ).toBe(false);
    const ae = nationalId(identityOf("ae").ids);
    expect(
      ae.safeParse({ country: "AE", kind: "emirates_id", number: "784198012345678" }).success,
    ).toBe(true);
    const eg = nationalId(identityOf("eg").ids);
    expect(
      eg.safeParse({ country: "EG", kind: "national_id", number: "29001011234567" }).success,
    ).toBe(true);
    expect(
      eg.safeParse({ country: "EG", kind: "emirates_id", number: "29001011234567" }).success,
    ).toBe(false);
  });

  it("build an address check from each format", () => {
    for (const market of ["sa", "ae", "eg"]) {
      const format = identityOf(market).format;
      expect(() => address(format)).not.toThrow();
      expect(format.required.length).toBeGreaterThan(0);
    }
    expect(new RegExp(String(identityOf("sa").format.shortCode?.pattern)).test("RRRD2929")).toBe(
      true,
    );
    expect(new RegExp(String(identityOf("ae").format.region?.pattern)).test("DU")).toBe(true);
  });

  it("let the us address format pass the same schema", () => {
    const us = read("us");
    expect(registry.check(us).filter((issue) => issue.key.startsWith("identity.address"))).toEqual(
      [],
    );
  });
});
