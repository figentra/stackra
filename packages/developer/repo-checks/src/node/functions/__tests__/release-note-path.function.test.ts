/**
 * Stackra file contract:
 * Purpose: unit tests of `releaseNotePath`: a release before 1.0.0 maps to its minor's page, one after to its major's.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0013 (decision 5); STA-2835; ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { releaseNotePath } from "#node/functions/release-note-path.function";

describe("releaseNotePath", () => {
  it("maps a version to its release line's page", () => {
    expect(releaseNotePath("0.30.0")).toBe("apps/docs/src/docs/customers/upgrading/0-30.mdx");
    expect(releaseNotePath("0.33.1")).toBe("apps/docs/src/docs/customers/upgrading/0-33.mdx");
    expect(releaseNotePath("1.0.0")).toBe("apps/docs/src/docs/customers/upgrading/1.mdx");
    expect(releaseNotePath("2.4.1")).toBe("apps/docs/src/docs/customers/upgrading/2.mdx");
  });
});
