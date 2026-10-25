/**
 * Stackra file contract:
 * Purpose: unit tests of `limitBytes`: chunks pass up to the limit, the chunk past it is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { TransferLimitExceededError } from "#core/errors/transfer-limit-exceeded.error";
import { limitBytes } from "#core/functions/limit-bytes.function";

describe("limitBytes", () => {
  it("passes chunks up to the limit", async () => {
    const seen: number[] = [];
    for await (const chunk of limitBytes([new Uint8Array(2), new Uint8Array(2)], 4))
      seen.push(chunk.length);
    expect(seen).toEqual([2, 2]);
  });

  it("refuses past the limit", async () => {
    const chunks = limitBytes([new Uint8Array(3), new Uint8Array(2)], 4);
    expect((await chunks.next()).value).toHaveLength(3);
    await expect(chunks.next()).rejects.toThrow(TransferLimitExceededError);
  });
});
