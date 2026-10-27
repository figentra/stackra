/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryBumpBarDriver`: it is a `BumpBar`, always answers, hands each pressed key to every
 *          listener, and stops a listener that unsubscribed.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0449 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { BumpBarKey } from "#contracts/enums/bump-bar-key.enum";
import { BumpBar } from "#contracts/ports/bump-bar.port";
import { MemoryBumpBarDriver } from "#core/drivers/memory-bump-bar.driver";

describe("MemoryBumpBarDriver", () => {
  it("hands pressed keys to its listeners until they stop", async () => {
    const bar = new MemoryBumpBarDriver();
    expect(bar).toBeInstanceOf(BumpBar);
    expect(await bar.probe()).toEqual({ ok: true, data: undefined });
    const seen: string[] = [];
    const stop = bar.onKey((key) => seen.push(key));
    bar.press(BumpBarKey.Bump);
    bar.press(BumpBarKey.Recall);
    stop();
    bar.press(BumpBarKey.Next);
    expect(seen).toEqual(["bump", "recall"]);
  });
});
