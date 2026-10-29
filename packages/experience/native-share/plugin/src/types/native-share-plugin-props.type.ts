/**
 * Stackra file contract:
 * Purpose: `NativeSharePluginProps`, the props of `"@stackra/native-share"` in an app config: the same fields as
 *          `NativeShareConfig` (what the share sheet offers), plus the iOS app group the extension hands files over in.
 * Boundary: a type only; every field is optional and defaults to the configuration's default.
 * Runtime: node
 * Governing contract: ADR 0478 (decision 2).
 */

/** The config plugin's props. */
export interface NativeSharePluginProps {
  /** Whether shared text is offered. */
  readonly text?: boolean;

  /** Whether a shared web link is offered. */
  readonly links?: boolean;

  /** The media types of the files offered (`image/*`, `application/pdf`). */
  readonly fileTypes?: readonly string[];

  /** The most items one share offers. */
  readonly maxItems?: number;

  /** The iOS app group; `group.<bundle identifier>` when omitted. */
  readonly appGroupId?: string;
}
