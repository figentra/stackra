/**
 * Stackra file contract:
 * Purpose: proves `acceptsFile` takes everything with no rules, and matches a rule by extension (any case), by a
 *          `type/*` family or by an exact MIME type.
 * Boundary: pure function, no DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
import { acceptsFile } from "#core/functions/accepts-file.function";

describe("acceptsFile", () => {
  it("takes any file when no rule is given", () => {
    expect(acceptsFile(undefined, { name: "a.exe" })).toBe(true);
    expect(acceptsFile([], { name: "a.exe", type: "application/x-msdownload" })).toBe(true);
  });

  it("matches an extension, a family and an exact type", () => {
    expect(acceptsFile([".csv"], { name: "STOCK.CSV" })).toBe(true);
    expect(acceptsFile(["image/*"], { name: "shot.png", type: "image/png" })).toBe(true);
    expect(acceptsFile(["application/pdf"], { name: "x", type: "application/pdf" })).toBe(true);
    expect(acceptsFile(["image/*", ".pdf"], { name: "notes.txt", type: "text/plain" })).toBe(false);
    expect(acceptsFile(["image/*"], { name: "unknown" })).toBe(false);
  });
});
