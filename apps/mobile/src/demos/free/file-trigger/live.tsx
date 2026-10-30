/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native FileTrigger: attach receipts, watch each ring fill and turn into a check with a success haptic.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6);
 *          design-system gap inventory row 6.
 */
import { FileTrigger, UploadList, useCatalogueText, type UploadItem } from "@stackra/ui/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { FILE_TRIGGER_DEMO_KEYS } from "#src/demos/free/file-trigger/file-trigger-demo-keys.constant";

/** The demo's keys. */
const K = FILE_TRIGGER_DEMO_KEYS.demo_free.file_trigger.live;

/** How often the pretend upload moves on, in milliseconds. */
const TICK_MS = 300;

/** Picked files upload (pretend) one tick at a time. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [items, setItems] = useState<UploadItem[]>([]);
  const isUploading = items.some((item) => item.status === "uploading");

  // A pretend upload: every tick adds 20% until the file is done; nothing leaves the device.
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
    <View className="gap-3">
      <FileTrigger
        source="photos"
        allowsMultiple
        onSelect={(files) =>
          setItems((list) => [
            ...list,
            ...files.map((file) => ({
              id: file.uri,
              name: file.name,
              size: file.size,
              status: "uploading" as const,
              progress: 0,
              previewSrc: file.uri,
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
    </View>
  );
}
