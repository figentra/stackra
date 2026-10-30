/**
 * Stackra file contract:
 * Purpose: the "center" demo of the web layout primitives: a short message centred at a reading width, with its text
 *          centred too.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave C).
 */
import { Button, Center, Stack, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { LAYOUT_KEYS } from "#src/demos/free/layout/layout-keys.constant";

/** The demo's keys. */
const K = LAYOUT_KEYS.layout.center;

/** Center: a capped, centred column. */
export default function CenterDemo() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Center maxWidth="sm" isTextCentered>
      <Stack gap="sm" align="center">
        <p className="m-0 text-base font-semibold">{t(K.title)}</p>
        <p className="m-0 text-sm text-muted">{t(K.body)}</p>
        <Button size="sm">{t(K.action)}</Button>
      </Stack>
    </Center>
  );
}
