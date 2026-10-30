/**
 * Stackra file contract:
 * Purpose: the "width" demo of the web Input group: Full width fills its parent, which is the default; turn it off to
 *          size to the content.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 7 and 10); ADR 0060 (light, dark, RTL).
 */
import { InputGroup as UiInputGroup, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { INPUT_GROUP_KEYS } from "#src/demos/free/input-group/input-group-keys.constant";

/** The demo's keys. */
const K = INPUT_GROUP_KEYS.input_group;

/** Input group: Width. */
export default function Width() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-4">
      <UiInputGroup label={t(K.full)} prefix="$" />
      <UiInputGroup label={t(K.content)} prefix="$" isFullWidth={false} />
    </div>
  );
}
