/**
 * Stackra file contract:
 * Purpose: `NativeShareOptions`, the shape of `NativeShareConfig`: what the app takes from other apps' share sheets
 *          (text, links, which file types), how many items at once, the largest file and the longest text.
 * Boundary: a shape class; it registers this package's own schema (`NATIVE_SHARE_CONFIG_SCHEMA`) for itself when the
 *           module loads, so `buildConfig(NativeShareConfig)` validates with no generated file. A member that changes
 *           it passes the same values to the config plugin, which writes them into the share sheet at prebuild.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 26); ADR 0478 (decision 2).
 */
import { Field, registerSchemas, Schema } from "@stackra/validation";

import { NATIVE_SHARE_CONFIG_SCHEMA } from "#core/constants/native-share-config-schema.constant";

/**
 * The native share settings.
 *
 * @example
 * export class NativeShareConfig extends BaseNativeShareConfig {
 *   override fileTypes = ["image/*"];
 *   override maxItems = 5;
 * }
 */
export class NativeShareOptions extends Schema {
  /** The media types of the files taken; `image/*` takes every photo format. */
  // reason: a list of media-type patterns; the package's own shipped schema says the pattern
  @Field(NATIVE_SHARE_CONFIG_SCHEMA.shape.fileTypes.unwrap())
  fileTypes: string[] = ["image/*", "application/pdf"];

  /** Whether shared text is taken. */
  text = true;

  /** Whether a shared web link is taken. */
  links = true;

  /** The most items taken from one share; the rest are dropped. */
  maxItems = 10;

  /** The largest file read, in bytes; a larger one reads as `null`. */
  maxBytes = 25_000_000;

  /** The longest text taken, in characters; a longer one is dropped. */
  maxTextLength = 10_000;
}

registerSchemas([[NativeShareOptions, NATIVE_SHARE_CONFIG_SCHEMA]]);
