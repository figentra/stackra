/**
 * Stackra file contract:
 * Purpose: the "field" demo of the web Contextual help: help beside a field's label explains the SKU format; the sample SKU stays
 *          left to right inside Arabic text.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import { ContextualHelp, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CONTEXTUAL_HELP_KEYS } from "#src/demos/free/contextual-help/contextual-help-keys.constant";

/** The demo's keys. */
const K = CONTEXTUAL_HELP_KEYS.contextual_help;

/** Contextual help: Beside a field. */
export default function Field() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="flex items-center gap-1">
      <Text type="small" className="font-medium">
        {t(K.sku_label_text)}
      </Text>
      <ContextualHelp label={t(K.sku_label)} title={t(K.sku_title)} placement="top">
        <Text type="small">
          {t(K.sku_body)} <bdi dir="ltr">{t(K.sku_example)}</bdi>
        </Text>
      </ContextualHelp>
    </div>
  );
}
