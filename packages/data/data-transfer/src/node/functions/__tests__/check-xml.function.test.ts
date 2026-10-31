/**
 * Stackra file contract:
 * Purpose: unit tests of `checkXml`: a DTD or an entity declaration is refused (no XXE, no billion laughs), nesting
 *          past the depth ceiling is refused, and comments, processing instructions and self-closed elements pass
 *          (STA-1736).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { UnreadableWorkbookError } from "#core/errors/unreadable-workbook.error";
import { checkXml } from "#node/functions/check-xml.function";

/** The reason `xml` is refused with at `depth`, or `undefined`. */
function reasonOf(xml: string, depth = 64): string | undefined {
  try {
    checkXml(xml, depth);
  } catch (error) {
    if (error instanceof UnreadableWorkbookError) return error.reason;
    throw error;
  }
  return undefined;
}

/** `levels` nested `<a>` elements. */
const nested = (levels: number) => `${"<a>".repeat(levels)}${"</a>".repeat(levels)}`;

describe("checkXml", () => {
  it("refuses a DTD and an entity declaration", () => {
    expect(reasonOf('<!DOCTYPE x [<!ENTITY e SYSTEM "file:///etc/passwd">]><x>&e;</x>')).toBe(
      "doctype",
    );
    expect(reasonOf('<?xml version="1.0"?><!doctype lolz><lolz/>')).toBe("doctype");
    expect(reasonOf('<x><!ENTITY a "aaaa"></x>')).toBe("doctype");
  });

  it("refuses nesting past the depth ceiling", () => {
    expect(reasonOf(nested(64))).toBeUndefined();
    expect(reasonOf(nested(65))).toBe("too_deep");
  });

  it("counts no depth for comments, declarations and self-closed elements", () => {
    const xml = `<?xml version="1.0"?><!-- note --><a>${"<b/>".repeat(100)}<c><![CDATA[<d>]]></c></a>`;
    expect(reasonOf(xml, 2)).toBeUndefined();
    expect(checkXml(xml, 2)).toBe(xml);
  });
});
