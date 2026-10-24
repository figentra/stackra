/**
 * Stackra file contract:
 * Purpose: `Module`, the kind base of a module file, in both forms: `extends Module` when the module states nothing
 *          (a generated root), `extends Module({ exports, imports })` when it shares classes or, on a root, imports
 *          modules. The interface of the same name is its instance side.
 * Boundary: a module is not a binding: the container reads its options from the kind registry and builds nothing for
 *           the class itself. Its key is derived from its folder by gen, never written. The `~kind` brand is
 *           type-only, so `imports: [SomeService]` fails to compile.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 25); ADR 0305 (rules 2, 15 and 16); ADR 0127 2026-10-24 note
 *                     (Module lives in container).
 */
import { createKind } from "#core/functions/create-kind.function";
import type { ModuleClass } from "#core/types/module-class.type";
import type { ModuleOptions } from "#core/types/module-options.type";

/** The instance side every module shares. */
export interface Module {
  /** Type-only kind brand, so a class of another kind cannot stand in for a module. */
  readonly "~kind": "module";
}

/**
 * The module kind base.
 *
 * @example
 * export class LoyaltyKitModule extends Module({ exports: [LoyaltyService, AccountService] }) {}
 * export class NotificationsModule extends Module {}
 */
export const Module = createKind(
  "module",
  // The runtime base: empty, so a module class keeps no state.
  // oxlint-disable-next-line typescript/no-extraneous-class -- reason: a kind base is empty on purpose (0294 d25)
  class ModuleBase {},
) as ModuleClass & ((options: ModuleOptions) => ModuleClass);
