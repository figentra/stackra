/**
 * Stackra file contract:
 * Purpose: the "upload-states" demo of the native FileTrigger: an UploadList of supplier documents in every state; long-press the photo to preview it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6);
 *          design-system gap inventory row 6.
 */
import { UploadList, useCatalogueText, type UploadItem } from "@stackra/ui/native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { FILE_TRIGGER_DEMO_KEYS } from "#src/demos/free/file-trigger/file-trigger-demo-keys.constant";

/** The demo's keys. */
const K = FILE_TRIGGER_DEMO_KEYS.demo_free.file_trigger.upload_states;

/** A one-pixel latte-brown PNG, so the sample never touches the network; React Native's Image draws no SVG. */
const PRODUCT =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNIKekGAAKjAWRgxqrsAAAAAElFTkSuQmCC";

/** A supplier's paperwork mid-upload (file names are data, never translated). */
const FILES: UploadItem[] = [
  { id: "1", name: "invoice-INV-1042.pdf", size: 2_516_582, status: "uploading", progress: 64 },
  { id: "2", name: "menu-summer.jpg", size: 845_000, status: "done", previewSrc: PRODUCT },
  { id: "3", name: "stock-count-march.csv", size: 12_400, status: "error" },
  { id: "4", name: "supplier-contract.pdf", size: 4_200_000, status: "queued" },
];

/** Retry restarts a failed file; remove drops it. */
export default function UploadStates() {
  const t = useCatalogueText(MESSAGES.en);
  const [items, setItems] = useState(FILES);
  return (
    <UploadList
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
