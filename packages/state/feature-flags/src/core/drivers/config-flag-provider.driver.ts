/**
 * Stackra file contract:
 * Purpose: the `config` driver of the `FlagProvider` port: it answers from `FeatureFlagsConfig.values`, the build-time
 *          and runway values, for dev, on-prem and air-gapped installs.
 * Boundary: the same values for every subject, so an anonymous caller gets them too; no network, no state.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 3: native driver, build-time flags); ADR 0266 (one default driver).
 */
import { Driver } from "@stackra/container";

import { FeatureFlagsConfig } from "#config/feature-flags.config";
import { FlagProvider } from "#contracts/ports/flag-provider.port";

/** Serves the configured values. */
export class ConfigFlagProviderDriver extends Driver(FlagProvider) {
  private readonly config: FeatureFlagsConfig;

  /** @param config - holds the values by flag key. */
  constructor(config: FeatureFlagsConfig) {
    super();
    this.config = config;
  }

  /** The configured values, whoever asks. */
  values(): Promise<Readonly<Record<string, boolean>>> {
    return Promise.resolve(this.config.values);
  }
}
