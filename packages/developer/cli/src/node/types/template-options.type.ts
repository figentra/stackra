/**
 * Stackra file contract:
 * Purpose: `TemplateOptions`, what `stackra new` passes to a template: the kebab-case name, its PascalCase form, the
 *          one-line description, the published package name and `@stackra/*` version form (`memberNaming`), and the
 *          kind-specific values (a package's category, a service's API area).
 * Boundary: type only; `NEW_COMMAND` checks every value before a template sees it.
 * Runtime: node
 * Governing contract: ADR 0282 (consequences); ADR 0294 (decision 20: names); ADR 0082 (API areas); ADR 0349
 *                     (decision 2: product package names).
 */

/** The values a template fills in. */
export type TemplateOptions = {
  /** The kebab-case name (`loyalty-kit`). */
  readonly name: string;

  /** The PascalCase name (`LoyaltyKit`). */
  readonly pascal: string;

  /** The one-line description written into package.json and the README. */
  readonly description: string;

  /** The published package name (`@figentra/beautilon-service-salon`, `@stackra/loyalty-kit`). */
  readonly packageName: string;

  /** How a member depends on `@stackra/*`: `catalog:stackra` in a product repository, `workspace:*` here. */
  readonly stackraVersion: string;

  /** A package's category folder. */
  readonly category?: string;

  /** A service's `ApiArea` case (`App`, `Admin`, `Public`, `Platform`). */
  readonly area?: string;

  /** One sentence for agents on when to reach for the member: `stackra.summary` (ADR 0453 decision 11). */
  readonly summary?: string;
};
