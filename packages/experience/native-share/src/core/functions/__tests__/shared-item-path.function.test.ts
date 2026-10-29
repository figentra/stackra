/**
 * Stackra file contract:
 * Purpose: unit tests of `sharedItemPath`: a shared file keeps its name inside the folder, and a name another app sent
 *          can never step out of it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0478 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import type { SharedItem } from "#contracts/types/shared-item.type";
import { sharedItemPath } from "#core/functions/shared-item-path.function";

/** A shared PDF called `name`. */
const pdf = (name: string | null): SharedItem => ({
  kind: "file",
  value: "file:///group/a.pdf",
  mimeType: "application/pdf",
  name,
});

describe("sharedItemPath", () => {
  it("keeps the file's name inside the folder behind a unique prefix", () => {
    expect(sharedItemPath(pdf("My Scan.pdf"))).toMatch(/^inbox\/[0-9a-z]+-My Scan\.pdf$/);
    expect(sharedItemPath(pdf("a.pdf"), "receipts")).toMatch(/^receipts\/[0-9a-z]+-a\.pdf$/);
  });

  it("gives two files with the same name different keys", () => {
    expect(sharedItemPath(pdf("image.jpg"))).not.toBe(sharedItemPath(pdf("image.jpg")));
  });

  it("turns path separators into underscores", () => {
    expect(sharedItemPath(pdf("../../etc/passwd"))).toMatch(
      /^inbox\/[0-9a-z]+-\.\._\.\._etc_passwd$/,
    );
    expect(sharedItemPath(pdf("a\\b\0c"))).toMatch(/^inbox\/[0-9a-z]+-a_b_c$/);
  });

  it("calls a nameless or dot-only file shared", () => {
    for (const name of [null, "", "..", "  "])
      expect(sharedItemPath(pdf(name))).toMatch(/^inbox\/[0-9a-z]+-shared$/);
  });
});
