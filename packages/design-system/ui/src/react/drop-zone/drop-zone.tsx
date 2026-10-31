/**
 * Stackra file contract:
 * Purpose: the web `DropZone`: a dashed area that takes files dropped or pasted on it, with an upload icon, a headline,
 *          a line under it, a FileTrigger button and, with `allowsCamera`, a "Take a photo" button; it tints while files
 *          hover over it. With `allowsPaste` a file pasted anywhere on the page (a copied screenshot) is taken too; with
 *          `showPreviews` the files taken are listed under the zone, an image as its thumbnail, each removable.
 * Boundary: React Aria's DropZone (keyboard users drop through the button or paste while it has focus; the drop target
 *           is announced). Files of a type not in `acceptedFileTypes` are left out. The drop, the paste and the picks
 *           all call `onSelect`. A page-wide paste into a text field is left to the field. Image previews are object
 *           URLs, revoked when the file is removed or the zone unmounts.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 2.1.1,
 *          4.1.2; STA-1371 (wave C: paste, camera, previews).
 */
import { cn } from "@heroui/react";
import { useEffect, useEffectEvent, useRef, useState, type ReactElement } from "react";
import { DropZone as AriaDropZone, type DropItem, type FileDropItem } from "react-aria-components";

import { acceptsFile } from "#core/functions/accepts-file.function";
import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { FileTrigger } from "#react/file-trigger/file-trigger";
import { UploadList } from "#react/file-trigger/upload-list";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import type { DropZoneProps } from "#react/drop-zone/drop-zone.props";

/** A file the zone holds, with its preview URL when it is an image. */
type Held = { readonly id: string; readonly file: File; readonly url?: string | undefined };

/** A place to drop, paste or pick files. */
export function DropZone({
  label,
  description,
  acceptedFileTypes,
  allowsMultiple = false,
  isDisabled,
  allowsCamera = false,
  allowsPaste = false,
  showPreviews = false,
  onSelect,
  onFilesChange,
  className,
}: DropZoneProps): ReactElement {
  const t = useUiText();
  const K = FORMS_KEYS.ui.drop_zone;
  const [held, setHeld] = useState<readonly Held[]>([]);
  // The files held at unmount, for revoking their previews.
  const heldRef = useRef(held);
  useEffect(() => {
    heldRef.current = held;
  }, [held]);
  const zoneRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  const take = (files: readonly File[]) => {
    const kept = files.filter((file) => acceptsFile(acceptedFileTypes, file));
    if (kept.length === 0) return;
    const taken = allowsMultiple ? kept : kept.slice(0, 1);
    onSelect?.(taken);
    if (!showPreviews) return;
    const added = taken.map((file) => ({
      id: String((nextId.current += 1)),
      file,
      url: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
    if (!allowsMultiple) for (const each of held) revoke(each);
    const next = allowsMultiple ? [...held, ...added] : added;
    setHeld(next);
    onFilesChange?.(next.map((each) => each.file));
  };
  const takePasted = useEffectEvent(take);

  const remove = (id: string) => {
    const gone = held.find((each) => each.id === id);
    if (gone) revoke(gone);
    const next = held.filter((each) => each.id !== id);
    setHeld(next);
    onFilesChange?.(next.map((each) => each.file));
  };

  useEffect(() => () => heldRef.current.forEach(revoke), []);

  useEffect(() => {
    if (!allowsPaste || isDisabled) return;
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      // React Aria takes a paste while the zone has focus; a paste into a text field belongs to the field.
      if (event.defaultPrevented || zoneRef.current?.contains(document.activeElement)) return;
      if (target?.closest("input, textarea, [contenteditable]:not([contenteditable=false])"))
        return;
      const files = [...(event.clipboardData?.files ?? [])];
      if (files.length === 0) return;
      event.preventDefault();
      takePasted(files);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [allowsPaste, isDisabled]);

  const zone = (
    <AriaDropZone
      ref={zoneRef}
      isDisabled={isDisabled ?? false}
      getDropOperation={() => (isDisabled ? "cancel" : "copy")}
      onDrop={async (event) => {
        take(
          await Promise.all(
            event.items
              .filter((item: DropItem): item is FileDropItem => item.kind === "file")
              .map((item) => item.getFile()),
          ),
        );
      }}
      className={({ isDropTarget, isFocusVisible }) =>
        cn(
          "grid place-items-center gap-2 rounded-[var(--radius-container)] border-2 border-dashed p-8 text-center transition-colors motion-reduce:transition-none",
          isDropTarget ? "border-accent bg-accent-soft" : "border-border bg-surface",
          isFocusVisible && "outline-2 outline-offset-2 outline-focus",
          isDisabled && "opacity-(--disabled-opacity)",
          showPreviews ? undefined : className,
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
      <div className="flex flex-wrap justify-center gap-2">
        <FileTrigger
          {...(acceptedFileTypes ? { acceptedFileTypes } : {})}
          allowsMultiple={allowsMultiple}
          isDisabled={isDisabled ?? false}
          onSelect={take}
        >
          {t(allowsMultiple ? K.browse : K.browse_one)}
        </FileTrigger>
        {allowsCamera ? (
          <FileTrigger source="camera" isDisabled={isDisabled ?? false} onSelect={take} />
        ) : null}
      </div>
      {allowsPaste ? <p className="text-xs text-muted">{t(K.paste_hint)}</p> : null}
    </AriaDropZone>
  );

  if (!showPreviews) return zone;
  return (
    <div data-slot="drop-zone" className={cn("grid gap-3", className)}>
      {zone}
      {held.length > 0 ? (
        <UploadList
          label={t(K.taken)}
          items={held.map((each) => ({
            id: each.id,
            name: each.file.name,
            size: each.file.size,
            status: "done" as const,
            ...(each.url ? { previewSrc: each.url } : {}),
          }))}
          onRemove={remove}
        />
      ) : null}
    </div>
  );
}

/** Frees an image preview's object URL. */
function revoke(held: Held): void {
  if (held.url) URL.revokeObjectURL(held.url);
}
