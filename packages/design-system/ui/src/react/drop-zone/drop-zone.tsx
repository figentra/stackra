/**
 * Stackra file contract:
 * Purpose: the web `DropZone`: a dashed area that takes files dropped on it, with an upload icon, a headline, a line
 *          under it and a FileTrigger button; it tints while files hover over it.
 * Boundary: React Aria's DropZone (keyboard users drop through the button or paste; the drop target is announced).
 *           Files of a type not in `acceptedFileTypes` are left out. The drop and the pick both call `onSelect`.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 2.1.1,
 *          4.1.2.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";
import { DropZone as AriaDropZone, type DropItem, type FileDropItem } from "react-aria-components";

import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { FileTrigger } from "#react/file-trigger/file-trigger";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import type { DropZoneProps } from "#react/drop-zone/drop-zone.props";

/** True when `type` is one of `accepted` (`image/*`, `application/pdf` or `.csv`), or nothing is listed. */
const accepts = (accepted: readonly string[] | undefined, file: { type: string; name: string }) =>
  !accepted?.length ||
  accepted.some((rule) =>
    rule.startsWith(".")
      ? file.name.toLowerCase().endsWith(rule.toLowerCase())
      : rule.endsWith("/*")
        ? file.type.startsWith(rule.slice(0, -1))
        : file.type === rule,
  );

/** A place to drop files. */
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
    <AriaDropZone
      isDisabled={isDisabled ?? false}
      getDropOperation={() => (isDisabled ? "cancel" : "copy")}
      onDrop={async (event) => {
        const files = await Promise.all(
          event.items
            .filter((item: DropItem): item is FileDropItem => item.kind === "file")
            .map((item) => item.getFile()),
        );
        const kept = files.filter((file) => accepts(acceptedFileTypes, file));
        if (kept.length > 0) onSelect?.(allowsMultiple ? kept : kept.slice(0, 1));
      }}
      className={({ isDropTarget, isFocusVisible }) =>
        cn(
          "grid place-items-center gap-2 rounded-[var(--radius-container)] border-2 border-dashed p-8 text-center transition-colors motion-reduce:transition-none",
          isDropTarget ? "border-accent bg-accent-soft" : "border-border bg-surface",
          isFocusVisible && "outline-2 outline-offset-2 outline-focus",
          isDisabled && "opacity-50",
          className,
        ) ?? ""
      }
    >
      <span
        aria-hidden
        className="grid size-11 place-items-center rounded-[var(--radius-pill)] bg-default text-muted"
      >
        <Icon name="upload" />
      </span>
      <p className="font-medium text-foreground">
        {label ?? t(allowsMultiple ? K.label : K.label_one)}
      </p>
      {description ? <p className="text-sm text-muted">{description}</p> : null}
      <FileTrigger
        {...(acceptedFileTypes ? { acceptedFileTypes } : {})}
        allowsMultiple={allowsMultiple}
        isDisabled={isDisabled ?? false}
        onSelect={(files) => onSelect?.(files)}
      >
        {t(allowsMultiple ? K.browse : K.browse_one)}
      </FileTrigger>
    </AriaDropZone>
  );
}
