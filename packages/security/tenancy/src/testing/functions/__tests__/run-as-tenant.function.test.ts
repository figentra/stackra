/**
 * Stackra file contract:
 * Purpose: unit tests of the flush check of `runAsTenant`: it registers `RunAsTenantSubscriber` once per event manager
 *          of the connected database, and the subscriber refuses a new `BelongsToTenant` row created in
 *          `runAsTenant(A)` whose `tenantId` is not A, naming the model and the factory `definition()` as the likely
 *          cause; a row with A, a row outside `runAsTenant`, in a nested call of another tenant, or of a model
 *          without the trait passes; a stand-in entity manager with no events leaves `runAsTenant` as it was.
 * Boundary: test only; the database and the ORM event arguments are stand-ins (the int test runs it on Postgres).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0239.
 */
import { Database } from "@stackra/database";
import { HasPublicId, Model } from "@stackra/model";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ACTIVE_TENANT } from "#node/constants/active-tenant.constant";
import { BelongsToTenant } from "#node/traits/belongs-to-tenant.trait";
import { fakeTenantId } from "#testing/functions/fake-tenant-id.function";
import { runAsTenant } from "#testing/functions/run-as-tenant.function";
import type { RunAsTenantSubscriber } from "#testing/orm/run-as-tenant.subscriber";

/** A tenant-owned model. */
class Member extends Model.with(HasPublicId("mbr"), BelongsToTenant) {}

/** A model without the trait. */
class Note extends Model.with(HasPublicId("not")) {
  tenantId = "scp_elsewhere";
}

const A = fakeTenantId();
const B = fakeTenantId();

/** Connects a stand-in database with one event manager; returns its `registerSubscriber`. */
function connect() {
  const registerSubscriber = vi.fn<(subscriber: RunAsTenantSubscriber) => void>();
  const events = { registerSubscriber };
  vi.spyOn(Database, "current").mockReturnValue({
    em: () => ({ getEventManager: () => events }),
  } as unknown as Database);
  return registerSubscriber;
}

/** The ORM's create event of `entity`. */
const created = (entity: object) => ({
  entity,
  meta: { class: entity.constructor, className: entity.constructor.name },
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runAsTenant flush check", () => {
  it("registers the check once per event manager", () => {
    const registerSubscriber = connect();
    runAsTenant(A, () => undefined);
    runAsTenant(B, () => undefined);
    expect(registerSubscriber).toHaveBeenCalledTimes(1);
  });

  it("refuses a tenant row of another tenant and passes the rest", () => {
    const registerSubscriber = connect();
    runAsTenant(A, () => undefined);
    const subscriber = registerSubscriber.mock.calls[0]?.[0] as RunAsTenantSubscriber;
    const other = Object.assign(new Member(), { tenantId: B });
    const check = (entity: object) => () => subscriber.beforeCreate(created(entity));

    expect(() => runAsTenant(A, check(other))).toThrow(
      `Member was created in runAsTenant(${A}) with tenantId ${B}: does its factory definition() set tenantId? ` +
        "Leave it to runAsTenant.",
    );
    expect(() => runAsTenant(A, () => check(new Member())())).not.toThrow();
    expect(() => runAsTenant(A, check(Object.assign(new Member(), { tenantId: A })))).not.toThrow();
    expect(check(other)).not.toThrow();
    expect(() => runAsTenant(A, () => ACTIVE_TENANT.run(B, check(other)))).not.toThrow();
    expect(() => runAsTenant(undefined, check(other))).not.toThrow();
    expect(() => runAsTenant(A, check(new Note()))).not.toThrow();
  });

  it("only fills the trait over a stand-in entity manager with no events", () => {
    vi.spyOn(Database, "current").mockReturnValue({ em: () => ({}) } as unknown as Database);
    expect(runAsTenant(A, () => new Member()).tenantId).toBe(A);
  });
});
