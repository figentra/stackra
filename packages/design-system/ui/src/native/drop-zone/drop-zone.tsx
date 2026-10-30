/**
 * Stackra file contract:
 * Purpose: the native `DropZone`: a dashed area with an upload icon, a headline, a line under it and a FileTrigger
 *          button. Phones have no drag and drop between apps, so the zone is the place files are picked from.
 * Boundary: the picking is the native FileTrigger's (the document picker); `onSelect` gets its `PickedFile`s.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3).
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { FileTrigger } from "#native/file-trigger/file-trigger";
import { Icon } from "#native/icon/icon";
import { Text } from "#native/text/text";
import type { DropZoneProps } from "#native/drop-zone/drop-zone.props";

/** A place files are picked from. */
export function DropZone({
  label,
  description,
  acceptedFileTypes,
  allowsMultiple = false,
  isDisabled,
  onSelect,
  className,
}: DropZoneProps): ReactElement {
  const t = useUiText();
  const K = FORMS_KEYS.ui.drop_zone;
  return (
    <View
      className={`items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface p-8 ${isDisabled ? "opacity-50" : ""} ${className ?? ""}`}
    >
      <View className="size-11 items-center justify-center rounded-full bg-default">
        <Icon name="upload" tone="muted" />
      </View>
      <Text className="font-medium" align="center">
        {label ?? t(allowsMultiple ? K.label : K.label_one)}
      </Text>
      {description ? (
        <Text type="small" tone="muted" align="center">
          {description}
        </Text>
      ) : null}
      <FileTrigger
        {...(acceptedFileTypes ? { acceptedFileTypes } : {})}
        allowsMultiple={allowsMultiple}
        isDisabled={Boolean(isDisabled)}
        onSelect={(files) => onSelect?.(files)}
      >
        {t(allowsMultiple ? K.browse : K.browse_one)}
      </FileTrigger>
    </View>
  );
}
