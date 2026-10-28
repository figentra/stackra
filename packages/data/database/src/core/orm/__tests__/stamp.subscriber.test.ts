/**
 * Stackra file contract:
 * Purpose: unit tests of `StampSubscriber` and `stampFields`: a create takes the caller's id in both user stamps and
 *          keeps a stamp already set, an update moves `updatedAt` and `updatedBy`, a system actor or no call stamps no
 *          principal, and a model without the traits is untouched.
 * Boundary: test only; the ORM event arguments and the context storage are stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0133 (decision 7); ADR 0096 (decision 4); ADR 0022; ADR 0269.
 */
import type { EventArgs } from "@mikro-orm/core";
import { ContextStorage } from "@stackra/actions/contracts";
import { ActorKind, Realm } from "@stackra/contracts";
import { HasPublicId, Model, Timestamps, UserStamps } from "@stackra/model";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { connectVisibilityFilter } from "#core/functions/connect-visibility-filter.function";
import { stampFields } from "#core/functions/stamp-fields.function";
import { StampSubscriber } from "#core/orm/stamp.subscriber";

class Note extends Model.with(HasPublicId("not"), Timestamps, UserStamps) {}

class Plain extends Model.with(HasPublicId("pln")) {}

/** Connects a context storage whose running call has `actor`. */
function actingAs(actor: object | undefined): void {
  const storage = {
    current: () => (actor === undefined ? undefined : { actor }),
  } as unknown as ContextStorage;
  connectVisibilityFilter({
    has: (token) => token === ContextStorage,
    get: () => storage as never,
  });
}

/** The event arguments of a write of `entity`. */
function event(entity: object): EventArgs<object> {
  return { entity, meta: { class: entity.constructor } } as unknown as EventArgs<object>;
}

const user = { kind: ActorKind.User, id: "usr_01", realm: Realm.Customer };

afterEach(() => {
  connectVisibilityFilter(undefined);
});

describe(StampSubscriber, () => {
  it("stamps the creator, keeping a stamp already set", () => {
    actingAs(user);
    const fresh = Object.assign(new Note(), { createdBy: null, updatedBy: null });
    new StampSubscriber().beforeCreate(event(fresh));
    expect([fresh.createdBy, fresh.updatedBy]).toEqual(["usr_01", "usr_01"]);
    const imported = Object.assign(new Note(), { createdBy: "usr_99", updatedBy: null });
    new StampSubscriber().beforeCreate(event(imported));
    expect(imported.createdBy).toBe("usr_99");
  });

  it("moves updatedAt and updatedBy on an update", () => {
    actingAs(user);
    const row = Object.assign(new Note(), { updatedAt: new Date(0), updatedBy: null });
    new StampSubscriber().beforeUpdate(event(row));
    expect(row.updatedAt.getTime()).toBeGreaterThan(0);
    expect(row.updatedBy).toBe("usr_01");
  });

  it("stamps no principal for a system actor or outside a call", () => {
    actingAs({ kind: ActorKind.System, id: "sys_01" });
    expect(Object.keys(stampFields(Note, "update"))).toEqual(["updatedAt"]);
    actingAs(undefined);
    expect(stampFields(Note, "create")).toEqual({});
  });

  it("leaves a model without the traits alone", () => {
    actingAs(user);
    expect(stampFields(Plain, "update")).toEqual({});
  });
});
