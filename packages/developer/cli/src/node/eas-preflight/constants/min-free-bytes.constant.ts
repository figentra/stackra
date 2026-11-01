/**
 * Stackra file contract:
 * Purpose: `MIN_FREE_BYTES`, the free disk a local EAS build needs per platform: Xcode archives and DerivedData are far
 *          larger than a Gradle build (25 GB for iOS, 10 GB for Android).
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0180 (mobile builds and updates); ADR 0170 (deploy from a commit of main); STA-1577.
 */

/** One gibibyte. */
const GB = 1024 ** 3;

/** Platform to the bytes a local build needs free. */
export const MIN_FREE_BYTES: Readonly<Record<string, number>> = { ios: 25 * GB, android: 10 * GB };
