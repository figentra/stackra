/**
 * Stackra file contract:
 * Purpose: unit tests of `exportColumns`: unclassified columns stay in order, a classified field (and a path under it)
 *          is dropped unless opted in, and the classes of the classified columns kept are reported once each.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 10).
 */
import { DataClassification } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { exportColumns } from "#node/functions/export-columns.function";

const classified = new Map<string, DataClassification>([
  ["email", DataClassification.Personal],
  ["customer", DataClassification.Personal],
  ["iban", DataClassification.Financial],
]);

describe("exportColumns", () => {
  it("drops classified columns and paths under them by default", () => {
    expect(
      exportColumns(["number", "email", "customer.name", "total"], classified, new Set()),
    ).toEqual({ columns: ["number", "total"], classes: [] });
  });

  it("keeps the opted-in classified columns and reports their classes once", () => {
    expect(
      exportColumns(
        ["email", "customer.name", "iban"],
        classified,
        new Set(["email", "customer.name"]),
      ),
    ).toEqual({ columns: ["email", "customer.name"], classes: [DataClassification.Personal] });
  });
});
