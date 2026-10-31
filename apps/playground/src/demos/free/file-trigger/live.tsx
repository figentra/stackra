/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web FileTrigger: attach receipts, watch each upload fill its ring and turn into a check.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); design-system gap inventory row 6.
 */
import { FileTrigger, UploadList, useCatalogueText, type UploadItem } from "@stackra/ui/react";
import { useEffect, useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { FILE_TRIGGER_KEYS } from "#src/demos/free/file-trigger/file-trigger-keys.constant";

/** The demo's keys. */
const K = FILE_TRIGGER_KEYS.file_trigger;

/** How often the pretend upload moves on, in milliseconds. */
// oxlint-disable-next-line stackra/no-literal-duration -- a demo's simulated upload tick, not motion
const TICK_MS = 300;

/** FileTrigger: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [items, setItems] = useState<UploadItem[]>([]);
  const isUploading = items.some((item) => item.status === "uploading");

  // A pretend upload: every tick adds 20% until the file is done; nothing leaves the browser.
  useEffect(() => {
    if (!isUploading) return;
    const timer = setInterval(() => {
      setItems((list) =>
        list.map((item) => {
          if (item.status !== "uploading") return item;
          const progress = (item.progress ?? 0) + 20;
          return progress >= 100
            ? { ...item, status: "done", progress: 100 }
            : { ...item, progress };
        }),
      );
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [isUploading]);

  return (
    <div className="grid max-w-md gap-4">
      <FileTrigger
        acceptedFileTypes={["image/*", "application/pdf"]}
        allowsMultiple
        onSelect={(files) =>
          setItems((list) => [
            ...list,
            ...files.map((file) => ({
              id: crypto.randomUUID(),
              name: file.name,
              size: file.size,
              status: "uploading" as const,
              progress: 0,
              ...(file.type.startsWith("image/") ? { previewSrc: URL.createObjectURL(file) } : {}),
            })),
          ])
        }
      >
        {t(K.receipt)}
      </FileTrigger>
      <UploadList
        label={t(K.list)}
        items={items}
        onRemove={(id) => setItems((list) => list.filter((item) => item.id !== id))}
      />
    </div>
  );
}
