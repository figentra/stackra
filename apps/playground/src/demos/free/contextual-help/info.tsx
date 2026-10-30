/**
 * Stackra file contract:
 * Purpose: the "info" demo of the web Contextual help: the "i" variant gives a background fact about the shift's opening cash.
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

/** Contextual help: Info. */
export default function Info() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="flex items-center gap-1">
      <Text className="font-medium">{t(K.float_heading)}</Text>
      <ContextualHelp label={t(K.float_label)} variant="info" placement="end">
        {t(K.float_body)}
      </ContextualHelp>
    </div>
  );
}
