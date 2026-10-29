/**
 * Stackra file contract:
 * Purpose: `ExpoIncomingShareDriver`, the `IncomingShare` driver of the Expo (phone) target: the items expo-sharing's
 *          iOS share extension and Android share target handed to the app, a file's bytes read from its local URI,
 *          and a new check each time the app comes back to the foreground (the share sheet opens it).
 * Boundary: device only. It reads the raw payloads (`getSharedPayloads`), never the resolved ones, which fetch a
 *           shared link from the network before the person acted on it. The files sit in the app group (iOS) or are
 *           granted to the app by the sharing app (Android), so no permission prompt is needed. `sharing` is
 *           protected so a test subclass hands a fake in.
 * Runtime: react-native
 * Governing contract: ADR 0478 (decisions 2 and 9: Expo's own library, no hand-written native code); ADR 0255.
 */
import * as Sharing from "expo-sharing";
import type { SharePayload } from "expo-sharing";
import { AppState } from "react-native";

import { NativeShareConfig } from "#config/native-share.config";
import type { SharedItem } from "#contracts/types/shared-item.type";
import { IncomingShareDriver } from "#core/drivers/incoming-share.driver";

/**
 * The share inbox on a phone.
 *
 * @example
 * [IncomingShare, new ExpoIncomingShareDriver(new NativeShareConfig())]
 */
export class ExpoIncomingShareDriver extends IncomingShareDriver {
  /** The expo-sharing functions the driver reads; a test subclass replaces them. */
  protected readonly sharing: Pick<typeof Sharing, "getSharedPayloads" | "clearSharedPayloads"> =
    Sharing;

  /**
   * @param config - the native share configuration; the defaults when omitted.
   */
  constructor(config: NativeShareConfig = new NativeShareConfig()) {
    super(config);
  }

  /** Forgets the shared payloads and the files expo-sharing kept for them. */
  async clear(): Promise<void> {
    this.sharing.clearSharedPayloads();
  }

  /** Calls `listener` each time the app becomes active, which is how a share reaches a running app. */
  subscribe(listener: () => void): () => void {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") listener();
    });
    return () => subscription.remove();
  }

  /** The raw payloads, as shared items. */
  protected async received(): Promise<readonly SharedItem[]> {
    return this.sharing.getSharedPayloads().map(toSharedItem);
  }

  /** A file's bytes, read from its local URI. */
  protected async load(item: SharedItem): Promise<Blob | null> {
    return (await fetch(item.value)).blob();
  }
}

/** One expo-sharing payload as a shared item; audio and video are files the configuration may refuse. */
function toSharedItem(payload: SharePayload): SharedItem {
  if (payload.shareType === "text" || payload.shareType === "url")
    return { kind: payload.shareType, value: payload.value, mimeType: "text/plain", name: null };
  const name = payload.value.split(/[?#]/, 1)[0]?.split("/").pop() ?? "";
  return {
    kind: "file",
    value: payload.value,
    mimeType: payload.mimeType ?? "application/octet-stream",
    name: name === "" ? null : safeDecode(name),
  };
}

/** A URI segment decoded, or as it is when it is not valid percent-encoding. */
function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
