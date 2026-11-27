/**
 * Stackra file contract:
 * Purpose: unit tests of `errorCodeEntry` and `errorCodeDocs`: a listed code finds its row (in any case) and links to
 *          its group's heading; an unlisted code finds nothing and links to the page; every row of `ERROR_CODES` has a
 *          cause, a fix and an anchor, and no code is listed twice.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0231; STA-2891.
 */
import { describe, expect, it } from "@stackra/testing";

import { ERROR_CODES } from "#core/constants/error-codes.constant";
import { ERROR_CODES_PAGE } from "#core/constants/error-codes-page.constant";
import { errorCodeDocs } from "#core/functions/error-code-docs.function";
import { errorCodeEntry } from "#core/functions/error-code-entry.function";

describe("errorCodeEntry", () => {
  it("finds a gen, check and runway code, in any case", () => {
    expect(errorCodeEntry("shape_number_kind")).toMatchObject({
      tool: "gen",
      group: "Shapes and fields",
      anchor: "shapes-and-fields",
    });
    expect(errorCodeEntry("json-configs")?.tool).toBe("check");
    expect(errorCodeEntry(" runwaylockederror ")?.code).toBe("RunwayLockedError");
    expect(errorCodeEntry("no_such_code")).toBeUndefined();
  });
});

describe("errorCodeDocs", () => {
  it("links a listed code to its group and any other code to the page", () => {
    expect(errorCodeDocs("shape_number_kind")).toBe(`${ERROR_CODES_PAGE}#shapes-and-fields`);
    expect(errorCodeDocs("member_unplaced")).toBe(`${ERROR_CODES_PAGE}#runway-issue-codes`);
    expect(errorCodeDocs("no_such_code")).toBe(ERROR_CODES_PAGE);
  });
});

describe("ERROR_CODES", () => {
  it("gives every code one row with a cause, a fix and an anchor", () => {
    expect(ERROR_CODES.length).toBeGreaterThan(200);
    expect(new Set(ERROR_CODES.map((entry) => entry.code)).size).toBe(ERROR_CODES.length);
    expect(
      ERROR_CODES.filter(
        (entry) => entry.cause === "" || entry.fix === "" || !/^[a-z0-9-]+$/.test(entry.anchor),
      ),
    ).toEqual([]);
  });
});
