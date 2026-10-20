/**
 * Stackra file contract:
 * Purpose: root module of @figentra/service-{{NAME}}. `package.json` `stackra.module` points here: `stackra gen`
 *          imports it and scans the module graph without instantiating anything (ADR 0090). Feature modules from
 *          `src/modules/<feature>/` join `imports`; nothing else is declared here.
 * Owner: the service owner · Secrets: forbidden
 */

// shortcut: a plain class until @stackra/container ships `@Module` (STA-76); then `@Module({ imports: [] })`.
// oxlint-disable-next-line typescript/no-extraneous-class -- a module is a class (ADR 0005); @Module replaces the field
export class {{PASCAL}}Module {
  /** Feature modules this service hosts; empty in a new service. */
  static readonly imports: readonly unknown[] = [];
}
