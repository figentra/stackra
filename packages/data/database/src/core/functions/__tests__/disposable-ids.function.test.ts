/**
 * Stackra file contract:
 * Purpose: unit tests of `disposableIds` and `connectHoldRegistry`: with no registry every id is disposable; with one,
 *          the held ids are left out in order, the registry is told the disposal, and an empty set is not asked about.
 * Boundary: test only; the registry is a stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0134 (2026-10-24 amendment); ADR 0022; ADR 0269.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { HOLD_HOST } from "#core/constants/hold-host.constant";
import { connectHoldRegistry } from "#core/functions/connect-hold-registry.function";
import { disposableIds } from "#core/functions/disposable-ids.function";
import { Disposal } from "#contracts/enums/disposal.enum";
import type { HoldRegistry } from "#contracts/ports/hold-registry.port";

class Thread {}

afterEach(() => {
  connectHoldRegistry(undefined);
});

describe(disposableIds, () => {
  it("keeps every id with no registry connected", async () => {
    expect(HOLD_HOST.registry).toBeUndefined();
    expect(await disposableIds(Thread, ["a", "b"], Disposal.Retention)).toEqual(["a", "b"]);
  });

  it("leaves out the held ids and tells the registry the disposal", async () => {
    const heldAmong = vi.fn(async () => new Set(["b", "z"]));
    connectHoldRegistry({ heldAmong } as unknown as HoldRegistry);
    expect(await disposableIds(Thread, ["a", "b", "c"], Disposal.Retention)).toEqual(["a", "c"]);
    expect(heldAmong).toHaveBeenCalledWith(Thread, ["a", "b", "c"], Disposal.Retention);
    expect(await disposableIds(Thread, [], Disposal.Retention)).toEqual([]);
    expect(heldAmong).toHaveBeenCalledTimes(1);
  });
});
