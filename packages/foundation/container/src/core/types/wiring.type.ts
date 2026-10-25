/**
 * Stackra file contract:
 * Purpose: `Wiring`, the shape of the `#stackra/wiring` object gen writes for a member (`export const wiring = {...}
 *          satisfies Wiring`): the module graph, the bindings with their constructor tokens, the config classes, the
 *          driver tables and the replacements the container reads, plus the sections other packages read.
 * Boundary: a type only. The container reads `modules`, `bindings`, `config`, `drivers`, `replaces` and `root`;
 *           every other section (`platform`, `extensionPoints`, `partners`, `seeders`, `contexts`, `checks`, ...) is
 *           owned by the package that reads it, so the shape stays open for them.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (decision 11); ADR 0294 (decision 17); ADR 0227 2026-10-24 note (build-time wiring).
 */
import type { AnyClass } from "#core/types/any-class.type";
import type { ModuleClass } from "#core/types/module-class.type";
import type { WiringBinding } from "#core/types/wiring-binding.type";
import type { WiringConfig } from "#core/types/wiring-config.type";
import type { WiringDriver } from "#core/types/wiring-driver.type";
import type { WiringModule } from "#core/types/wiring-module.type";
import type { WiringReplacement } from "#core/types/wiring-replacement.type";

/**
 * The generated wiring of one member.
 *
 * @example
 * export const wiring = {
 *   member: "loyalty_kit",
 *   root: LoyaltyKitModule,
 *   modules: { loyalty_kit: { exports: [LoyaltyService], dependsOn: [] } },
 *   bindings: [{ module: "loyalty_kit", kind: "service", provide: LoyaltyService, deps: [LoyaltyLedger] }],
 * } satisfies Wiring;
 */
export interface Wiring {
  /** The member key, or the package name of an app. */
  readonly member: string;

  /** The package name. */
  readonly package?: string;

  /** The root module class, or the root module key when the member has no module file. */
  readonly root?: ModuleClass | string;

  /** The module graph by module key, in topological order. */
  readonly modules?: Readonly<Record<string, WiringModule>>;

  /** The closed platform set the member injects without a declaration. */
  readonly platform?: readonly AnyClass[];

  /** Every class the container builds. */
  readonly bindings?: readonly WiringBinding[];

  /** The config classes, each with its host override. */
  readonly config?: readonly WiringConfig[];

  /** The driver table per port. */
  readonly drivers?: readonly WiringDriver[];

  /** The `@Replaces` classes. */
  readonly replaces?: readonly WiringReplacement[];

  /** Sections other packages own and read. */
  readonly [section: string]: unknown;
}
