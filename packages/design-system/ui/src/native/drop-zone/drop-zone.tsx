/**
 * Stackra file contract:
 * Purpose: the native `DropZone`: a dashed area with an upload icon, a headline, a line under it, a FileTrigger button
 *          and, with `allowsCamera`, a "Take a photo" button. Phones have no drag and drop between apps, so the zone is
 *          the place files are picked from; with `showPreviews` the files picked are listed under it, an image as its
 *          thumbnail, each removable.
 * Boundary: the picking is the native FileTrigger's (the document picker, the camera through expo-image-picker);
 *           `onSelect` gets its `PickedFile`s. There is no file clipboard on a phone, so `allowsPaste` is ignored.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); STA-1371 (wave C:
 *          camera, previews).
 */
import { useRef, useState, type ReactElement } from "react";
import { View } from "react-native";

import type { PickedFile } from "#contracts/types/picked-file.type";
import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { acceptsFile } from "#core/functions/accepts-file.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { FileTrigger } from "#native/file-trigger/file-trigger";
import { UploadList } from "#native/file-trigger/upload-list";
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
  allowsCamera = false,
  showPreviews = false,
  onSelect,
  onFilesChange,
  className,
}: DropZoneProps): ReactElement {
  const t = useUiText();
  const K = FORMS_KEYS.ui.drop_zone;
  const [held, setHeld] = useState<readonly { id: string; file: PickedFile }[]>([]);
  const nextId = useRef(0);

  const take = (files: readonly PickedFile[]) => {
    const kept = files.filter((file) => acceptsFile(acceptedFileTypes, file));
    if (kept.length === 0) return;
    const taken = allowsMultiple ? kept : kept.slice(0, 1);
    onSelect?.(taken);
    if (!showPreviews) return;
    const added = taken.map((file) => ({ id: String((nextId.current += 1)), file }));
    const next = allowsMultiple ? [...held, ...added] : added;
    setHeld(next);
    onFilesChange?.(next.map((each) => each.file));
  };

  const remove = (id: string) => {
    const next = held.filter((each) => each.id !== id);
    setHeld(next);
    onFilesChange?.(next.map((each) => each.file));
  };

  const zone = (
    <View
      className={`items-center gap-2 rounded-[var(--radius-container)] border-2 border-dashed border-border bg-surface p-8 ${isDisabled ? "opacity-50" : ""} ${showPreviews ? "" : (className ?? "")}`}
    >
      <View className="size-11 items-center justify-center rounded-[var(--radius-pill)] bg-default">
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
      <View className="flex-row flex-wrap justify-center gap-2">
        <FileTrigger
          {...(acceptedFileTypes ? { acceptedFileTypes } : {})}
          allowsMultiple={allowsMultiple}
          isDisabled={Boolean(isDisabled)}
          onSelect={take}
        >
          {t(allowsMultiple ? K.browse : K.browse_one)}
        </FileTrigger>
        {allowsCamera ? (
          <FileTrigger source="camera" isDisabled={Boolean(isDisabled)} onSelect={take} />
        ) : null}
      </View>
    </View>
  );

  if (!showPreviews) return zone;
  return (
    <View className={`gap-3 ${className ?? ""}`}>
      {zone}
      {held.length > 0 ? (
        <UploadList
          label={t(K.taken)}
          items={held.map(({ id, file }) => ({
            id,
            name: file.name,
            size: file.size,
            status: "done" as const,
            ...(file.type?.startsWith("image/") ? { previewSrc: file.uri } : {}),
          }))}
          onRemove={remove}
        />
      ) : null}
    </View>
  );
}
