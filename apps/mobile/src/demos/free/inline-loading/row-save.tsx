/**
 * Stackra file contract:
 * Purpose: the "row-save" demo of the native InlineLoading: saving one menu price shows its own spinner, then "Saved".
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { InlineLoadingStatus } from "@stackra/ui/contracts";
import { Button, InlineLoading, TextField, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { INLINE_LOADING_DEMO_KEYS } from "#src/demos/free/inline-loading/inline-loading-demo-keys.constant";

/** The demo's keys. */
const K = INLINE_LOADING_DEMO_KEYS.demo_free.inline_loading;

/** How long the fake save takes. */
const DELAY = 900;

/** A row-level save. */
export default function RowSave() {
  const t = useCatalogueText(MESSAGES.en);
  const [status, setStatus] = useState<InlineLoadingStatus>("idle");
  return (
    <View className="gap-3">
      <TextField
        label={t(K.row_price)}
        keyboardType="decimal-pad"
        defaultValue="18.50"
        onChange={() => setStatus("idle")}
      />
      <View className="flex-row items-center gap-3">
        <Button
          size="sm"
          variant="secondary"
          isDisabled={status === "loading"}
          onPress={() => {
            setStatus("loading");
            setTimeout(() => setStatus("success"), DELAY);
          }}
        >
          {t(K.save)}
        </Button>
        <InlineLoading status={status} loadingLabel={t(K.saving)} successLabel={t(K.saved)} />
      </View>
    </View>
  );
}
