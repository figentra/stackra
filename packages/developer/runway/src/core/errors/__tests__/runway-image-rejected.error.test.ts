/**
 * Stackra file contract:
 * Purpose: unit tests of `RunwayImageRejectedError`: it names the step, the image and the reason.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0174; STA-609.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayImageRejectedError } from "#core/errors/runway-image-rejected.error";

describe("RunwayImageRejectedError", () => {
  it("names the step, the image and the reason", () => {
    const error = new RunwayImageRejectedError("scan", "r.example/acme:abc", "CVE-1 is fixable");

    expect(error.name).toBe("RunwayImageRejectedError");
    expect(error.step).toBe("scan");
    expect(error.image).toBe("r.example/acme:abc");
    expect(error.message).toBe(
      "r.example/acme:abc: the scan step refused the image: CVE-1 is fixable",
    );
  });
});
