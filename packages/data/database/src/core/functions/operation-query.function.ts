/**
 * Stackra file contract:
 * Purpose: `operationQuery(Model, operation, options)`, the standard query gen writes for a resource's `list` or `get`
 *          operation set to `true`: `<model>.list` reads the resource table through `CrudService.table`, `<model>.get`
 *          reads one row by its public id through `findOneOrFail`.
 * Boundary: returns a real `Query` class, registered and wired like a hand-written one: its key is
 *           `<model>.<operation>` (gen prefixes the module), its endpoint the convention's, and its one constructor
 *           dependency is the service (or `repositoryOf(Model)`). The input is the generated table input or
 *           `{ <model>Id }`; the pipeline validates both.
 * Runtime: node
 * Governing contract: ADR 0105 as amended by ADR 0294; ADR 0307 (rule 2); ADR 0098; ADR 0294 (decisions 20 and 21).
 */
import { Query } from "@stackra/actions";
import type { AnyClass } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";

import type { CrudService } from "#core/bases/crud-service.base";
import { modelKey } from "#core/functions/model-key.function";
import type { OperationQueryOptions } from "#core/types/operation-query-options.type";
import type { TableQuery } from "#core/types/table-query.type";
import type { Where } from "#contracts/types/where.type";

/**
 * The generated query of `operation` on `model`.
 *
 * @throws TypeError for an operation other than `list` and `get`.
 * @example
 * List: operationQuery(LoyaltyAccount, "list", { service: AccountService, permission: LoyaltyAccountPermissions.read }),
 */
export function operationQuery<M extends object>(
  model: AnyClass<M>,
  operation: "list" | "get",
  options: OperationQueryOptions<M>,
): AnyClass<Query> {
  if (operation !== "list" && operation !== "get")
    throw new TypeError(`operationQuery writes list and get, not ${String(operation)}`);
  const { key, idKey } = modelKey(model.name);
  const { actors = [ActorKind.User, ActorKind.Agent], ...rest } = options;

  /** The generated query. */
  class OperationQuery extends Query({ ...rest, key: `${key}.${operation}`, actors }) {
    /** The service or repository it reads through. */
    private readonly source: CrudService<M>;

    /** @param source - the service, or the model's repository. */
    constructor(source: CrudService<M>) {
      super();
      this.source = source;
    }

    /** One page of the table, or the row with the input's id. */
    handle(input: TableQuery & Readonly<Record<string, unknown>>): Promise<unknown> {
      return operation === "list"
        ? this.source.table(input)
        : this.source.findOneOrFail({ id: input[idKey] } as Where<M>);
    }
  }
  Object.defineProperty(OperationQuery, "name", {
    value: `${model.name}${operation === "list" ? "List" : "Get"}Query`,
  });
  return OperationQuery;
}
