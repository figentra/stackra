/**
 * Stackra file contract:
 * Purpose: the `Firebase` port: the Firebase Management calls mobile onboarding makes: add Firebase to a Google
 *          project, find and register its iOS and Android apps, fetch their config files, and link Google Analytics.
 * Boundary: an abstract class that is its own token; the real driver uses the same federated Google sign-in as
 *           `GoogleCloud`, the memory driver keeps state in the process. Config files are configuration, not secrets
 *           (Google's guidance). Linking Analytics answers false when the identity lacks the Analytics grant, which is
 *           the owner's one-time step.
 * Runtime: isomorphic
 * Governing contract: ADR 0482 (decision 5), ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";

/** The two app platforms. */
type Platform = "ios" | "android";

/** Firebase's project side. */
export abstract class Firebase extends Port {
  /** Whether Firebase is on for `project`. */
  abstract hasFirebase(project: string): Promise<boolean>;

  /** Adds Firebase to `project`. */
  abstract addFirebase(project: string): Promise<void>;

  /** The Firebase app id of the `platform` app `identifier` (bundle id or package), or `null`. */
  abstract findApp(project: string, platform: Platform, identifier: string): Promise<string | null>;

  /** Registers the `platform` app `identifier` named `name` and answers its app id. */
  abstract createApp(
    project: string,
    platform: Platform,
    identifier: string,
    name: string,
  ): Promise<string>;

  /** The config file of app `appId` (`GoogleService-Info.plist` or `google-services.json` content). */
  abstract configFile(project: string, platform: Platform, appId: string): Promise<string>;

  /** Whether `project` is linked to Google Analytics. */
  abstract analyticsLinked(project: string): Promise<boolean>;

  /** Links `project` to the Analytics account `account`; false when the identity may not. */
  abstract linkAnalytics(project: string, account: string): Promise<boolean>;
}
