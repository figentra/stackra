/**
 * Stackra file contract:
 * Purpose: the root module of @figentra/{{NAME}}. Gen finds it by name and writes the desktop entry that starts it
 *          (`.stackra/entry/electron.ts`, ADR 0295 decision 7).
 * Boundary: declares the root module and the modules it imports; no providers and no routes of its own.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R12, decisions 14 and 16); ADR 0295 (decisions 7 and 10).
 */

/** The root module of the {{NAME}} app; package modules it uses join `imports`. */
// shortcut: a plain class until @stackra/container ships the Module kind base (STA-76); then
// `export class {{PASCAL}}Module extends Module({ imports: [] }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Module kind base replaces the static field
export class {{PASCAL}}Module {
  /** Modules this app imports; empty in a new app. */
  static readonly imports: readonly unknown[] = [];
}
