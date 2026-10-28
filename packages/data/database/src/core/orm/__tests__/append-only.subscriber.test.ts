/**
 * Stackra file contract:
 * Purpose: unit tests of `AppendOnlySubscriber` and `isAppendOnly`: an update of an append-only row is refused with
 *          `AppendOnlyWriteError`, and any other model's update passes.
 * Boundary: test only; the ORM event arguments are stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0134; ADR 0220; ADR 0096 (decision 4); ADR 0022; ADR 0269.
 */
import type { EventArgs } from "@mikro-orm/core";
import { isRefusal } from "@stackra/errors";
import { AppendOnly, HasPublicId, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { AppendOnlyWriteError } from "#core/errors/append-only-write.error";
import { isAppendOnly } from "#core/functions/is-append-only.function";
import { AppendOnlySubscriber } from "#core/orm/append-only.subscriber";

class LedgerEntry extends Model.with(HasPublicId("lpe"), AppendOnly) {}

class Note extends Model.with(HasPublicId("not")) {}

/** The event arguments of an update of `entity`. */
function event(entity: object): EventArgs<object> {
  return {
    entity,
    meta: { class: entity.constructor, className: entity.constructor.name },
  } as unknown as EventArgs<object>;
}

describe("AppendOnlySubscriber", () => {
  it("reads the trait", () => {
    expect(isAppendOnly(LedgerEntry)).toBe(true);
    expect(isAppendOnly(Note)).toBe(false);
  });

  it("refuses an update of an append-only row and lets any other pass", () => {
    const subscriber = new AppendOnlySubscriber();
    let refused: unknown;
    try {
      subscriber.beforeUpdate(event(new LedgerEntry()));
    } catch (error) {
      refused = error;
    }
    expect(isRefusal(refused, AppendOnlyWriteError)).toBe(true);
    expect((refused as AppendOnlyWriteError).model).toBe("LedgerEntry");
    expect(() => subscriber.beforeUpdate(event(new Note()))).not.toThrow();
  });
});
