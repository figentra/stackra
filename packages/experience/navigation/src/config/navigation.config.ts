/**
 * Stackra file contract:
 * Purpose: the deploy-time configuration of @stackra/navigation. A field's type is its rule and its initializer the
 *          default; a host overrides it with a `<Host>NavigationConfig` subclass that declares `override` members only.
 * Boundary: values only; never varies per tenant (that is a setting) and never holds a secret value.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 19); ADR 0146 (configuration layers).
 */

/** The configuration of @stackra/navigation; its key is the package key, because the file is named after the package. */
// shortcut: no base class until @stackra/config ships the Config kind base (STA-77); then `extends Config`.
export class NavigationConfig {
  /** Whether the package's bindings are active; a host turns them off without removing the module. */
  enabled = true;
}
