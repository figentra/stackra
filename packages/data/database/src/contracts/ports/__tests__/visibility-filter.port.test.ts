/**
 * Stackra file contract:
 * Purpose: unit tests of the `VisibilityFilter` port: a driver extends it with `Driver(VisibilityFilter)`, is an
 *          instance of the port, and answers per model and principal.
 * Boundary: test only; the driver is a stand-in for the policy decision point's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0333 (decisions 1 and 4); ADR 0294 (decision 16); ADR 0022; ADR 0269.
 */
import { Driver } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { ActorKind, Port, Realm } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { HasPublicId, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { VisibilityFilter } from "#contracts/ports/visibility-filter.port";
import type { Where } from "#contracts/types/where.type";

class Document extends Model.with(HasPublicId("doc")) {
  ownerId!: string;
}

class Invoice extends Model.with(HasPublicId("inv")) {}

/** Documents are visible to their owner; every other model declares nothing. */
class OwnerVisibilityFilterDriver extends Driver(VisibilityFilter) {
  async conditionsFor<M extends object>(
    model: AnyClass<M>,
    principal: Actor | undefined,
  ): Promise<Where<M>> {
    if ((model as AnyClass) !== Document) return {} as Where<M>;
    return { ownerId: principal?.id ?? "" } as unknown as Where<M>;
  }
}

describe("VisibilityFilter", () => {
  it("is a port its driver implements per model and principal", async () => {
    const driver = new OwnerVisibilityFilterDriver();
    const actor: Actor = {
      kind: ActorKind.User,
      id: "usr_01ja0000000000000000000001",
      realm: Realm.Customer,
    };
    expect(driver).toBeInstanceOf(VisibilityFilter);
    expect(driver).toBeInstanceOf(Port);
    expect(await driver.conditionsFor(Document, actor)).toEqual({ ownerId: actor.id });
    expect(await driver.conditionsFor(Invoice, actor)).toEqual({});
  });
});
