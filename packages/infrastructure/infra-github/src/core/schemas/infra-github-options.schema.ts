/**
 * Stackra file contract:
 * Purpose: `InfraGithubOptions`, the options shape of `InfraGithubConfig`: the target `GithubHealthIndicatorDriver` probes.
 * Boundary: a shape class: fields and defaults only; `InfraGithubConfig$` mirrors it and is the schema `buildConfig` validates
 *           with. The runway's `config.infra_github` layer sets the target per environment (ADR 0402 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (decision 5: the wiring passes the target from runway data); ADR 0294 (decision 19).
 */
import { Schema } from "@stackra/validation";

/** The options of `InfraGithubConfig`. */
export class InfraGithubOptions extends Schema {
  /** The GitHub API origin the repository settings are applied through, which the health driver probes; github.com's by default. */
  api = "https://api.github.com/";
}
