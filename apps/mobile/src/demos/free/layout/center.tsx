/**
 * Stackra file contract:
 * Purpose: the "center" demo of the native layout primitives: a short message centred at a reading width.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave C).
 */
import { Button, Center, Stack, Text, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { LAYOUT_DEMO_KEYS } from "#src/demos/free/layout/layout-demo-keys.constant";

/** The demo's keys. */
const K = LAYOUT_DEMO_KEYS.demo_free.layout.center;

/** Center: a capped, centred column. */
export default function CenterDemo() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Center maxWidth="sm" isTextCentered>
      <Stack gap="sm" align="center">
        <Text className="text-center text-base font-semibold">{t(K.title)}</Text>
        <Text className="text-center text-sm text-muted">{t(K.body)}</Text>
        <Button size="sm">{t(K.action)}</Button>
      </Stack>
    </Center>
  );
}
