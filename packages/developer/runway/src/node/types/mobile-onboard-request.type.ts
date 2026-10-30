/**
 * Stackra file contract:
 * Purpose: `MobileOnboardRequest`, one run of mobile onboarding: the product repository, the app, the store, Google,
 *          Firebase, Sentry and vault ports, whether it is a dry run, and the environment whose variable NAMES it checks.
 * Boundary: type only. The CLI passes the memory drivers for a dry run and the real ones in CI.
 * Runtime: node
 * Governing contract: ADR 0482 (decisions 1, 4 to 7 and 9).
 */
import type { AppleDeveloper } from "#core/ports/apple-developer.port";
import type { ExpoProjects } from "#core/ports/expo-projects.port";
import type { Firebase } from "#core/ports/firebase.port";
import type { GoogleCloud } from "#core/ports/google-cloud.port";
import type { PlayConsole } from "#core/ports/play-console.port";
import type { SentryProjects } from "#core/ports/sentry-projects.port";
import type { VaultWriter } from "#core/ports/vault-writer.port";

/** One onboarding run. */
export type MobileOnboardRequest = {
  /** The product repository's root folder, holding the root `runway.yaml` and `mise.toml`. */
  readonly repository: string;
  /** The app key under the root runway's `mobile`. */
  readonly app: string;
  /** App Store Connect. */
  readonly apple: AppleDeveloper;
  /** The Google Play console, read for the app and its first release. */
  readonly play: PlayConsole;
  /** Expo and EAS. */
  readonly expo: ExpoProjects;
  /** The product's Google Cloud project. */
  readonly google: GoogleCloud;
  /** Firebase on that project. */
  readonly firebase: Firebase;
  /** The Sentry projects, found or created for the app. */
  readonly sentry: SentryProjects;
  /** Where a generated key is written blind (the FCM key). */
  readonly vault: VaultWriter;
  /** Plan every change instead of making it: no create call and no file write. */
  readonly dryRun?: boolean;
  /** Where the secret NAMES are looked up (never a value); `process.env` when absent. */
  readonly env?: Readonly<Record<string, string | undefined>>;
};
