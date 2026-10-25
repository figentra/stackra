/**
 * Stackra file contract:
 * Purpose: `operationAction(Model, operation, options)`, the standard action gen writes for a resource's `create` or
 *          `update` operation set to `true`: it calls the `create` or `update` the service inherits from
 *          `CrudService<Model>`, inside the action's unit of work.
 * Boundary: returns a real `Action` class, registered and wired like a hand-written one: its key is
 *           `<model>.<operation>`, its permission and entitlements are recorded on the kind for the pipeline, and its
 *           one constructor dependency is the service. `update` takes `{ <model>Id, ...fields }` and changes only the
 *           fields given.
 * Runtime: node
 * Governing contract: ADR 0105 as amended by ADR 0294; ADR 0098; ADR 0136 (decision 2); ADR 0294 (decision 21).
 */
import { Action } from "@stackra/actions";
import type { EntityData, RequiredEntityData } from "@mikro-orm/core";
import type { AnyClass } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";

import type { CrudService } from "#core/bases/crud-service.base";
import { modelKey } from "#core/functions/model-key.function";
import type { OperationActionOptions } from "#core/types/operation-action-options.type";
import type { Where } from "#contracts/types/where.type";

/**
 * The generated action of `operation` on `model`.
 *
 * @throws TypeError for an operation other than `create` and `update`.
 * @example
 * Create: operationAction(Product, "create", { service: ProductService, permission: ProductPermissions.create }),
 */
export function operationAction<M extends object>(
  model: AnyClass<M>,
  operation: "create" | "update",
  options: OperationActionOptions<M>,
): AnyClass<Action> {
  if (operation !== "create" && operation !== "update")
    throw new TypeError(`operationAction writes create and update, not ${String(operation)}`);
  const { key, idKey } = modelKey(model.name);
  const { actors = [ActorKind.User, ActorKind.Agent], ...rest } = options;

  /** The generated action. */
  class OperationAction extends Action({ ...rest, key: `${key}.${operation}`, actors }) {
    /** The service it writes through. */
    private readonly service: CrudService<M>;

    /** @param service - the model's service. */
    constructor(service: CrudService<M>) {
      super();
      this.service = service;
    }

    /** Creates the row, or changes the row with the input's id. */
    async handle(input: Readonly<Record<string, unknown>>): Promise<M> {
      if (operation === "create") return this.service.create(input as RequiredEntityData<M>);
      const { [idKey]: id, ...fields } = input;
      return this.service.update({ id } as Where<M>, fields as EntityData<M>);
    }
  }
  Object.defineProperty(OperationAction, "name", {
    value: `${model.name}${operation === "create" ? "Create" : "Update"}Action`,
  });
  return OperationAction;
}
