/**
 * Stackra file contract:
 * Purpose: the "sections" demo of the web Select: offices grouped under their region; each region is a header that
 *          names its group, never a choice.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (Select sections);
 *          ADR 0060 (light, dark, RTL).
 */
import { Select as UiSelect, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SELECT_KEYS } from "#src/demos/free/select/select-keys.constant";

/** The demo's keys. */
const K = SELECT_KEYS.select;

/** Offices grouped into sections by region. */
export default function Sections() {
  const t = useCatalogueText(MESSAGES.en);
  const OFFICES = [
    { id: "riyadh", label: t(K.sample.riyadh), section: t(K.sample.middle_east) },
    { id: "dubai", label: t(K.sample.dubai), section: t(K.sample.middle_east) },
    { id: "cairo", label: t(K.sample.cairo), section: t(K.sample.africa) },
    { id: "lagos", label: t(K.sample.lagos), section: t(K.sample.africa) },
    { id: "paris", label: t(K.sample.paris), section: t(K.sample.europe) },
    { id: "berlin", label: t(K.sample.berlin), section: t(K.sample.europe) },
  ] as const;
  return (
    <UiSelect
      items={OFFICES}
      label={t(K.sections_label)}
      placeholder={t(K.sections_placeholder)}
      className="w-72"
    />
  );
}
