/**
 * Stackra file contract:
 * Purpose: the web `FileTrigger` on React Aria's FileTrigger: a Stackra Button that opens the browser's file picker,
 *          the photo picker (`image/*`) or, on a phone, the rear camera (`capture`), and hands the picked files to
 *          `onSelect`. The label and icon follow the source unless the caller passes its own.
 * Boundary: picks only; uploading is the caller's (show progress with UploadList). The Pro drop-zone plugs in beside it.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (React Aria on web); design-system gap inventory row 6.
 */
import type { ReactElement } from "react";
import { FileTrigger as AriaFileTrigger } from "react-aria-components";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { Button } from "#react/button/button";
import { useUiText } from "#react/hooks/use-ui-text";
import type { FileTriggerProps } from "#react/file-trigger/file-trigger.props";

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
  ...rest
}: FileTriggerProps): ReactElement {
  const t = useUiText();
  // Photos and the camera take images only; the camera takes one.
  const types = source === "files" ? acceptedFileTypes : ["image/*"];

  return (
    <AriaFileTrigger
      {...(types && types.length > 0 ? { acceptedFileTypes: [...types] } : {})}
      allowsMultiple={source !== "camera" && allowsMultiple}
      {...(source === "camera" ? { defaultCamera: "environment" as const } : {})}
      onSelect={(list) => {
        if (list && list.length > 0) onSelect?.([...list]);
      }}
    >
      <Button {...rest} variant={variant} startIcon={startIcon ?? SOURCE_ICON[source]}>
        {children ?? t(UI_KEYS.ui.file_trigger[source])}
      </Button>
    </AriaFileTrigger>
  );
}
