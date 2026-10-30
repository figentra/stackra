/**
 * Stackra file contract:
 * Purpose: the "items" demo of the native Select: choices with a second line; Legacy is shown but refused.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { SelectItem } from "@stackra/ui/contracts";
import { Select, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SELECT_DEMO_KEYS } from "#src/demos/free/select/select-demo-keys.constant";

/** The demo's keys. */
const K = SELECT_DEMO_KEYS.demo_free.select.items;
const P = SELECT_DEMO_KEYS.demo_free.select.plans;

/** The plans, each described. */
export default function Items() {
  const t = useCatalogueText(MESSAGES.en);
  const plans: readonly SelectItem[] = [
    { id: "free", label: t(P.free), description: t(P.free_note) },
    { id: "team", label: t(P.team), description: t(P.team_note) },
    { id: "scale", label: t(P.scale), description: t(P.scale_note) },
    { id: "legacy", label: t(P.legacy), description: t(P.legacy_note), isDisabled: true },
  ];
  return <Select label={t(K.label)} placeholder={t(K.placeholder)} items={plans} />;
}
