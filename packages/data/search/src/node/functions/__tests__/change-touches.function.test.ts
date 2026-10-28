/**
 * Stackra file contract:
 * Purpose: unit tests of `changeTouches`: creates and deletes always touch; an update touches when it names a read
 *          field, a presence field, or no field at all.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; data-layer gap se3.
 */
import { RowChangeKind } from "@stackra/outbox/contracts";
import { describe, expect, it } from "@stackra/testing";

import { changeTouches } from "#node/functions/change-touches.function";

const READ = new Set(["title"]);
const change = (kind: RowChangeKind, fields: readonly string[]) => ({
  model: "Article",
  id: "art_1",
  kind,
  fields,
});

describe("changeTouches", () => {
  it("counts every create and delete", () => {
    expect(changeTouches(change(RowChangeKind.Created, ["price"]), READ)).toBe(true);
    expect(changeTouches(change(RowChangeKind.Deleted, []), READ)).toBe(true);
  });

  it("counts an update of a read field, a presence field or no named field", () => {
    expect(changeTouches(change(RowChangeKind.Updated, ["price", "title"]), READ)).toBe(true);
    expect(changeTouches(change(RowChangeKind.Updated, ["archivedAt"]), READ)).toBe(true);
    expect(changeTouches(change(RowChangeKind.Updated, []), READ)).toBe(true);
    expect(changeTouches(change(RowChangeKind.Updated, ["price"]), READ)).toBe(false);
  });
});
