/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: it exports the two traits, the three models, the service and
 *          the entitlement, nothing else, and none of the `.` entry's symbols.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15: one symbol, one entry).
 */
import { describe, expect, it } from "@stackra/testing";

import * as core from "#core/index";
import * as node from "#node/index";

describe("@stackra/content/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "CustomField",
      "CustomFieldLimitEntitlement",
      "CustomFieldService",
      "CustomFieldValueSet",
      "HasCustomFields",
      "HasRevisions",
      "Publishable",
      "Revision",
      "RevisionService",
      "Schedulable",
      "Sluggable",
    ]);
  });

  it("shares no symbol with the `.` entry", () => {
    expect(Object.keys(node).filter((name) => name in core)).toEqual([]);
  });
});
