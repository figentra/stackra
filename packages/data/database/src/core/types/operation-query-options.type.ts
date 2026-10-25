/**
 * Stackra file contract:
 * Purpose: `OperationQueryOptions<M>`, what gen passes `operationQuery(Model, "list" | "get", options)` for a resource
 *          operation set to `true`: the service whose inherited method it calls, its permission and its row type.
 * Boundary: a type only. Without `service` the query reads through `repositoryOf(Model)`. The options are recorded on
 *           the query kind, so the pipeline and gen read the permission and output like a hand-written query's.
 * Runtime: node
 * Governing contract: ADR 0105 as amended by ADR 0294 (operations set to `true`); ADR 0307 (rule 2).
 */
import type { AnyClass } from "@stackra/container";
import type { ActorKind } from "@stackra/contracts";

import type { CrudService } from "#core/bases/crud-service.base";

/** The options of a generated query. */
export interface OperationQueryOptions<M extends object> {
  /** The service whose `table` or `findOneOrFail` the query calls; the model's repository when absent. */
  readonly service?: AnyClass<CrudService<M>>;

  /** The `Permissions` static the query requires (`ProductPermissions.read`). */
  readonly permission: unknown;

  /** The row type of the output; the model when absent. */
  readonly output?: AnyClass;

  /** The actor kinds that may call it; users and agents when absent. */
  readonly actors?: readonly ActorKind[];
}
