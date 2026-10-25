/**
 * Stackra file contract:
 * Purpose: `ClientModuleClass`, the class `moduleRef` and `clientModule` return: a consumed module of another service
 *          as a container module (`OrdersModule`), so an app lists it in `Module({ imports: [...] })` by name.
 * Boundary: a type only. The module declares no bindings; it names the producer's module the app consumes, which gen
 *           reads to filter the generated clients.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (consumed modules by name, never a namespace walk); ADR 0261; ADR 0294 (decision 13).
 */
import type { ModuleClass } from "@stackra/container";

/** A consumed module class. */
export type ClientModuleClass = ModuleClass & {
  /** The producing service's member key (`commerce`), when the ref names it. */
  readonly service?: string;

  /** The module key in that service (`orders`). */
  readonly key: string;
};
