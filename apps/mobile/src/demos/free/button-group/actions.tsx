/**
 * Stackra file contract:
 * Purpose: the "actions" demo of the native Button group: edit, duplicate or export an invoice from one small control.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Button, ButtonGroup, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";
import { Icons } from "#src/constants/icons.constant";

import { MESSAGES } from "#src/constants/messages.constant";
import { BUTTON_GROUP_DEMO_KEYS } from "#src/demos/free/button-group/button-group-demo-keys.constant";

/** The demo's keys. */
const K = BUTTON_GROUP_DEMO_KEYS.demo_free.button_group.actions;

/** Button group: edit, duplicate or export an invoice from one small control. */
export default function Actions() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <ButtonGroup label={t(K.label)} variant="tertiary" size="sm">
        <Button startIcon={Icons.Pencil}>{t(K.edit)}</Button>
        <Button startIcon={Icons.Copy}>{t(K.duplicate)}</Button>
        <Button startIcon={Icons.Download}>{t(K.export)}</Button>
      </ButtonGroup>
    </View>
  );
}
