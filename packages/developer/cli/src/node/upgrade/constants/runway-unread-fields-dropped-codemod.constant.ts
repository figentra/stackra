/**
 * Stackra file contract:
 * Purpose: `RUNWAY_UNREAD_FIELDS_DROPPED_CODEMOD`, 0.8.0: the runway schemas refuse the fields no repository read.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 67e7e8f.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** The runway schemas drop the fields nothing read. */
export const RUNWAY_UNREAD_FIELDS_DROPPED_CODEMOD: UpgradeCodemod = {
  id: "runway-unread-fields-dropped",
  version: "0.8.0",
  title: "The runway schemas drop the fields nothing read",
  note: "parseRunway and pnpm validate now refuse these keys: root resources.<name>.reason; app brands (brands live in stackra.config.ts), release.pwa, release.desktop.channels, .signing and .platforms, release.mobile.whiteLabel (the root mobile.<app>.whiteLabel is the one read) and release.mobile.profiles.<profile>.distribution, .developmentClient, .simulator, .androidApk and .autoIncrement; app environments' aliases, e2e, pwa, desktop.rollout and mobile.devClient. Delete them from every runway.yaml. release.desktop, release.mobile, each mobile profile and each environment's desktop and mobile blocks are strict now. brandsOf and the Brand type of @stackra/runway are removed.",
  source: "67e7e8f, STA-2028",
};
