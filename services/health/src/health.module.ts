/**
 * Stackra file contract:
 * Purpose: root module of @figentra/service-health. `package.json` `stackra.module` points here (ADR 0090);
 *          feature modules join `imports`. Replaced by the reference services (FW10).
 * Boundary: declares the root module class and its feature-module list; no providers and no routes.
 * Runtime: node
 * Governing contract: ADR 0007 (documentation); ADR 0090 (root module).
 * Owner: the service owner · Secrets: forbidden
 */

/** The root module of the health service. Its `imports` list holds the feature modules the service hosts. */
// shortcut: a plain class until @stackra/container ships `@Module` (STA-76); then `@Module({ imports: [] })`.
// oxlint-disable-next-line typescript/no-extraneous-class -- a module is a class (ADR 0005); @Module replaces the field
export class HealthModule {
  /** Feature modules this service hosts. */
  static readonly imports: readonly unknown[] = [];
}
