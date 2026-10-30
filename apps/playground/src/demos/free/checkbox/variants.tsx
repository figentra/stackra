/**
 * Stackra file contract:
 * Purpose: the "variants" demo of the web Checkbox: The primary variant sits on the page; the secondary variant is
 *          for a checkbox on a surface.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import { Checkbox as UiCheckbox, Surface, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CHECKBOX_KEYS } from "#src/demos/free/checkbox/checkbox-keys.constant";

/** The demo's keys. */
const K = CHECKBOX_KEYS.checkbox;

/** The Checkbox demo: variants. */
export default function Variants() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="grid content-start gap-3">
        <Text tone="muted" type="small">
          {t(K.primary)}
        </Text>
        <UiCheckbox variant="primary" label={t(K.sample.primary_unchecked)} />
        <UiCheckbox variant="primary" label={t(K.sample.primary_checked)} defaultValue />
      </div>
      <Surface variant="default" className="grid content-start gap-3 p-4">
        <Text tone="muted" type="small">
          {t(K.secondary)}
        </Text>
        <UiCheckbox variant="secondary" label={t(K.sample.secondary_unchecked)} />
        <UiCheckbox variant="secondary" label={t(K.sample.secondary_checked)} defaultValue />
      </Surface>
    </div>
  );
}
