/**
 * Stackra file contract:
 * Purpose: the "nested" demo of the native Surface: default, then secondary inside it, then tertiary inside that.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Surface, Text, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SURFACE_DEMO_KEYS } from "#src/demos/free/surface/surface-demo-keys.constant";

/** The demo's keys. */
const K = SURFACE_DEMO_KEYS.demo_free.surface;

/** Three levels, nested. */
export default function Nested() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Surface variant="default">
      <Text>{t(K.level, { level: "default" })}</Text>
      <Surface variant="secondary">
        <Text>{t(K.level, { level: "secondary" })}</Text>
        <Surface variant="tertiary">
          <Text>{t(K.level, { level: "tertiary" })}</Text>
        </Surface>
      </Surface>
    </Surface>
  );
}
