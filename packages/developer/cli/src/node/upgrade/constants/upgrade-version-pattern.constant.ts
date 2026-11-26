/**
 * Stackra file contract:
 * Purpose: `UPGRADE_VERSION_PATTERN`, an exact `@stackra/*` version: `major.minor.patch` with an optional prerelease,
 *          no range, no build metadata. `--from`, `--to` and every pin `stackra upgrade` moves must match it.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0177 (decision 5); STA-145.
 */

/** `0.33.1`, `1.0.0-rc.1`; captures major, minor, patch and the prerelease. */
export const UPGRADE_VERSION_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
