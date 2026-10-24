/**
 * Stackra file contract:
 * Purpose: `ShortcutContext`, what a shortcut's `run(ctx)` receives: the request-scoped capabilities other packages
 *          offer a shortcut (`ctx.navigate` from navigation, `ctx.theme` from theming, `ctx.identity` from identity).
 * Boundary: a type only, and open: this package declares no member. A package that offers a capability adds its member
 *           by declaration merging (`declare module "@stackra/shortcuts" { interface ShortcutContext { ... } }`) and
 *           supplies the value at run time through `contributeShortcutContext`, and in tests through
 *           `registerShortcutTestingPart`. Dependencies a shortcut always needs arrive through its constructor, never
 *           here (no container API in `ctx`).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16, 17 and 23); the template's conversion notes (`ctx` carries request data
 *                     only).
 */

/**
 * The context of one shortcut run, merged from every package that contributes to it.
 *
 * @example
 * declare module "@stackra/shortcuts" {
 *   interface ShortcutContext {
 *     readonly theme: ThemeController;
 *   }
 * }
 */
// oxlint-disable-next-line typescript/no-empty-interface, typescript/no-empty-object-type -- reason: open by design; contributing packages add members by declaration merging
export interface ShortcutContext {}
