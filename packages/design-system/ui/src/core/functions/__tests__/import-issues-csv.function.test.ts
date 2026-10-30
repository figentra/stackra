/**
 * Stackra file contract:
 * Purpose: proves the import error list is CSV with the header first, CRLF line ends, and cells holding a comma, a
 *          quote or a line break quoted with their quotes doubled; Arabic text passes through untouched.
 * Boundary: pure function; no library or DOM.
 * Runtime: node
 * Governing contract: RFC 4180; ADR 0022 (test placement); STA-1371.
 */
import { importIssuesCsv } from "#core/functions/import-issues-csv.function";

describe("importIssuesCsv", () => {
  it("writes the header, then one line per issue", () => {
    expect(
      importIssuesCsv(
        [{ row: 14, field: "Email", message: "Not an email" }],
        ["Row", "Field", "Problem"],
      ),
    ).toBe("Row,Field,Problem\r\n14,Email,Not an email");
  });

  it("quotes cells with commas, quotes or line breaks", () => {
    const csv = importIssuesCsv(
      [{ row: 3, field: "Name, full", message: 'Says "n/a"\nhere' }],
      ["Row", "Field", "Problem"],
    );
    expect(csv.split("\r\n")[1]).toBe('3,"Name, full","Says ""n/a""\nhere"');
  });

  it("keeps Arabic as written", () => {
    expect(importIssuesCsv([], ["الصف", "الحقل", "المشكلة"])).toBe("الصف,الحقل,المشكلة");
  });
});
