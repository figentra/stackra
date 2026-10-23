/**
 * Stackra file contract:
 * Purpose: the root module of @stackra/ui. A host imports it to load the package; gen finds every binding in
 *          the module groups beside it by its base class and writes the wiring, so it lists no providers.
 * Boundary: declares the module and the modules it imports; no logic.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R12, decisions 13 and 16); ADR 0263 (generated wiring).
 */

/** The root module of @stackra/ui; its key is the package name without its scope, in snake_case. */
// shortcut: a plain class until @stackra/container ships the Module kind base (STA-76); then
// `export class UiModule extends Module({ imports: [] }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Module kind base replaces the static field
export class UiModule {
  /** Modules this root imports; empty in a new package. */
  static readonly imports: readonly unknown[] = [];
}
