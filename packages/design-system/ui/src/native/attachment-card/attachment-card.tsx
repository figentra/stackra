/**
 * Stackra file contract:
 * Purpose: the native `AttachmentCard`: one attached file as a bordered row: its thumbnail or a type mark, its name
 *          (pressable when `onOpen` is set), then "PDF · 2.4 MB", an upload's bar, or why it failed; then its retry,
 *          download and remove buttons.
 * Boundary: composes Thumbnail, Icon, IconButton, ProgressBar and Text; the name and its line read as one element,
 *           and each button is named with the file. Uniwind's `flex-row` follows the layout direction, so the row
 *           mirrors in right-to-left.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); STA-1371.
 */
import type { ReactElement } from "react";
import { Pressable, View } from "react-native";

import { ATTACHMENT_KEYS } from "#core/constants/attachment-keys.constant";
import { fileKindOf } from "#core/functions/file-kind-of.function";
import { formatFileSize } from "#core/functions/format-file-size.function";
import { isolateText } from "#core/functions/isolate-text.function";
import { isolatedFileNameOf } from "#core/functions/isolated-file-name-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import type { AttachmentCardProps } from "#native/attachment-card/attachment-card.props";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { Icon } from "#native/icon/icon";
import { IconButton } from "#native/icon-button/icon-button";
import { ProgressBar } from "#native/progress-bar/progress-bar";
import { Text } from "#native/text/text";
import { Thumbnail } from "#native/thumbnail/thumbnail";

/** The card's words. */
const K = ATTACHMENT_KEYS.ui.attachment_card;

/** One attached file with its actions. */
export function AttachmentCard({
  name,
  size,
  type,
  previewSrc,
  progress,
  error,
  onOpen,
  onDownload,
  onRetry,
  onRemove,
  className,
}: AttachmentCardProps): ReactElement {
  const t = useUiText();
  const { locale } = useDesignSystem();
  const kind = fileKindOf(name, type);
  const isFailed = error !== undefined;
  const isUploading = !isFailed && progress !== undefined;
  // Each part is isolated, so "PDF" and "2.4 MB" keep their order around the dot in an Arabic line.
  const meta = [kind.extension, size === undefined ? "" : formatFileSize(size, locale)]
    .filter(Boolean)
    .map((part) => isolateText(part))
    .join(" · ");
  const line = isFailed
    ? error === ""
      ? t(K.failed)
      : error
    : isUploading
      ? t(K.uploading)
      : meta;

  return (
    <View
      className={`w-full flex-row items-center gap-3 rounded-[var(--radius-container)] border bg-surface p-2 pe-1 ${isFailed ? "border-danger" : "border-border"} ${className ?? ""}`}
    >
      <Pressable
        className="min-w-0 flex-1 flex-row items-center gap-3"
        accessibilityLabel={line ? `${name}, ${line}` : name}
        {...(onOpen ? { accessibilityRole: "button" as const, onPress: onOpen } : {})}
      >
        {previewSrc ? (
          <Thumbnail size="sm" src={previewSrc} fallback={kind.icon} />
        ) : (
          <View
            className={`size-10 items-center justify-center rounded-[var(--radius-control)] ${isFailed ? "bg-danger-soft" : "bg-default"}`}
          >
            <Icon name={kind.icon} tone={isFailed ? "danger" : "muted"} />
          </View>
        )}
        <View className="min-w-0 flex-1 gap-1">
          <Text isTruncated className="font-medium">
            {isolatedFileNameOf(name)}
          </Text>
          {isUploading ? (
            <ProgressBar size="sm" label={t(K.uploading)} value={progress} />
          ) : line ? (
            <Text type="small" tone={isFailed ? "danger" : "muted"} isTruncated>
              {line}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {isFailed && onRetry ? (
        <IconButton
          size="sm"
          variant="ghost"
          icon="rotate-ccw"
          label={t(K.retry, { name })}
          onPress={onRetry}
        />
      ) : null}
      {onDownload && !isUploading && !isFailed ? (
        <IconButton
          size="sm"
          variant="ghost"
          icon="download"
          label={t(K.download, { name })}
          onPress={onDownload}
        />
      ) : null}
      {onRemove ? (
        <IconButton
          size="sm"
          variant="ghost"
          icon="x"
          label={t(K.remove, { name })}
          onPress={onRemove}
        />
      ) : null}
    </View>
  );
}
