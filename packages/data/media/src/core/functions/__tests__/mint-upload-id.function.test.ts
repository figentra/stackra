/**
 * Stackra file contract:
 * Purpose: unit tests of `mintUploadId`: `upl_` and 26 Crockford base32 characters that the upload schema accepts,
 *          unique across many calls, and time-ordered by their leading characters.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231 (public ids).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { mintUploadId } from "#core/functions/mint-upload-id.function";
import { Upload } from "#core/values/upload.value";

describe("mintUploadId", () => {
  it("mints public ids the upload schema accepts", () => {
    const id = mintUploadId();
    expect(id).toMatch(/^upl_[0-9a-hjkmnp-tv-z]{26}$/);
    expect(Upload.schema.safeParse({ id }).success).toBe(true);
  });

  it("never repeats", () => {
    const ids = new Set(Array.from({ length: 1_000 }, () => mintUploadId()));
    expect(ids.size).toBe(1_000);
  });

  it("orders ids by time", () => {
    vi.useFakeTimers({ now: new Date("2026-10-24T09:00:00.000Z"), toFake: ["Date"] });
    try {
      const earlier = mintUploadId();
      vi.setSystemTime(new Date("2026-10-24T09:00:01.000Z"));
      expect(mintUploadId().slice(0, 14) > earlier.slice(0, 14)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
