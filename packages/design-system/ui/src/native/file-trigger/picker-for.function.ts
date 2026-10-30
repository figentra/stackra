/**
 * Stackra file contract:
 * Purpose: `pickerFor(source)`, the function that opens a source's native picker and resolves to the picked files:
 *          `expo-document-picker` for `files`, `expo-image-picker`'s library for `photos` and its camera (after asking
 *          for permission) for `camera`. A cancel or a refused permission resolves to no files.
 * Boundary: the pickers are optional peers, required on first use; `null` when the app lacks the one a source needs,
 *           and the FileTrigger is then disabled. Never throws while loading.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); design-system gap inventory row 6.
 */
import type { FileSource } from "#contracts/enums/file-source.enum";
import type { PickedFile } from "#contracts/types/picked-file.type";

/** `expo-document-picker`'s API, as far as the picker uses it. */
type DocumentPicker = {
  getDocumentAsync: (options: object) => Promise<{
    canceled: boolean;
    assets?: { uri: string; name: string; size?: number; mimeType?: string }[] | null;
  }>;
};

/** `expo-image-picker`'s result, as far as the picker uses it. */
type ImageResult = {
  canceled: boolean;
  assets?: { uri: string; fileName?: string | null; fileSize?: number; mimeType?: string }[] | null;
};

/** `expo-image-picker`'s API, as far as the picker uses it. */
type ImagePicker = {
  requestCameraPermissionsAsync: () => Promise<{ granted: boolean }>;
  launchCameraAsync: (options: object) => Promise<ImageResult>;
  launchImageLibraryAsync: (options: object) => Promise<ImageResult>;
};

/**
 * Whether the app binary carries the Expo native module `name`. A JS package whose native half is not in the build
 * (a dev client built before it was added) throws while Metro loads it, and in development Metro reports that throw
 * as fatal even inside a try block, so the module is checked before it is required.
 */
const hasNativeModule = (name: string): boolean =>
  Boolean((globalThis as { expo?: { modules?: Record<string, unknown> } }).expo?.modules?.[name]);

// Each require sits directly in its own try block: that is the only shape Metro treats as an optional dependency,
// so an app without the module still bundles.
function loadDocumentPicker(): DocumentPicker | null {
  if (!hasNativeModule("ExpoDocumentPicker")) return null;
  try {
    // oxlint-disable-next-line typescript/no-require-imports -- an optional peer, required on first use
    return require("expo-document-picker") as DocumentPicker;
  } catch {
    return null;
  }
}

function loadImagePicker(): ImagePicker | null {
  if (!hasNativeModule("ExponentImagePicker")) return null;
  try {
    // oxlint-disable-next-line typescript/no-require-imports -- an optional peer, required on first use
    return require("expo-image-picker") as ImagePicker;
  } catch {
    return null;
  }
}

/** The picker of `source`, or `null` where its Expo module is not installed. */
export function pickerFor(
  source: FileSource,
):
  | ((options: {
      types?: readonly string[] | undefined;
      multiple: boolean;
    }) => Promise<PickedFile[]>)
  | null {
  if (source === "files") {
    const documents = loadDocumentPicker();
    if (!documents) return null;
    return async ({ types, multiple }) => {
      const result = await documents.getDocumentAsync({
        type: types && types.length > 0 ? [...types] : "*/*",
        multiple,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return [];
      return (result.assets ?? []).map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        size: asset.size,
        type: asset.mimeType,
      }));
    };
  }
  const images = loadImagePicker();
  if (!images) return null;
  return async ({ multiple }) => {
    if (source === "camera" && !(await images.requestCameraPermissionsAsync()).granted) return [];
    const launch = source === "camera" ? images.launchCameraAsync : images.launchImageLibraryAsync;
    const result = await launch({
      mediaTypes: ["images"],
      allowsMultipleSelection: source === "photos" && multiple,
    });
    if (result.canceled) return [];
    return (result.assets ?? []).map((asset) => ({
      uri: asset.uri,
      name: asset.fileName ?? asset.uri.split("/").pop() ?? asset.uri,
      size: asset.fileSize,
      type: asset.mimeType,
    }));
  };
}
