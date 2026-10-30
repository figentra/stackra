/**
 * Stackra file contract:
 * Purpose: the "saving" demo of the web Loading overlay: a price list card blocked while it saves.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Button, Card, LoadingOverlay, Switch, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { LOADING_OVERLAY_KEYS } from "#src/demos/free/loading-overlay/loading-overlay-keys.constant";

/** The demo's keys. */
const K = LOADING_OVERLAY_KEYS.loading_overlay.saving;

/** Loading overlay: a price list card blocked while it saves. */
export default function Saving() {
  const t = useCatalogueText(MESSAGES.en);
  const [isSaving, setSaving] = useState(true);
  return (
    <div className="grid w-full max-w-md gap-3">
      <LoadingOverlay isLoading={isSaving} message={t(K.message)}>
        <Card className="grid gap-2 p-4">
          <Text className="font-medium">{t(K.title)}</Text>
          <Text tone="muted">{t(K.body)}</Text>
          <Button variant="secondary">{t(K.edit)}</Button>
        </Card>
      </LoadingOverlay>
      <Switch label={t(K.toggle)} value={isSaving} onChange={setSaving} />
    </div>
  );
}
