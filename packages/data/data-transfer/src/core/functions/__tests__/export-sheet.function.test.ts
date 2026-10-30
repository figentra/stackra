/**
 * Stackra file contract:
 * Purpose: unit tests of `exportSheet`: unclassified columns are written in the requested order; a classified column is
 *          dropped unless its class is opted in; a credential column is never written, even opted in; values become
 *          cells (JSON for objects, null when missing).
 * Boundary: unit tier; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367; ADR 0494.
 */
import { DataClassification } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { exportSheet } from "#core/functions/export-sheet.function";
import type { TabularCell } from "#contracts/types/tabular-cell.type";
import type { TabularSheet } from "#contracts/types/tabular-sheet.type";

const classes = new Map<string, DataClassification>([
  ["email", DataClassification.Personal],
  ["accessToken", DataClassification.Credential],
  ["clientSecret", DataClassification.Credential],
]);

const connections = [
  {
    id: "conn_1",
    provider: "shopify",
    email: "ops@example.com",
    accessToken: "tok_live",
    clientSecret: "sec_live",
    scopes: ["read_orders"],
  },
  { id: "conn_2", provider: "salla" },
];

const columns = ["id", "provider", "email", "accessToken", "clientSecret", "scopes"];

/** The rows of a sheet built here, which are always an array. */
const rowsOf = (sheet: TabularSheet): (readonly TabularCell[])[] => [
  ...(sheet.rows as Iterable<readonly TabularCell[]>),
];

describe("exportSheet", () => {
  it("writes the unclassified columns and drops the classified ones by default", () => {
    const sheet = exportSheet(connections, { name: "connections", columns, classes });
    expect(sheet.name).toBe("connections");
    expect(rowsOf(sheet)).toEqual([
      ["id", "provider", "scopes"],
      ["conn_1", "shopify", '["read_orders"]'],
      ["conn_2", "salla", null],
    ]);
  });

  it("writes an opted-in class, but never a credential, even opted in", () => {
    const sheet = exportSheet(connections, {
      name: "connections",
      columns,
      classes,
      include: [DataClassification.Personal, DataClassification.Credential],
    });
    const [header, first] = rowsOf(sheet);
    expect(header).toEqual(["id", "provider", "email", "scopes"]);
    expect(first).not.toContain("tok_live");
    expect(first).not.toContain("sec_live");
  });
});
