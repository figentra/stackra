/**
 * Stackra file contract:
 * Purpose: the "sources" demo of the web FileTrigger: the file, photo and camera pickers, and how many files came back.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); design-system gap inventory row 6.
 */
import { FileTrigger, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { FILE_TRIGGER_KEYS } from "#src/demos/free/file-trigger/file-trigger-keys.constant";

/** The demo's keys. */
const K = FILE_TRIGGER_KEYS.file_trigger;

/** The FileTrigger demo: sources. */
export default function Sources() {
  const t = useCatalogueText(MESSAGES.en);
  const [count, setCount] = useState(0);
  const pick = (files: readonly File[]) => setCount(files.length);
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <FileTrigger
          acceptedFileTypes={["application/pdf", "image/*"]}
          allowsMultiple
          onSelect={pick}
        />
        <FileTrigger source="photos" allowsMultiple onSelect={pick} />
        <FileTrigger source="camera" variant="tertiary" onSelect={pick} />
      </div>
      <Text tone="muted" aria-live="polite">
        {t(K.picked, { count })}
      </Text>
    </div>
  );
}
