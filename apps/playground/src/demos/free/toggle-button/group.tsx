/**
 * Stackra file contract:
 * Purpose: the "group" demo of the web Toggle button: text format with several pressed, alignment with one.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL).
 */
import { ToggleButton, ToggleButtonGroup, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TOGGLE_BUTTON_KEYS } from "#src/demos/free/toggle-button/toggle-button-keys.constant";

/** The demo's keys. */
const K = TOGGLE_BUTTON_KEYS.toggle_button;

/** Toggle button: Group. */
export default function Group() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid justify-items-start gap-4">
      <ToggleButtonGroup aria-label={t(K.format)} selectionMode="multiple">
        <ToggleButton id="bold">{t(K.bold)}</ToggleButton>
        <ToggleButton id="italic">{t(K.italic)}</ToggleButton>
        <ToggleButton id="underline">{t(K.underline)}</ToggleButton>
      </ToggleButtonGroup>
      <ToggleButtonGroup
        aria-label={t(K.align)}
        selectionMode="single"
        disallowEmptySelection
        defaultSelectedKeys={["start"]}
      >
        <ToggleButton id="start">{t(K.start)}</ToggleButton>
        <ToggleButton id="center">{t(K.center)}</ToggleButton>
        <ToggleButton id="end">{t(K.end)}</ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
}
