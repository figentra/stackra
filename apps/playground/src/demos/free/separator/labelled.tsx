/**
 * Stackra file contract:
 * Purpose: the "labelled" demo of the web Separator: A rule that carries a name, between two groups of controls.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Button, Separator as UiSeparator, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SEPARATOR_KEYS } from "#src/demos/free/separator/separator-keys.constant";

/** The demo's keys. */
const K = SEPARATOR_KEYS.separator;

/** The Separator demo: labelled. */
export default function Labelled() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div role="group" aria-label={t(K.group_name)} className="flex h-9 items-center gap-2">
      <Button size="sm" variant="secondary">
        {t(K.bold)}
      </Button>
      <Button size="sm" variant="secondary">
        {t(K.italic)}
      </Button>
      <UiSeparator orientation="vertical" aria-label={t(K.rule_name)} className="mx-2" />
      <Button size="sm" variant="secondary">
        {t(K.left)}
      </Button>
      <Button size="sm" variant="secondary">
        {t(K.right)}
      </Button>
    </div>
  );
}
