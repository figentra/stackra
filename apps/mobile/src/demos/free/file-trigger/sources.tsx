/**
 * Stackra file contract:
 * Purpose: the "sources" demo of the native FileTrigger: the document, photo library and camera pickers, and how many files came back.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6);
 *          design-system gap inventory row 6.
 */
import { FileTrigger, Text, useCatalogueText, type PickedFile } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { FILE_TRIGGER_DEMO_KEYS } from "#src/demos/free/file-trigger/file-trigger-demo-keys.constant";

/** The demo's keys. */
const K = FILE_TRIGGER_DEMO_KEYS.demo_free.file_trigger.sources;

/** Each source opens its own picker; the count says what came back. */
export default function Sources() {
  const t = useCatalogueText(MESSAGES.en);
  const [count, setCount] = useState(0);
  const pick = (files: readonly PickedFile[]) => setCount(files.length);
  return (
    <View className="gap-3">
      <FileTrigger
        acceptedFileTypes={["application/pdf", "image/*"]}
        allowsMultiple
        onSelect={pick}
      />
      <FileTrigger source="photos" allowsMultiple onSelect={pick} />
      <FileTrigger source="camera" variant="tertiary" onSelect={pick} />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(K.picked, { count })}
      </Text>
    </View>
  );
}
