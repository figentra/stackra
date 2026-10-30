/**
 * Stackra file contract:
 * Purpose: the `ExpoProjects` port: the Expo calls mobile onboarding makes: find and create an EAS project under an
 *          account, read which credentials EAS holds for it, and hand EAS the Android FCM v1 key.
 * Boundary: an abstract class that is its own token; the real driver calls Expo's API with the job's `EXPO_TOKEN`,
 *           the memory driver keeps state in the process. EAS creates every signing credential itself; nothing here
 *           generates one (ADR 0482 decision 3). The FCM key arrives as the value Runway's CI job just created: the
 *           driver sends it inside the request and never logs or returns it (ADR 0482 decision 7).
 * Runtime: isomorphic
 * Governing contract: ADR 0482 (decisions 3 to 7), ADR 0062, ADR 0173, ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";

import type { ExpoCredentials } from "#core/types/expo-credentials.type";

/** Expo's project side. */
export abstract class ExpoProjects extends Port {
  /** The id of the project `slug` under `owner`, or `null` when there is none. */
  abstract findProject(owner: string, slug: string): Promise<string | null>;

  /** Creates the project `slug` under `owner` and answers its id. */
  abstract createProject(owner: string, slug: string): Promise<string>;

  /** Which credentials EAS holds for `project`'s `bundleId` and `packageName`. */
  abstract credentials(
    project: string,
    bundleId: string,
    packageName: string,
  ): Promise<ExpoCredentials>;

  /** Hands EAS the FCM v1 service-account key `key` (its JSON) for `packageName`; never logs it. */
  abstract uploadFcmKey(project: string, packageName: string, key: string): Promise<void>;
}
