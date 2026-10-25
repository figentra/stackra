/**
 * Stackra file contract:
 * Purpose: unit tests of `RULE_SET_PACK_SCHEMA`: it parses a versioned pack of rule-set templates (outcomes default to
 *          none), and refuses a version that is not `major.minor.patch`, a key that is not dotted lowercase and two
 *          templates with one key.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; config-model sections 4 and 6.
 */
import { describe, expect, it } from "@stackra/testing";

import { RULE_SET_PACK_SCHEMA } from "#core/constants/rule-set-pack-schema.constant";

/** A template. */
const RETURNS = { key: "commerce.returns", consumer: "orders.returns", condition: { all: [] } };

/** Whether `pack` parses. */
const parses = (pack: unknown): boolean => RULE_SET_PACK_SCHEMA.safeParse(pack).success;

describe("RULE_SET_PACK_SCHEMA", () => {
  it("parses a pack, its outcomes defaulting to none", () => {
    const pack = RULE_SET_PACK_SCHEMA.parse({
      key: "commerce",
      version: "1.2.0",
      ruleSets: [RETURNS],
    });
    expect(pack.ruleSets[0]?.outcomes).toEqual([]);
  });

  it("refuses a bad version, a bad key and a repeated template", () => {
    expect(parses({ key: "commerce", version: "1.2", ruleSets: [] })).toBe(false);
    expect(parses({ key: "Commerce", version: "1.2.0", ruleSets: [] })).toBe(false);
    expect(parses({ key: "commerce", version: "1.2.0", ruleSets: [RETURNS, RETURNS] })).toBe(false);
  });
});
