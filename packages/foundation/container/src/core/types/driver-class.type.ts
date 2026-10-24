/**
 * Stackra file contract:
 * Purpose: `DriverClass<P>`, the exported class type `Driver(Port)` returns: an abstract class whose instances are the
 *          port, so a driver inherits the port's abstract members and TypeScript makes it implement them.
 * Boundary: a type only. The construct signature takes nothing, so a driver with injected constructor parameters
 *           calls `super()` with no arguments.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 25); ADR 0305 (rule 8: the port is a value argument).
 */
import type { Port } from "@stackra/contracts";

import type { AnyClass } from "#core/types/any-class.type";

/** The base class of a driver of port `P`. */
export type DriverClass<P extends AnyClass<Port>> = abstract new () => InstanceType<P>;
