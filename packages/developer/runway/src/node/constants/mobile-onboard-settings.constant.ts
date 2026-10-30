/**
 * Stackra file contract:
 * Purpose: `MOBILE_ONBOARD_SETTINGS`, the fixed facts of mobile onboarding: the default EAS owner account, the
 *          secret NAMES the store steps need (ADR 0480's root kit and the per-product FCM key), and the Infisical path
 *          they live under, the FCM service account and its role, the Sentry organisation and team, and the Firebase
 *          config file names.
 * Boundary: data only; names, never values.
 * Runtime: node
 * Governing contract: ADR 0482 (decisions 5 to 7), ADR 0480 (decision 1), ADR 0173.
 */

/** Onboarding facts. */
export const MOBILE_ONBOARD_SETTINGS = Object.freeze({
  /** The Expo account a project is created under when `mobile.<app>.eas.owner` is absent. */
  easOwner: "figentra",
  /** Every store release needs it. */
  expoToken: "EXPO_TOKEN",
  /** The App Store Connect API key (root kit). */
  appleKeys: ["ASC_API_KEY_ID", "ASC_API_ISSUER_ID", "ASC_API_PRIVATE_KEY"],
  /** The Google Play service account (root kit). */
  playKeys: ["GOOGLE_PLAY_SERVICE_ACCOUNT_JSON"],
  /** The FCM v1 service-account key EAS sends Android pushes with. */
  fcmKey: "FCM_SERVICE_ACCOUNT_JSON",
  /** Infisical's API when the job names none (`INFISICAL_API_URL`). */
  infisicalApi: "https://app.infisical.com",
  /** Where the store secrets live in Infisical; a product's own keys sit under `<vaultPath>/<product>`. */
  vaultPath: "prod:/ci/store",
  /** The service account EAS sends Android pushes as, and the role it needs. */
  fcmAccount: "eas-fcm",
  fcmRole: "roles/firebasecloudmessaging.admin",
  /** The job variable holding the Google access token from workload identity federation (no Google key). */
  googleToken: "GOOGLE_OAUTH_ACCESS_TOKEN",
  /** The job variable naming the organisation folder new Google projects go under (`folders/123`; not a secret). */
  googleFolder: "GOOGLE_PROJECT_FOLDER",
  /** The APIs a new Google project gets. */
  googleApis: ["firebase.googleapis.com", "fcm.googleapis.com", "iam.googleapis.com"],
  /** The Sentry API and the organisation and team a project is created under. */
  sentryApi: "https://sentry.io/api/0",
  sentryOrg: "figentra",
  sentryTeam: "mobile",
  /** The Firebase config files, kept in the app's `assets` folder and copied into the checkout by the mobile job. */
  firebaseFiles: { ios: "GoogleService-Info.plist", android: "google-services.json" },
} as const);
