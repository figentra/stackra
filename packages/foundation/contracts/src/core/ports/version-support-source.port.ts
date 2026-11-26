/**
 * Stackra file contract:
 * Purpose: the `VersionSupportSource` port: how many months an API version stays supported after its successor, as an
 *          operator's settings set it, which the generated adapter reads when it resolves a pinned version.
 * Boundary: an abstract class that is its own token. `@stackra/settings` ships the driver
 *           (`SettingsVersionSupportSourceDriver`, over its `VersioningSettings` group). The port lives here because
 *           versioning and settings may not depend on each other. With none bound the 12 months of
 *           `VERSION_SUPPORT_MONTHS` apply.
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (API versions are dates); ADR 0213 (decision 2: the settings cascade).
 */
import { Port } from "#core/bases/port.base";

/**
 * Reads the version support period.
 *
 * @example
 * const months = await source.supportMonths(); // 12
 */
export abstract class VersionSupportSource extends Port {
  /**
   * The support period, in whole months.
   *
   * @throws Error when the period cannot be read; the call fails.
   */
  abstract supportMonths(): Promise<number>;
}
