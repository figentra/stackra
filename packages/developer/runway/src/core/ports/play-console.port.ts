/**
 * Stackra file contract:
 * Purpose: the `PlayConsole` port: the Google Play Developer API read mobile onboarding and the release make: whether
 *          the app of a package exists and has a release on any track.
 * Boundary: an abstract class that is its own token; the real driver uses the root kit's service account read by name
 *           in CI, the memory driver keeps state in the process. The API can neither create an app nor take its first
 *           bundle, so both stay owner steps (ADR 0482 decision 6).
 * Runtime: isomorphic
 * Governing contract: ADR 0482 (decisions 4 and 6), ADR 0480 (decision 3), ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";

import type { PlayApp } from "#core/types/play-app.type";

/** Google Play's console side. */
export abstract class PlayConsole extends Port {
  /** The app of `packageName`, or `null` when Play has none. */
  abstract findApp(packageName: string): Promise<PlayApp | null>;
}
