/**
 * Stackra file contract:
 * Purpose: the root module of @figentra/service-{{NAME}}. Gen finds it by name, writes the runtime entry that boots it
 *          (`.stackra/entry/server.ts`) and the wiring of every binding in the feature modules it imports.
 * Boundary: declares the root module and the feature modules it imports; no providers, no handlers.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R12, decision 16); ADR 0295 (decision 7); ADR 0263 (generated wiring).
 */

/** The root module of the {{NAME}} service; feature modules from `src/modules/<key>/` join `imports`. */
// shortcut: a plain class until @stackra/container ships the Module kind base (STA-76); then
// `export class {{PASCAL}}Module extends Module({ imports: [] }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Module kind base replaces the static field
export class {{PASCAL}}Module {
  /** Feature modules this service hosts; empty in a new service. */
  static readonly imports: readonly unknown[] = [];
}
