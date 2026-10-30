/**
 * Stackra file contract:
 * Purpose: the "row-save" demo of the web InlineLoading: saving one price in a menu row shows its own spinner, then "Saved", without blocking the rest of the table.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL); design-system gap inventory row 28.
 */
import {
  Button,
  InlineLoading as UiInlineLoading,
  TextField,
  useCatalogueText,
} from "@stackra/ui/react";
import type { InlineLoadingStatus } from "@stackra/ui/contracts";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { INLINE_LOADING_KEYS } from "#src/demos/free/inline-loading/inline-loading-keys.constant";

/** The demo's keys. */
const K = INLINE_LOADING_KEYS.inline_loading;

/** How long the fake save takes. */
const DELAY = 900;

/** InlineLoading: A row-level save. */
export default function RowSave() {
  const t = useCatalogueText(MESSAGES.en);
  const [status, setStatus] = useState<InlineLoadingStatus>("idle");
  const save = () => {
    setStatus("loading");
    setTimeout(() => setStatus("success"), DELAY);
  };
  return (
    <div className="flex flex-wrap items-end gap-3">
      <TextField
        label={t(K.row_price)}
        inputMode="decimal"
        defaultValue="18.50"
        isFullWidth={false}
        onChange={() => setStatus("idle")}
      />
      <Button variant="secondary" isDisabled={status === "loading"} onPress={save}>
        {t(K.save)}
      </Button>
      <UiInlineLoading status={status} loadingLabel={t(K.saving)} successLabel={t(K.saved)} />
    </div>
  );
}
