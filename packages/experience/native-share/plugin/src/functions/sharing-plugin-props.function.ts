/**
 * Stackra file contract:
 * Purpose: `sharingPluginProps(props)`, which turns this package's plugin props into expo-sharing's: the iOS
 *          activation rule (text, one link, images, other files) and the Android single and multiple share types.
 * Boundary: pure. It parses the props with `NATIVE_SHARE_CONFIG_SCHEMA`, so a missing field takes the configuration's
 *           default and an invalid one fails the prebuild. Text and links share Android's `text/plain`.
 * Runtime: node
 * Governing contract: ADR 0478 (decision 2).
 */
import { NATIVE_SHARE_CONFIG_SCHEMA } from "#core/constants/native-share-config-schema.constant";
import type { NativeSharePluginProps } from "../types/native-share-plugin-props.type";
import type { SharingPluginProps } from "../types/sharing-plugin-props.type";

/**
 * expo-sharing's props for these.
 *
 * @example
 * sharingPluginProps({ fileTypes: ["image/*"] }).ios.activationRule.supportsImageWithMaxCount; // 10
 */
export function sharingPluginProps(props: NativeSharePluginProps | undefined): SharingPluginProps {
  const { appGroupId, ...rest } = props ?? {};
  const config = NATIVE_SHARE_CONFIG_SCHEMA.parse(rest);
  const images = config.fileTypes.some((type) => type.startsWith("image/"));
  const others = config.fileTypes.some((type) => !type.startsWith("image/"));
  return {
    ios: {
      enabled: true,
      ...(appGroupId === undefined ? {} : { appGroupId }),
      activationRule: {
        supportsText: config.text,
        supportsWebUrlWithMaxCount: config.links ? 1 : 0,
        supportsImageWithMaxCount: images ? config.maxItems : 0,
        supportsFileWithMaxCount: others ? config.maxItems : 0,
      },
    },
    android: {
      enabled: true,
      singleShareMimeTypes: [
        ...(config.text || config.links ? ["text/plain"] : []),
        ...config.fileTypes,
      ],
      multipleShareMimeTypes: [...config.fileTypes],
    },
  };
}
