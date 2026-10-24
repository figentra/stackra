/**
 * Stackra file contract:
 * Purpose: `moduleRef`, the base gen writes a consumed module class over when it names the producing service too
 *          (`class OrdersModule extends moduleRef("commerce", "orders") {}`): a `clientModule` with a static `service`.
 * Boundary: the same empty container module as `clientModule`; the service key only documents and disambiguates.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (consumed modules by name); ADR 0261; ADR 0294 (decision 13).
 */
import { clientModule } from "#core/functions/client-module.function";
import { defineStatics } from "#core/functions/define-statics.function";
import type { ClientModuleClass } from "#core/types/client-module-class.type";

/** A snake_case member key. */
const SERVICE_KEY = /^[a-z][a-z0-9_]*$/;

/**
 * A consumed module class of `service`.
 *
 * @throws RangeError when `service` or `key` is not snake_case.
 * @example
 * export class DevicesModule extends moduleRef("identity", "devices") {}
 */
export function moduleRef(service: string, key: string): ClientModuleClass {
  if (!SERVICE_KEY.test(service))
    throw new RangeError(`"${service}" is not a service key: snake_case`);
  const Ref = class extends clientModule(key) {};
  defineStatics(Ref, { service });
  return Ref;
}
