/**
 * Stackra file contract:
 * Purpose: the native `UploadList`: one row per file with its thumbnail (or a file icon), name, size or state, a
 *          progress ring while it uploads that zooms into a success check when done (with a success haptic), an alert
 *          icon and a retry button when it fails, and a remove button. A long press on a file with a `previewSrc`
 *          opens a large preview under its row, with a light haptic; another long press closes it.
 * Boundary: shows state only; the caller owns the uploads and re-renders. The success haptic plays once, when a file
 *           moves into `done`, never for a file that arrives done. Entering animations follow the system's
 *           reduced-motion setting. VoiceOver and TalkBack reach the buttons apart from the row.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0312; design-system gap inventory row 6.
 */
import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeIn, ReduceMotion, ZoomIn } from "react-native-reanimated";
import type { ReactElement } from "react";

import type { UploadStatus } from "#contracts/enums/upload-status.enum";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { formatFileSize } from "#core/functions/format-file-size.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { haptics } from "#native/haptics/haptics";
import { Icon } from "#native/icon/icon";
import { IconButton } from "#native/icon-button/icon-button";
import { ProgressCircle } from "#native/progress-circle/progress-circle";
import { Text } from "#native/text/text";
import { Thumbnail } from "#native/thumbnail/thumbnail";
import type { UploadListProps } from "#native/file-trigger/upload-list.props";

/** The files being uploaded, each with its progress, retry, remove and long-press preview. */
export function UploadList({
  items,
  label,
  onRetry,
  onRemove,
  ...rest
}: UploadListProps): ReactElement {
  const t = useUiText();
  const { locale } = useDesignSystem();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previous = useRef(new Map<string, UploadStatus>());
  const K = UI_KEYS.ui.upload_list;

  useEffect(() => {
    const isNewlyDone = items.some(
      (item) =>
        item.status === "done" &&
        previous.current.has(item.id) &&
        previous.current.get(item.id) !== "done",
    );
    if (isNewlyDone) haptics.play("success");
    previous.current = new Map(items.map((item) => [item.id, item.status]));
  }, [items]);

  return (
    <View
      {...rest}
      accessibilityRole="list"
      accessibilityLabel={label ?? t(K.label)}
      className="gap-2"
    >
      {items.map((item) => {
        const size = item.size === undefined ? "" : formatFileSize(item.size, locale);
        const status = {
          queued: t(K.queued),
          uploading: size,
          done: t(K.done),
          error: item.error ?? t(K.failed),
        }[item.status];
        const preview = item.previewSrc;
        return (
          <View key={item.id} className="gap-2">
            <View className="flex-row items-center gap-3">
              <Pressable
                className="min-w-0 flex-1 flex-row items-center gap-3"
                accessibilityLabel={`${item.name}, ${status}`}
                {...(preview
                  ? {
                      accessibilityHint: t(K.preview_hint),
                      onLongPress: () => {
                        haptics.play("light");
                        setPreviewId((id) => (id === item.id ? null : item.id));
                      },
                    }
                  : {})}
              >
                <Thumbnail size="sm" fallback="file" {...(preview ? { src: preview } : {})} />
                <View className="min-w-0 flex-1">
                  <Text isTruncated>{item.name}</Text>
                  <Text type="small" tone={item.status === "error" ? "danger" : "muted"}>
                    {status}
                  </Text>
                </View>
              </Pressable>
              {item.status === "uploading" ? (
                <ProgressCircle
                  size="sm"
                  label={t(K.uploading, { name: item.name })}
                  {...(item.progress === undefined ? {} : { value: item.progress })}
                />
              ) : null}
              {item.status === "done" ? (
                <Animated.View entering={ZoomIn.springify().reduceMotion(ReduceMotion.System)}>
                  <Icon name="circle-check" tone="success" />
                </Animated.View>
              ) : null}
              {item.status === "error" ? <Icon name="circle-alert" tone="danger" /> : null}
              {item.status === "error" && onRetry ? (
                <IconButton
                  size="sm"
                  variant="ghost"
                  icon="rotate-ccw"
                  label={t(K.retry, { name: item.name })}
                  onPress={() => onRetry(item.id)}
                />
              ) : null}
              {onRemove ? (
                <IconButton
                  size="sm"
                  variant="ghost"
                  icon="x"
                  label={t(K.remove, { name: item.name })}
                  onPress={() => onRemove(item.id)}
                />
              ) : null}
            </View>
            {preview && previewId === item.id ? (
              <Animated.View entering={FadeIn.reduceMotion(ReduceMotion.System)}>
                <Thumbnail
                  src={preview}
                  aspectRatio={4 / 3}
                  alt={t(K.preview, { name: item.name })}
                  style={{ width: "100%" }}
                />
              </Animated.View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
