/**
 * Stackra file contract:
 * Purpose: `OperationActionOptions<M>`, what gen passes `operationAction(Model, "create" | "update", options)` for a
 *          resource operation set to `true`: the service, the permission, the output and the limit entitlements that
 *          gate a create.
 * Boundary: a type only; the options are recorded on the action kind, so the pipeline applies the permission and the
 *           entitlements like a hand-written action's.
 * Runtime: node
 * Governing contract: ADR 0105 as amended by ADR 0294; ADR 0098 (action rules apply to generated actions).
 */
import type { AnyClass } from "@stackra/container";
import type { ActorKind } from "@stackra/contracts";

import type { CrudService } from "#core/bases/crud-service.base";

/** The options of a generated action. */
export interface OperationActionOptions<M extends object> {
  /** The service whose inherited `create` or `update` the action calls. */
  readonly service: AnyClass<CrudService<M>>;

  /** The `Permissions` static the action requires (`ProductPermissions.create`). */
  readonly permission: unknown;

  /** The output type; the model when absent. */
  readonly output?: AnyClass;

  /** Entitlements checked before a create, such as a limit that counts the model. */
  readonly entitlements?: readonly AnyClass[];

  /** The actor kinds that may call it; users and agents when absent. */
  readonly actors?: readonly ActorKind[];
}
