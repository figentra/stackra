/**
 * Stackra file contract:
 * Purpose: `MobileInfraPlan`, the mobile release infrastructure of one repository: the EAS account and project, the
 *          iOS and Android store facts the release needs, each environment that ships through EAS, and the owner
 *          tasks. A fact is a literal id or a `ref:<path>` until the Pulumi slice resolves it.
 * Boundary: type only; `mobileInfraPlan` builds it and `mobileStack` (`./node`) returns it resolved. JSON-safe, so
 *           `stackra infra gen` can inline it into the generated program.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decisions 2 to 4), ADR 0180, ADR 0344 (decisions 3 and 11), ADR 0345 (decision 2:
 *                     one app group per app).
 */
import type { MobileOwnerTask } from "#core/types/mobile-owner-task.type";
import type { MobileReleaseEnvironment } from "#core/types/mobile-release-environment.type";

/** The mobile release plan. */
export type MobileInfraPlan = {
  /** The EAS account and project every build, update and submission runs under. */
  readonly expo: {
    readonly account: string;
    readonly projectId: string;
  };
  /** The iOS release, when the member targets `ios`. */
  readonly ios?: {
    readonly bundleId: string;
    /** The Apple developer team that signs it. */
    readonly teamId: string;
    /** The App Store Connect app record, when the member submits to the App Store. */
    readonly ascAppId?: string;
    /** The native surfaces' bundle ids, each `<bundleId>.<suffix>`. */
    readonly surfaces: readonly string[];
    /** `group.<bundleId>`, the one app group the surfaces share, when there are surfaces. */
    readonly appGroup?: string;
  };
  /** The Android release, when the member targets `android`. */
  readonly android?: {
    readonly package: string;
    /** The Play Console developer account, when the member submits to Play. */
    readonly playDeveloperId?: string;
    /** The Play app-signing certificate's SHA-256 fingerprint, when the member submits to Play. */
    readonly appSigningSha256?: string;
  };
  /** The environments that ship through EAS, in promotion order. */
  readonly environments: readonly MobileReleaseEnvironment[];
  /** The manual steps, in the order a new app takes them. */
  readonly ownerTasks: readonly MobileOwnerTask[];
};
