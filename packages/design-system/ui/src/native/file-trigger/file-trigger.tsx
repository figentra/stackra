/**
 * Stackra file contract:
 * Purpose: the native `FileTrigger`: a Stackra Button (with its light press haptic) that opens the document picker,
 *          the photo library or the camera and hands the picked files' URIs to `onSelect`. The label and icon follow
 *          the source unless the caller passes its own.
 * Boundary: picks only; uploading is the caller's (show progress with UploadList). Needs `expo-document-picker` for
 *           `files` and `expo-image-picker` for `photos` and `camera`; without the one a source needs it is disabled.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0312; design-system gap inventory row 6.
 */
import type { ReactElement } from "react";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import { pickerFor } from "#native/file-trigger/picker-for.function";
import type { FileTriggerProps } from "#native/file-trigger/file-trigger.props";

/** The icon each source shows. */
const SOURCE_ICON = Object.freeze({ files: "upload", photos: "images", camera: "camera" } as const);

/** A button that opens the file, photo or camera picker. */
export function FileTrigger({
  source = "files",
  acceptedFileTypes,
  allowsMultiple = false,
  onSelect,
  children,
  startIcon,
  variant = "secondary",
  isDisabled = false,
  ...rest
}: FileTriggerProps): ReactElement {
  const t = useUiText();
  const pick = pickerFor(source);

  const open = () => {
    pick?.({ types: acceptedFileTypes, multiple: allowsMultiple }).then(
      (files) => {
        if (files.length > 0) onSelect?.(files);
      },
      () => undefined,
    );
  };

  return (
    <Button
      {...rest}
      variant={variant}
      isDisabled={isDisabled || pick === null}
      startIcon={startIcon ?? SOURCE_ICON[source]}
      onPress={open}
    >
      {children ?? t(UI_KEYS.ui.file_trigger[source])}
    </Button>
  );
}
