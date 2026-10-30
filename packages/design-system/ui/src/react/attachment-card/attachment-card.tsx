/**
 * Stackra file contract:
 * Purpose: the web `AttachmentCard`: one attached file as a bordered row: its thumbnail or a type mark, its name (a
 *          button when `onOpen` is set), then "PDF · 2.4 MB", an upload's bar, or why it failed; then its retry,
 *          download and remove buttons.
 * Boundary: composes Thumbnail, Icon, IconButton and ProgressBar; each button is named with the file ("Remove
 *           invoice.pdf"), so a list of cards reads apart. The name is isolated (`dir="auto"`), so a Latin name in an
 *           Arabic page keeps its order; the row uses logical properties and mirrors in right-to-left.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.5.3 and 4.1.2; STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";
import { useLocale } from "react-aria-components";

import { ATTACHMENT_KEYS } from "#core/constants/attachment-keys.constant";
import { fileKindOf } from "#core/functions/file-kind-of.function";
import { formatFileSize } from "#core/functions/format-file-size.function";
import { isolateText } from "#core/functions/isolate-text.function";
import type { AttachmentCardProps } from "#react/attachment-card/attachment-card.props";
import { FileName } from "#react/file-name/file-name";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { IconButton } from "#react/icon-button/icon-button";
import { ProgressBar } from "#react/progress-bar/progress-bar";
import { Thumbnail } from "#react/thumbnail/thumbnail";

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
  const { locale } = useLocale();
  const kind = fileKindOf(name, type);
  const isFailed = error !== undefined;
  const isUploading = !isFailed && progress !== undefined;
  // Each part is isolated, so "PDF" and "2.4 MB" keep their order around the dot in an Arabic line.
  const meta = [kind.extension, size === undefined ? "" : formatFileSize(size, locale)]
    .filter(Boolean)
    .map((part) => isolateText(part))
    .join(" · ");

  return (
    <div
      data-slot="attachment-card"
      data-status={isFailed ? "error" : isUploading ? "uploading" : "done"}
      className={cn(
        "flex w-full min-w-0 items-center gap-3 rounded-[var(--radius-container)] border bg-surface p-2 pe-1",
        isFailed ? "border-danger" : "border-border",
        className,
      )}
    >
      {previewSrc ? (
        <Thumbnail size="sm" src={previewSrc} fallback={kind.icon} />
      ) : (
        <span
          aria-hidden
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-[var(--radius-control)]",
            isFailed ? "bg-danger-soft text-danger" : "bg-default text-muted",
          )}
        >
          <Icon name={kind.icon} />
        </span>
      )}
      <div className="grid min-w-0 flex-1 gap-1">
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className="min-w-0 cursor-pointer truncate text-start text-sm font-medium text-foreground underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus"
          >
            <FileName name={name} />
          </button>
        ) : (
          <span className="min-w-0 truncate text-start text-sm font-medium">
            <FileName name={name} />
          </span>
        )}
        {isFailed ? (
          <span role="alert" className="truncate text-xs text-danger">
            {error === "" ? t(K.failed) : error}
          </span>
        ) : isUploading ? (
          <ProgressBar size="sm" label={t(K.uploading)} value={progress} />
        ) : meta ? (
          <span className="truncate text-xs text-muted tabular-nums">{meta}</span>
        ) : null}
      </div>
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
    </div>
  );
}
