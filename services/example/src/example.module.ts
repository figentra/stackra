/**
 * Stackra file contract:
 * Purpose: root module of @figentra/service-example. `package.json` `stackra.module` points here (ADR 0090);
 *          feature modules join `imports`. Replaced by the reference services (FW10).
 * Owner: the service owner · Secrets: forbidden
 */

// shortcut: a plain class until @stackra/container ships `@Module` (STA-76); then `@Module({ imports: [] })`.
// oxlint-disable-next-line typescript/no-extraneous-class -- a module is a class (ADR 0005); @Module replaces the field
export class ExampleModule {
  /** Feature modules this service hosts. */
  static readonly imports: readonly unknown[] = [];
}
