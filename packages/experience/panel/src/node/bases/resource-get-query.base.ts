/**
 * Stackra file contract:
 * Purpose: `ResourceGetQuery(options)`, the base of the get read gen writes for a resource whose `get` operation is
 *          `true` (`class GetLoyaltyAccountQuery extends ResourceGetQuery({ key: "loyalty_account.get", ... })`): one
 *          record by its public id, read through the model's `CrudService`, as the resource's row.
 * Boundary: a query kind base built per resource, holding only the model's service. The public id arrives in the input
 *           field the endpoint convention names (`<model>Id`, `GET /xs/:xId`); an id that is not one is the input's
 *           refusal, and an absent or invisible record is `findOneOrFail`'s. Gen writes the subclass, its constructor and
 *           its options.
 * Runtime: node
 * Governing contract: ADR 0307 (rules 1 and 4); ADR 0294 (decision 21); ResourceOperations; STA-1971.
 */
import { Query, type QueryContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import type { CrudService } from "@stackra/database";
import { publicIdToUuid } from "@stackra/model";

import { ResourceQueryInputInvalidError } from "#node/errors/resource-query-input-invalid.error";
import { rowOf } from "#node/functions/row-of.function";
import type { ResourceGetOptions } from "#node/types/resource-get-options.type";

/** The callers of a generated read: as the generated search query. */
const ACTORS: readonly ActorKind[] = [ActorKind.User, ActorKind.Agent, ActorKind.Service];

/**
 * The base class of one resource's get read.
 *
 * @example
 * export class GetLoyaltyAccountQuery extends ResourceGetQuery({
 *   key: "loyalty_account.get",
 *   idField: "loyaltyAccountId",
 * }) {
 *   constructor(service: AccountService) {
 *     super(service);
 *   }
 * }
 */
export function ResourceGetQuery(options: ResourceGetOptions) {
  return class extends Query({ key: options.key, actors: ACTORS }) {
    /** The model's service, which reads the record. */
    private readonly service: CrudService<object>;

    /** @param service - the model's `CrudService`. */
    constructor(service: CrudService<object>) {
      super();
      this.service = service;
    }

    /** The record the input's public id names, as the resource's row. */
    // oxlint-disable-next-line typescript/no-unused-vars -- reason: the query signature; the read needs no context
    async handle(
      input: Readonly<Record<string, unknown>>,
      _ctx: QueryContext,
    ): Promise<Readonly<Record<string, unknown>>> {
      const id = input[options.idField];
      let uuid: string;
      try {
        uuid = publicIdToUuid(String(id));
      } catch {
        throw ResourceQueryInputInvalidError.create({
          query: options.key,
          part: "id",
          key: options.idField,
        });
      }
      const record = await this.service.findOneOrFail({ id: uuid } as never);
      return rowOf(this.service, record, options.fields);
    }
  };
}
