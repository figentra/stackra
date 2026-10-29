/**
 * Stackra file contract:
 * Purpose: `SharingPluginProps`, the slice of expo-sharing's config plugin props this package writes: the iOS share
 *          extension's activation rule and app group, and the Android share target's media types.
 * Boundary: a type only, written out from expo-sharing 57's `ShareExtensionConfigPluginProps`, which its package does
 *           not export from an entry.
 * Runtime: node
 * Governing contract: ADR 0478 (decision 2).
 */

/** expo-sharing's config plugin props. */
export interface SharingPluginProps {
  /** The iOS share extension. */
  readonly ios: {
    /** Whether the extension is added. */
    readonly enabled: boolean;
    /** The app group the extension hands files over in. */
    readonly appGroupId?: string;
    /** What the share sheet offers this app for. */
    readonly activationRule: {
      /** Whether text is offered. */
      readonly supportsText: boolean;
      /** The most web links offered. */
      readonly supportsWebUrlWithMaxCount: number;
      /** The most images offered. */
      readonly supportsImageWithMaxCount: number;
      /** The most other files offered. */
      readonly supportsFileWithMaxCount: number;
    };
  };
  /** The Android share target. */
  readonly android: {
    /** Whether the intent filters are added. */
    readonly enabled: boolean;
    /** The media types of a single share (`ACTION_SEND`). */
    readonly singleShareMimeTypes: string[];
    /** The media types of a multiple share (`ACTION_SEND_MULTIPLE`). */
    readonly multipleShareMimeTypes: string[];
  };
}
