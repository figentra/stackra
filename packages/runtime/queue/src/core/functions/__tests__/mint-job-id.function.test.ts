/**
 * Stackra file contract:
 * Purpose: unit tests of `mintJobId`: `job_` and 26 Crockford base32 characters, fresh on every call, sorting by
 *          creation time.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0135 (decision 1); ADR 0231.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { mintJobId } from "#core/functions/mint-job-id.function";

describe(mintJobId, () => {
  it("is job_ and 26 Crockford base32 characters", () => {
    expect(mintJobId()).toMatch(/^job_[0-9a-hjkmnp-tv-z]{26}$/);
  });

  it("is fresh on every call", () => {
    expect(new Set(Array.from({ length: 100 }, () => mintJobId())).size).toBe(100);
  });

  it("sorts by creation time", () => {
    const now = vi.spyOn(Date, "now");
    now.mockReturnValueOnce(1_000_000).mockReturnValueOnce(2_000_000);
    const first = mintJobId();
    const second = mintJobId();
    now.mockRestore();
    expect(first < second).toBe(true);
  });
});
