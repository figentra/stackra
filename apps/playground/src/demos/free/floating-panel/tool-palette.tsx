/**
 * Stackra file contract:
 * Purpose: the "tool-palette" demo of the web FloatingPanel: a bulk edit palette for twelve selected products, opened
 *          from a button, with a price change, an on-sale switch and an apply button.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import {
  Button,
  FloatingPanel,
  Switch,
  Text,
  TextField,
  useCatalogueText,
} from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { FLOATING_PANEL_KEYS } from "#src/demos/free/floating-panel/floating-panel-keys.constant";

/** The demo's keys. */
const K = FLOATING_PANEL_KEYS.floating_panel.tool_palette;

/** FloatingPanel: Bulk edit palette. */
export default function ToolPalette() {
  const t = useCatalogueText(MESSAGES.en);
  const [isOpen, setOpen] = useState(false);
  const [isApplied, setApplied] = useState(false);
  return (
    <div className="grid justify-items-start gap-3">
      <Button onPress={() => setOpen(true)}>{t(K.open)}</Button>
      {isApplied ? <Text tone="muted">{t(K.applied)}</Text> : null}
      <FloatingPanel
        title={t(K.title)}
        isOpen={isOpen}
        onOpenChange={setOpen}
        defaultWidth={300}
        defaultHeight={300}
        minHeight={220}
      >
        <div className="grid gap-4">
          <Text tone="muted" type="small">
            {t(K.selected)}
          </Text>
          <TextField label={t(K.price)} defaultValue="-10" isFullWidth />
          <Switch label={t(K.sale)} defaultValue />
          <Button
            isFullWidth
            onPress={() => {
              setApplied(true);
              setOpen(false);
            }}
          >
            {t(K.apply)}
          </Button>
        </div>
      </FloatingPanel>
    </div>
  );
}
