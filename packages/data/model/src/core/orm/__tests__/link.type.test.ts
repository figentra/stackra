/**
 * Stackra file contract:
 * Purpose: unit tests of `LinkType`: a link or a raw id goes in as the id, a stored id comes out as a `Link` of the
 *          type's model, nulls pass through, and the column fits the longest public id.
 * Boundary: test only; calls the conversions directly, without an ORM.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 28); ADR 0135.
 */
import { describe, expect, it } from "@stackra/testing";

import { LinkType } from "#core/orm/link.type";
import { Link } from "#core/values/link.value";

const ID = "var_01jab3k4m5n6p7q8r9s0t1v2w3";

describe(LinkType, () => {
  const type = new LinkType("catalogue.variant");

  it("stores a link or a raw id as the id", () => {
    expect(type.convertToDatabaseValue(new Link("catalogue.variant", ID))).toBe(ID);
    expect(type.convertToDatabaseValue(ID)).toBe(ID);
    expect(type.convertToDatabaseValue(null)).toBeNull();
    expect(type.toJSON(new Link("catalogue.variant", ID))).toBe(ID);
  });

  it("loads a stored id as a link of its model", () => {
    const link = type.convertToJSValue(ID);
    expect(link).toBeInstanceOf(Link);
    expect((link as Link<{ id: string }>).model).toBe("catalogue.variant");
    expect((link as Link<{ id: string }>).id).toBe(ID);
    expect(type.convertToJSValue(undefined)).toBeUndefined();
  });

  it("compares as a string in a column that fits a 6-letter prefix", () => {
    expect(type.compareAsType()).toBe("string");
    expect(type.getColumnType()).toBe("varchar(33)");
    expect(`abcdef_${"0".repeat(26)}`).toHaveLength(33);
  });
});
