/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Input group: A page address: the preview follows the slug as it is typed.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 7 and 10); ADR 0060 (light, dark, RTL).
 */
import { InputGroup as UiInputGroup, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { INPUT_GROUP_KEYS } from "#src/demos/free/input-group/input-group-keys.constant";

/** The demo's keys. */
const K = INPUT_GROUP_KEYS.input_group;

/** Input group: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [slug, setSlug] = useState("summer-sale");

  return (
    <div className="grid gap-6">
      <UiInputGroup
        label={t(K.live_label)}
        description={t(K.live_description)}
        prefix="/"
        value={slug}
        onChange={setSlug}
      />
      <Text data-testid="preview" aria-live="polite">
        <bdi>{t(K.live_preview, { slug })}</bdi>
      </Text>
    </div>
  );
}
