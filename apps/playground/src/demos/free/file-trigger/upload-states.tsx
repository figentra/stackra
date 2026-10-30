/**
 * Stackra file contract:
 * Purpose: the "upload-states" demo of the web FileTrigger: an UploadList of supplier documents in every state, with retry and remove.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); design-system gap inventory row 6.
 */
import { UploadList, useCatalogueText, type UploadItem } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { FILE_TRIGGER_KEYS } from "#src/demos/free/file-trigger/file-trigger-keys.constant";

/** The demo's keys. */
const K = FILE_TRIGGER_KEYS.file_trigger;

/** A supplier's paperwork mid-upload (file names are data, never translated). */
const FILES: UploadItem[] = [
  { id: "1", name: "invoice-INV-1042.pdf", size: 2_516_582, status: "uploading", progress: 64 },
  { id: "2", name: "menu-summer.jpg", size: 845_000, status: "done" },
  { id: "3", name: "stock-count-march.csv", size: 12_400, status: "error" },
  { id: "4", name: "supplier-contract.pdf", size: 4_200_000, status: "queued" },
];

/** FileTrigger: Upload states. */
export default function UploadStates() {
  const t = useCatalogueText(MESSAGES.en);
  const [items, setItems] = useState(FILES);
  return (
    <UploadList
      className="max-w-md"
      label={t(K.list)}
      items={items}
      onRetry={(id) =>
        setItems((list) =>
          list.map((item) =>
            item.id === id ? { ...item, status: "uploading", progress: 0 } : item,
          ),
        )
      }
      onRemove={(id) => setItems((list) => list.filter((item) => item.id !== id))}
    />
  );
}
