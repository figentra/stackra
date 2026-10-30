/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web Tag input: Arabic tags keep their letters joined; the Arabic comma splits them too.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { TagInput, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TAG_INPUT_KEYS } from "#src/demos/free/tag-input/tag-input-keys.constant";

/** The demo's keys. */
const K = TAG_INPUT_KEYS.tag_input.arabic;

/** Tag input: Arabic tags keep their letters joined; the Arabic comma splits them too. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div dir="rtl" lang="ar" className="w-full max-w-md">
      <TagInput
        label={t(K.label)}
        description={t(K.hint)}
        defaultValue={["الرياض", "جدة", "الدمام"]}
        maxTags={5}
      />
    </div>
  );
}
