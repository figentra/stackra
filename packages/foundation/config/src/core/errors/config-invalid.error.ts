/**
 * Stackra file contract:
 * Purpose: `ConfigInvalidError`, thrown at boot (or at build, for an `env` parser) when a configuration value is
 *          missing or breaks its field rules, naming each path and its variable or secret.
 * Boundary: a plain `Error`, not a refusal: a bad configuration is an operator's mistake found before serving, never
 *           a caller's. Its message and issues name values, never print them.
 * Runtime: isomorphic
 * Governing contract: ADR 0146 (consequences); ADR 0173 (nobody reads a value); ADR 0294 (decision 19).
 */
import type { ConfigIssue } from "#core/types/config-issue.type";

/**
 * A configuration that cannot boot.
 *
 * @example
 * try {
 *   buildConfig(CommerceConfig, { env: process.env, secrets });
 * } catch (error) {
 *   if (error instanceof ConfigInvalidError) error.issues; // [{ path: "storefrontBaseUrl", message: "… (STACKRA_STOREFRONT_BASE_URL)" }]
 * }
 */
export class ConfigInvalidError extends Error {
  /** The configuration class name, or `env` for an `env` parser. */
  readonly config: string;

  /** Every invalid value, in schema order. */
  readonly issues: readonly ConfigIssue[];

  /**
   * @param config - the configuration class name, or `env`.
   * @param issues - the invalid values.
   */
  constructor(config: string, issues: readonly ConfigIssue[]) {
    super(
      `${config} is invalid: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")}`,
    );
    this.name = "ConfigInvalidError";
    this.config = config;
    this.issues = Object.freeze([...issues]);
  }
}
