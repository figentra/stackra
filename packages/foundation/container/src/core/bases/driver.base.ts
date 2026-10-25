/**
 * Stackra file contract:
 * Purpose: `Driver(Port)`, the kind base of a driver: called with the port it implements, it returns a fresh abstract
 *          subclass of the port, so the driver inherits the port's abstract members, TypeScript makes it implement
 *          them, and the driver is an instance of the port for every consumer.
 * Boundary: a call that already returns a class, so there is no `defineDriver` (ADR 0305 rule 3). The port is a value
 *           argument because the driver inherits from it (rule 8). The driver's name is its file prefix, read by gen;
 *           the kind registry records the port so the container can check a binding.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 25); ADR 0305 (rules 3 and 8); ADR 0266 (memory drivers first).
 */
import type { Port } from "@stackra/contracts";

import { registerKind } from "#core/functions/register-kind.function";
import type { AnyClass } from "#core/types/any-class.type";
import type { DriverClass } from "#core/types/driver-class.type";

/**
 * The base class of a driver of `port`.
 *
 * @example
 * export class MemoryLoyaltyLedgerDriver extends Driver(LoyaltyLedger) {
 *   async balance(memberId: MemberId): Promise<number> {
 *     return this.sumOf(memberId);
 *   }
 * }
 */
export function Driver<P extends AnyClass<Port>>(port: P): DriverClass<P> {
  const Base = class extends (port as unknown as new () => object) {};
  Object.defineProperty(Base, "name", { value: `${port.name}Driver` });
  registerKind(Base, "driver", { port });
  return Base as unknown as DriverClass<P>;
}
