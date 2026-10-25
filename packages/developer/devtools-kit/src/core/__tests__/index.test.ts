/**
 * Stackra file contract:
 * Purpose: unit test of the `.` barrel: it exports exactly the public runtime symbols (the kit, its error and the bus
 *          channel) and keeps the buffer size and the name pattern internal.
 * Boundary: test only; types have no runtime presence, so only values are listed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); ADR 0246.
 */
import { describe, expect, it } from "@stackra/testing";

import * as entry from "#core/index";

describe("@stackra/devtools-kit entry", () => {
  it("exports exactly the public symbols", () => {
    expect(Object.keys(entry).sort()).toEqual([
      "DEVTOOLS_BUS_CHANNEL",
      "DevtoolsError",
      "DevtoolsKit",
    ]);
  });

  it("keeps the buffer size and the name pattern internal", () => {
    expect(entry).not.toHaveProperty("DEVTOOLS_BUFFER_SIZE");
    expect(entry).not.toHaveProperty("DEVTOOLS_NAME_PATTERN");
  });
});
