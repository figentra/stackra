/**
 * Stackra file contract:
 * Purpose: `clientModule`, the base gen writes a consumed module class over (`class OrdersModule extends
 *          clientModule("orders") {}`): a container module with no bindings whose static `key` names the producer's
 *          module, so an app imports it by name in `Module({ imports: [...] })`.
 * Boundary: the module only names what the app consumes; gen reads it to filter the generated clients and the
 *           container boots it as an empty module. `moduleRef` adds the producing service.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (consumed modules by name); ADR 0261; ADR 0294 (decision 13).
 */
import { Module } from "@stackra/container";

import { defineStatics } from "#core/functions/define-statics.function";
import type { ClientModuleClass } from "#core/types/client-module-class.type";

/** A snake_case module key. */
const MODULE_KEY = /^[a-z][a-z0-9_]*$/;

/**
 * A consumed module class.
 *
 * @throws RangeError when `key` is not a snake_case module key.
 * @example
 * export class OrdersModule extends clientModule("orders") {}
 */
export function clientModule(key: string): ClientModuleClass {
  if (!MODULE_KEY.test(key)) throw new RangeError(`"${key}" is not a module key: snake_case`);
  const Ref = class extends Module({}) {};
  defineStatics(Ref, { key });
  return Ref as unknown as ClientModuleClass;
}
