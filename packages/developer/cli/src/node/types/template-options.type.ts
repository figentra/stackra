/**
 * Stackra file contract:
 * Purpose: `TemplateOptions`, what `stackra new` passes to a template: the kebab-case name, its PascalCase form, the
 *          one-line description, and the kind-specific values (a package's category, a service's API area).
 * Boundary: type only; `NEW_COMMAND` checks every value before a template sees it.
 * Runtime: node
 * Governing contract: ADR 0282 (consequences); ADR 0294 (decision 20: names); ADR 0082 (API areas).
 */

/** The values a template fills in. */
export type TemplateOptions = {
  /** The kebab-case name (`loyalty-kit`). */
  readonly name: string;

  /** The PascalCase name (`LoyaltyKit`). */
  readonly pascal: string;

  /** The one-line description written into package.json and the README. */
  readonly description: string;

  /** A package's category folder. */
  readonly category?: string;

  /** A service's `ApiArea` case (`App`, `Admin`, `Public`, `Platform`). */
  readonly area?: string;
};
