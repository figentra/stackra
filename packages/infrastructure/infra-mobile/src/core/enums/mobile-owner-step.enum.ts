/**
 * Stackra file contract:
 * Purpose: the mobile release steps only the owner can take, because no store or EAS API takes them or because they
 *          need the interactive credentials tool: the accounts and app records whose ids the stack config holds, the
 *          first signing run per bundle id, and the push keys EAS sends with.
 * Boundary: an `Enum.of` value plus the type of the same name; `mobileInfraPlan` lists the ones a plan needs, and the
 *           CLI renders them. Codes only, no prose, so the renderer owns the wording.
 * Runtime: isomorphic
 * Governing contract: ADR 0344 (decision 11: owner steps stay owner steps), ADR 0180 (decisions 1 to 4), ADR 0173
 *                     (no secret value in git), ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** One manual step, in the order a new app takes them. */
export const MobileOwnerStep = Enum.of({
  /** Create the EAS project under `providers.expo.account` and record its id. */
  EasProject: "eas_project",
  /** Record the Apple developer team that signs the iOS app. */
  AppleTeam: "apple_team",
  /** Create the App Store Connect app record for the bundle id (its API cannot) and record its Apple ID. */
  AppStoreRecord: "app_store_record",
  /**
   * Run the interactive `eas credentials` once for a bundle id: the distribution certificate, the provisioning
   * profile and, for a native surface, the app group registration that needs Apple's cookie sign-in.
   */
  IosSigning: "ios_signing",
  /** Give EAS the APNs key Expo push sends with. */
  ApnsKey: "apns_key",
  /** Create the Play Console app and upload its first build by hand (the Play API cannot create an app). */
  PlayApp: "play_app",
  /** Record the SHA-256 fingerprint of the Play app-signing certificate, which the Android app links verify. */
  PlayAppSigning: "play_app_signing",
  /** Run the interactive `eas credentials` once for the Android upload keystore. */
  AndroidSigning: "android_signing",
  /** Give EAS the FCM V1 service-account key Expo push sends with. */
  FcmKey: "fcm_key",
});

/** One of the codes above. */
export type MobileOwnerStep = Enum.Value<typeof MobileOwnerStep>;
