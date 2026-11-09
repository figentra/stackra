/**
 * Stackra file contract:
 * Purpose: `SettingsVersionSupportSourceDriver`, the `VersionSupportSource` of a service that has settings: it answers
 *          the `VersioningSettings` support period in months.
 * Boundary: reads through `SettingsReader#get`, so floors, locks and entitlements apply exactly as for any read. A
 *           failed read throws. It names no `@stackra/versioning` type: the port lives in `@stackra/contracts`.
 * Runtime: isomorphic
 * Governing contract: ADR 0118; ADR 0213 (decision 2: the cascade).
 */
import { Driver } from "@stackra/container";
import { VersionSupportSource } from "@stackra/contracts";

import type { SettingsReader } from "#core/services/settings-reader.service";
import { VersioningSettings } from "#core/versioning.settings";

/**
 * Reads the version support period from settings.
 *
 * @example
 * container.bind(VersionSupportSource, SettingsVersionSupportSourceDriver);
 * await source.supportMonths(); // 12
 */
export class SettingsVersionSupportSourceDriver extends Driver(VersionSupportSource) {
  /** The settings reader over the stores. */
  private readonly reader: SettingsReader;

  /**
   * @param reader - the settings reader.
   */
  constructor(reader: SettingsReader) {
    super();
    this.reader = reader;
  }

  /**
   * The support period in months.
   *
   * @throws Error when the settings cannot be read; the call fails.
   */
  async supportMonths(): Promise<number> {
    return (await this.reader.get(VersioningSettings)).supportMonths;
  }
}
