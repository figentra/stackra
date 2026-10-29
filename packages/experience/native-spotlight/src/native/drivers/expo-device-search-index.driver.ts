/**
 * Stackra file contract:
 * Purpose: `ExpoDeviceSearchIndexDriver`, the `DeviceSearchIndex` driver of the Expo (phone) target, over this
 *          package's `StackraSpotlight` module: iOS Core Spotlight (an index readable only while the phone is
 *          unlocked) and Android launcher search through dynamic shortcuts.
 * Boundary: device only and concrete; it looks the module up itself, and a build without it (Expo Go, the web) keeps
 *           nothing and hears nothing. On iOS an opened entry arrives through the module (`takeOpened` for the one
 *           that launched the app, then `onOpen`); on Android it opens as an ordinary deep link through `Linking`, so
 *           `opened` hears nothing there and the app's linking config handles it. A test subclass replaces `module`.
 * Runtime: react-native
 * Governing contract: ADR 0478 (decisions 2 and 5); ADR 0250.
 */
import { Driver } from "@stackra/container";
import { requireOptionalNativeModule } from "expo";

import { DeviceSearchIndex } from "#contracts/ports/device-search-index.port";
import type { DeviceSearchItem } from "#contracts/types/device-search-item.type";
import type { SpotlightNativeModule } from "#native/types/spotlight-native-module.type";

/**
 * The phone's search through the `StackraSpotlight` module.
 *
 * @example
 * [DeviceSearchIndex, new ExpoDeviceSearchIndexDriver()]
 */
export class ExpoDeviceSearchIndexDriver extends Driver(DeviceSearchIndex) {
  /** The native module, or null in a build without it. */
  protected readonly module: SpotlightNativeModule | null =
    requireOptionalNativeModule<SpotlightNativeModule>("StackraSpotlight");

  /** Adds or replaces `items` when the OS offers an index. */
  async index(items: readonly DeviceSearchItem[]): Promise<void> {
    if (this.module === null || !this.module.isAvailable()) return;
    await this.module.index(
      items.map(({ url, kind, title, description, keywords }) => ({
        url,
        kind,
        title,
        details: description,
        keywords: [...keywords],
      })),
    );
  }

  /** Removes the entries with these links. */
  async remove(urls: readonly string[]): Promise<void> {
    await this.module?.remove([...urls]);
  }

  /** Removes every entry this app added. */
  async clear(): Promise<void> {
    await this.module?.removeAll();
  }

  /** Hands `listener` the entry that launched the app, then each one opened while it listens (iOS). */
  opened(listener: (url: string) => void): () => void {
    const module = this.module;
    if (module === null) return () => undefined;
    const launched = module.takeOpened();
    if (launched !== null) listener(launched);
    const subscription = module.addListener("onOpen", ({ url }) => listener(url));
    return () => subscription.remove();
  }
}
