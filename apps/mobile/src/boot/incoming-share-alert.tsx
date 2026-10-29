/**
 * Stackra file contract:
 * Purpose: `IncomingShareAlert`, the app's minimal handler of a share from another app: when photos, PDFs, links or
 *          text arrive through the share sheet, it says what came in and clears them once the person dismisses it.
 * Boundary: renders nothing itself; the OS alert shows the summary. It keeps and uploads nothing until the app has a
 *           screen that does (`keepSharedItem`, `uploadSharedItem` of @stackra/native-share).
 * Runtime: react-native
 * Governing contract: ADR 0478 (decision 9); ADR 0255; ADR 0007 (documentation).
 */
import type { SharedItem } from "@stackra/native-share/contracts";
import { useIncomingShare } from "@stackra/native-share/react";
import { useEffect } from "react";
import { Alert } from "react-native";

/** One line per shared item; a text or link is cut to keep the alert short. */
const describe = (item: SharedItem): string =>
  item.kind === "file" ? (item.name ?? item.mimeType) : item.value.slice(0, 80);

/** Tells the person what another app shared, then clears it. */
export function IncomingShareAlert() {
  const { items, clear } = useIncomingShare();

  useEffect(() => {
    if (items.length === 0) return;
    // shortcut: inline English until the app ships catalogues; then the active locale's translate.
    Alert.alert(
      "Shared with Stackra",
      items.map(describe).join("\n"),
      [{ text: "OK", onPress: () => void clear() }],
      { onDismiss: () => void clear() }, // Android: a tap outside the alert
    );
  }, [items, clear]);

  return null;
}
