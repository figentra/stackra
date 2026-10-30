/**
 * Stackra file contract:
 * Purpose: the "sections" demo of the native Select: offices grouped under their region; each region is a header, read
 *          as a heading, never a choice.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (Select sections).
 */
import type { SelectItem } from "@stackra/ui/contracts";
import { Select, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SELECT_DEMO_KEYS } from "#src/demos/free/select/select-demo-keys.constant";

/** The demo's keys. */
const K = SELECT_DEMO_KEYS.demo_free.select.sections;

/** The offices, each under its region. */
export default function Sections() {
  const t = useCatalogueText(MESSAGES.en);
  const offices: readonly SelectItem[] = [
    { id: "riyadh", label: t(K.riyadh), section: t(K.middle_east) },
    { id: "dubai", label: t(K.dubai), section: t(K.middle_east) },
    { id: "cairo", label: t(K.cairo), section: t(K.africa) },
    { id: "lagos", label: t(K.lagos), section: t(K.africa) },
    { id: "paris", label: t(K.paris), section: t(K.europe) },
    { id: "berlin", label: t(K.berlin), section: t(K.europe) },
  ];
  return <Select label={t(K.label)} placeholder={t(K.placeholder)} items={offices} />;
}
