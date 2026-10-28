/**
 * Stackra file contract:
 * Purpose: unit tests of `PublicIdType`: a public id is stored as its UUID and loaded with the type's prefix, a raw
 *          stored UUID and nulls pass through, and the column is a native `uuid`.
 * Boundary: test only; calls the conversions directly, without an ORM.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0135 (2026-10-28 amendment).
 */
import { mintPublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { publicIdToUuid } from "#core/functions/public-id-to-uuid.function";
import { LinkType } from "#core/orm/link.type";
import { PublicIdType } from "#core/orm/public-id.type";
import { Link } from "#core/values/link.value";

describe(PublicIdType, () => {
  const type = new PublicIdType("ord");
  const id = mintPublicId("ord");
  const uuid = publicIdToUuid(id);

  it("stores the UUID and loads the public id", () => {
    expect(type.convertToDatabaseValue(id)).toBe(uuid);
    expect(type.convertToDatabaseValue(uuid)).toBe(uuid);
    expect(type.convertToJSValue(uuid)).toBe(id);
    expect(type.convertToDatabaseValue(null)).toBeNull();
    expect(type.convertToJSValue(undefined)).toBeUndefined();
    expect(() => type.convertToDatabaseValue("nonsense")).toThrow(TypeError);
  });

  it("is a native uuid column compared as a string", () => {
    expect(type.getColumnType()).toBe("uuid");
    expect(type.compareAsType()).toBe("string");
  });
});

describe("LinkType with a prefix", () => {
  const type = new LinkType("catalogue.variant", "var");
  const id = mintPublicId("var");
  const uuid = publicIdToUuid(id);

  it("stores the target's UUID in a uuid column and loads a link with its public id", () => {
    expect(type.getColumnType()).toBe("uuid");
    expect(type.convertToDatabaseValue(new Link("catalogue.variant", id))).toBe(uuid);
    const link = type.convertToJSValue(uuid) as Link<{ id: string }>;
    expect(link.id).toBe(id);
  });
});
