/**
 * Stackra file contract:
 * Purpose: unit tests of `cacheNodeType`: the smallest node whose usable three quarters hold the member's size, the
 *          smallest node when no size is given, the boundary on both sides, and `undefined` above the largest node.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { cacheNodeType } from "#core/functions/cache-node-type.function";

describe("cacheNodeType", () => {
  it("picks the smallest node whose usable memory holds the size", () => {
    expect(cacheNodeType(undefined)).toBe("cache.t4g.micro");
    expect(cacheNodeType(256)).toBe("cache.t4g.micro");
    expect(cacheNodeType(384)).toBe("cache.t4g.micro");
    expect(cacheNodeType(385)).toBe("cache.t4g.small");
    expect(cacheNodeType(1024)).toBe("cache.t4g.small");
    expect(cacheNodeType(3000)).toBe("cache.r7g.large");
  });

  it("has no node above the largest one's usable memory", () => {
    expect(cacheNodeType(81_261)).toBe("cache.r7g.4xlarge");
    expect(cacheNodeType(81_262)).toBeUndefined();
  });
});
