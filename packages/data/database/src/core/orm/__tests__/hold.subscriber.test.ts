/**
 * Stackra file contract:
 * Purpose: unit tests of `HoldSubscriber`: a delete of a free row passes, a delete of a held row is refused with
 *          `RecordHeldError`, and with no registry connected nothing is asked.
 * Boundary: test only; the ORM event arguments and the registry are stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0134 (2026-10-24 amendment); ADR 0022; ADR 0269.
 */
import type { EventArgs } from "@mikro-orm/core";
import { isRefusal } from "@stackra/errors";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RecordHeldError } from "#core/errors/record-held.error";
import { connectHoldRegistry } from "#core/functions/connect-hold-registry.function";
import { HoldSubscriber } from "#core/orm/hold.subscriber";
import { Disposal } from "#contracts/enums/disposal.enum";
import type { HoldRegistry } from "#contracts/ports/hold-registry.port";

class Matter {
  id = "";
}

/** The event arguments of a delete of the matter `id`. */
function deleting(id: string): EventArgs<object> {
  return {
    entity: Object.assign(new Matter(), { id }),
    meta: { class: Matter, className: "Matter", primaryKeys: ["id"] },
  } as unknown as EventArgs<object>;
}

afterEach(() => {
  connectHoldRegistry(undefined);
});

describe(HoldSubscriber, () => {
  it("lets a delete through with no registry connected", async () => {
    await expect(new HoldSubscriber().beforeDelete(deleting("mat_1"))).resolves.toBeUndefined();
  });

  it("refuses the delete of a held record and passes a free one", async () => {
    const heldAmong = vi.fn(
      async (_model: unknown, ids: readonly string[]) =>
        new Set(ids.filter((id) => id === "mat_1")),
    );
    connectHoldRegistry({ heldAmong } as unknown as HoldRegistry);
    const subscriber = new HoldSubscriber();
    const refused = await subscriber
      .beforeDelete(deleting("mat_1"))
      .catch((error: unknown) => error);
    expect(isRefusal(refused, RecordHeldError)).toBe(true);
    await expect(subscriber.beforeDelete(deleting("mat_2"))).resolves.toBeUndefined();
    expect(heldAmong).toHaveBeenCalledWith(Matter, ["mat_1"], Disposal.Delete);
  });
});
