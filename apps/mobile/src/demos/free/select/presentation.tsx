/**
 * Stackra file contract:
 * Purpose: the "presentation" demo of the native Select: `isFullWidth`, and `presentation="bottom-sheet"`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { SelectItem } from "@stackra/ui/contracts";
import { Select, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SELECT_DEMO_KEYS } from "#src/demos/free/select/select-demo-keys.constant";

/** The demo's keys. */
const K = SELECT_DEMO_KEYS.demo_free.select.presentation;
const M = SELECT_DEMO_KEYS.demo_free.select.methods;
const P = SELECT_DEMO_KEYS.demo_free.select.plans;

/** Full width, then the list as a sheet. */
export default function Presentation() {
  const t = useCatalogueText(MESSAGES.en);
  const methods: readonly SelectItem[] = [
    { id: "post", label: t(M.post) },
    { id: "courier", label: t(M.courier) },
    { id: "pickup", label: t(M.pickup) },
  ];
  const plans: readonly SelectItem[] = [
    { id: "free", label: t(P.free), description: t(P.free_note) },
    { id: "team", label: t(P.team), description: t(P.team_note) },
    { id: "scale", label: t(P.scale), description: t(P.scale_note) },
    { id: "legacy", label: t(P.legacy), description: t(P.legacy_note), isDisabled: true },
  ];
  return (
    <View className="gap-4">
      <Select label={t(K.full_width)} items={methods} isFullWidth />
      <Select label={t(K.sheet)} items={plans} presentation="bottom-sheet" />
    </View>
  );
}
