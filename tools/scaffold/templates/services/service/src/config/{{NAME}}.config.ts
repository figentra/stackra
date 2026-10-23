/**
 * Stackra file contract:
 * Purpose: the deploy-time configuration of @figentra/service-{{NAME}}. A field's type is its rule and its initializer
 *          the default; the environment and the member runway's `config` values apply after construction.
 * Boundary: values only; never varies per tenant (that is a setting) and never holds a secret value.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 19); ADR 0296 (decision 1); ADR 0146 (configuration layers).
 */

/** The configuration of the {{NAME}} service; its key is the member key, because the file is named after it. */
// shortcut: no base class until @stackra/config ships the Config kind base (STA-77); then `extends Config`.
export class {{PASCAL}}Config {
  /** Whether the service's bindings are active; an environment turns them off without removing the module. */
  enabled = true;
}
