/**
 * Stackra file contract:
 * Purpose: unit tests of `operationQuery`: the generated query is a `query` kind keyed `<model>.<operation>` with its
 *          options recorded, `list` reads the table and `get` reads by the input's `<model>Id`, and another operation
 *          is refused.
 * Boundary: test only; the service is a recording stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0105 as amended by ADR 0294; ADR 0307 (rule 2); ADR 0022; ADR 0269.
 */
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import { HasPublicId, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CrudService } from "#core/bases/crud-service.base";
import { operationQuery } from "#core/functions/operation-query.function";

class LoyaltyAccount extends Model.with(HasPublicId("lac")) {}

class AccountService extends CrudService<LoyaltyAccount> {}

/** Builds a generated query over a recording service. */
function build(operation: "list" | "get") {
  const service = Object.assign(Object.create(AccountService.prototype) as AccountService, {
    table: vi.fn(async () => ({ items: [], hasMore: false })),
    findOneOrFail: vi.fn(async () => new LoyaltyAccount()),
  });
  const type = operationQuery(LoyaltyAccount, operation, {
    service: AccountService,
    permission: "loyalty_kit.loyalty_account.read",
  });
  const query = Reflect.construct(type, [service]) as {
    handle(input: object): Promise<unknown>;
  };
  return { type, service, query };
}

describe(operationQuery, () => {
  it("writes the list query over the service's table", async () => {
    const { type, service, query } = build("list");
    expect(type.name).toBe("LoyaltyAccountListQuery");
    expect(kindOf(type)).toMatchObject({
      kind: "query",
      options: {
        key: "loyalty_account.list",
        actors: [ActorKind.User, ActorKind.Agent],
        permission: "loyalty_kit.loyalty_account.read",
        service: AccountService,
      },
    });
    await query.handle({ limit: 20 });
    expect(service.table).toHaveBeenCalledWith({ limit: 20 });
  });

  it("writes the get query by the input's model id", async () => {
    const { service, query } = build("get");
    await query.handle({ loyaltyAccountId: "lac_1" });
    expect(service.findOneOrFail).toHaveBeenCalledWith({ id: "lac_1" });
  });

  it("refuses another operation", () => {
    expect(() => operationQuery(LoyaltyAccount, "delete" as "get", { permission: "x" })).toThrow(
      /list and get/,
    );
  });
});
