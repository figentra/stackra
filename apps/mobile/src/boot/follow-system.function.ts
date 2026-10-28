/**
 * Stackra file contract:
 * Purpose: `followSystem(container)`, what the app re-reads from the phone at launch and on each return to the
 *          foreground: it creates (or renames) the Android notification channel of each category, and passes the App
 *          Tracking Transparency answer into the consent ledger, so marketing stays refused without it.
 * Boundary: reads the phone and writes the ledger; it never shows the tracking prompt. A no-op channel step off
 *           Android, and tracking reads `null` (no refusal) off iOS.
 * Runtime: react-native
 * Governing contract: ADR 0255 (2026-10-29 note); ADR 0298 (2026-10-29 note); ADR 0250; ADR 0007 (documentation).
 */
import { ConsentLedger } from "@stackra/consent";
import type { Container } from "@stackra/container";
import { PushConfig } from "@stackra/platform";
import { SystemSettings } from "@stackra/platform/contracts";
import { createNotificationChannels } from "@stackra/platform/native";

/**
 * Applies the phone's notification and tracking settings to the app.
 *
 * @example
 * await followSystem(container); // at launch, then on each AppState "active"
 */
export async function followSystem(container: Container): Promise<void> {
  // shortcut: channel names are their keys until the app ships catalogues; then the active locale's translate.
  await createNotificationChannels(container.get(PushConfig).androidChannels, (key) => key);
  const tracking = await container.get(SystemSettings).tracking();
  container.get(ConsentLedger).setAppTrackingDenied(tracking !== null && tracking !== "granted");
}
