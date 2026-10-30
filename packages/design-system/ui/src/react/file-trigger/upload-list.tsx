/**
 * Stackra file contract:
 * Purpose: the web `UploadList`: one row per file with its thumbnail (or a file icon), name, size or state, a progress
 *          ring while it uploads that morphs into a success check when done, an alert icon and a retry button when
 *          it fails, and a remove button. Each row's state text is a polite live region.
 * Boundary: shows state only; the caller owns the uploads and re-renders. The morph is Motion's (theme `fast` step);
 *           reduced motion swaps the ring for the check at once. File names keep their own direction (`dir="auto"`).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); design-system gap inventory row 6; WCAG 2.2
 *          SC 4.1.3.
 */
import type { ReactElement } from "react";
import { cn } from "@heroui/react";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocale } from "react-aria-components";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { formatFileSize } from "#core/functions/format-file-size.function";
import { FileName } from "#react/file-name/file-name";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { IconButton } from "#react/icon-button/icon-button";
import { ProgressCircle } from "#react/progress-circle/progress-circle";
import { Text } from "#react/text/text";
import { Thumbnail } from "#react/thumbnail/thumbnail";
import type { UploadListProps } from "#react/file-trigger/upload-list.props";

const FAST = motionTiming(STACKRA_THEME, "fast");

/** The files being uploaded, each with its progress, retry and remove. */
export function UploadList({
  items,
  label,
  onRetry,
  onRemove,
  className,
  ...rest
}: UploadListProps): ReactElement {
  const t = useUiText();
  const { locale } = useLocale();
  const isReduced = useReducedMotion() ?? false;
  const K = UI_KEYS.ui.upload_list;

  return (
    <ul
      {...rest}
      aria-label={label ?? t(K.label)}
      data-slot="upload-list"
      className={cn("grid gap-2", className)}
    >
      {items.map((item) => {
        const size = item.size === undefined ? "" : formatFileSize(item.size, locale);
        const status = {
          queued: t(K.queued),
          uploading: size,
          done: t(K.done),
          error: item.error ?? t(K.failed),
        }[item.status];
        const indicator = {
          queued: null,
          uploading: (
            <ProgressCircle
              size="sm"
              label={t(K.uploading, { name: item.name })}
              {...(item.progress === undefined ? {} : { value: item.progress })}
            />
          ),
          done: <Icon name="circle-check" tone="success" />,
          error: <Icon name="circle-alert" tone="danger" />,
        }[item.status];
        return (
          <li key={item.id} data-status={item.status} className="flex items-center gap-3">
            <Thumbnail
              size="sm"
              fallback="file"
              {...(item.previewSrc ? { src: item.previewSrc } : {})}
            />
            <div className="grid min-w-0 flex-1">
              <Text isTruncated>
                <FileName name={item.name} />
              </Text>
              <Text
                type="small"
                tone={item.status === "error" ? "danger" : "muted"}
                aria-live="polite"
              >
                {status}
              </Text>
            </div>
            <AnimatePresence initial={false} mode="popLayout">
              {indicator ? (
                <motion.span
                  key={item.status}
                  className="inline-flex"
                  initial={isReduced ? false : { scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={
                    isReduced
                      ? { opacity: 0, transition: { duration: 0 } }
                      : { scale: 0.5, opacity: 0 }
                  }
                  transition={{ duration: FAST.durationMs / 1000, ease: "easeOut" }}
                >
                  {indicator}
                </motion.span>
              ) : null}
            </AnimatePresence>
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
          </li>
        );
      })}
    </ul>
  );
}
