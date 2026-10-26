/**
 * Stackra file contract:
 * Purpose: unit tests of `disposableIds` and `connectHoldRegistry`: with no registry every id is disposable; with one,
 *          the held ids are left out in order, the registry is told the disposal and the links when given, and an
 *          empty set is not asked about; `holdLinksOf` and `registerHoldLinks` build a row's subject links.
 * Boundary: test only; the registry is a stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0134 (2026-10-24 amendment); ADR 0022; ADR 0269.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { HOLD_HOST } from "#core/constants/hold-host.constant";
import { connectHoldRegistry } from "#core/functions/connect-hold-registry.function";
import { disposableIds } from "#core/functions/disposable-ids.function";
import { holdLinksOf } from "#core/functions/hold-links-of.function";
import { registerHoldLinks } from "#core/functions/register-hold-links.function";
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

  it("sends the subject links with the ids when given (STA-1241)", async () => {
    const heldAmong = vi.fn(async () => new Set<string>());
    connectHoldRegistry({ heldAmong } as unknown as HoldRegistry);
    const links = { a: { matterId: "mat_1" } };
    await disposableIds(Thread, ["a"], Disposal.Edit, links);
    expect(heldAmong).toHaveBeenCalledWith(Thread, ["a"], Disposal.Edit, links);
  });
});

describe(holdLinksOf, () => {
  it("is undefined for a model with no registered links", () => {
    expect(holdLinksOf(Thread, [{ id: "a" }], "id")).toBeUndefined();
  });

  it("maps each row to its non-empty link values, and drops a row with none", () => {
    registerHoldLinks([[Thread, ["matterId", "authorId"]]]);
    try {
      expect(
        holdLinksOf(
          Thread,
          [
            { id: "a", matterId: "mat_1", authorId: null },
            { id: "b", matterId: "", authorId: undefined },
          ],
          "id",
        ),
      ).toEqual({ a: { matterId: "mat_1" } });
    } finally {
      registerHoldLinks([[Thread, []]]);
    }
    expect(holdLinksOf(Thread, [{ id: "a" }], "id")).toBeUndefined();
  });
});
