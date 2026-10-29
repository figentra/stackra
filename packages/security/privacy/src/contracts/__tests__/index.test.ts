/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: exactly its values (the enum and the three ports), the
 *          erasure methods as an exact set, and the receipt and export shapes.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0294 (decision 15); BUILDER-RULES rule 6e (exact sets).
 */
import { Enum, Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import type { KeptRecords } from "@stackra/workflow";

import * as contracts from "#contracts/index";

describe("@stackra/privacy/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "ErasureMethod",
      "PersonalDataStore",
      "SubjectHolds",
      "SubjectSaltStore",
    ]);
  });

  it("has exactly three erasure methods", () => {
    expect([...Enum.values(contracts.ErasureMethod)].sort()).toEqual([
      "anonymise",
      "delete",
      "shred",
    ]);
    expectTypeOf<contracts.ErasureMethod>().toEqualTypeOf<"shred" | "delete" | "anonymise">();
  });

  it("makes the stores and the hold check ports", () => {
    expect(contracts.PersonalDataStore.prototype).toBeInstanceOf(Port);
    expect(contracts.SubjectSaltStore.prototype).toBeInstanceOf(Port);
    expect(contracts.SubjectHolds.prototype).toBeInstanceOf(Port);
  });

  it("keeps the receipt and export shapes", () => {
    expectTypeOf<contracts.ErasureReceipt["kept"]>().toEqualTypeOf<readonly KeptRecords[]>();
    expectTypeOf<contracts.ErasureReceipt["erased"]>().toEqualTypeOf<
      readonly contracts.ErasedRecords[]
    >();
    expectTypeOf<contracts.ErasureReceipt["shredded"]>().toEqualTypeOf<boolean>();
    expectTypeOf<contracts.SubjectExport["sections"]>().toEqualTypeOf<
      readonly contracts.SubjectExportSection[]
    >();
    expectTypeOf<contracts.SubjectRecord["id"]>().toEqualTypeOf<string>();
    expectTypeOf<contracts.PersonalDataOptions["fields"]>().toEqualTypeOf<
      Readonly<Record<string, contracts.ErasureMethod>>
    >();
  });
});
