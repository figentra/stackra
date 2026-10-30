/**
 * Stackra file contract:
 * Purpose: the "presets" demo of the native ErrorPage: the four presets, 403, 404, 500 and offline, each with its catalogue words and icon.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); GAPS.md
 *          row 31 (owner decision 2026-10-28).
 */
import type { ErrorPagePreset } from "@stackra/ui/contracts";
import { Button, ErrorPage, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ERROR_PAGE_DEMO_KEYS } from "#src/demos/free/error-page/error-page-demo-keys.constant";

/** The demo's keys. */
const K = ERROR_PAGE_DEMO_KEYS.demo_free.error_page.presets;

/** Each preset and the key of its chooser's label. */
const PRESETS = [
  ["forbidden", K.forbidden],
  ["not-found", K.not_found],
  ["server-error", K.server_error],
  ["offline", K.offline],
] as const satisfies readonly (readonly [ErrorPagePreset, string])[];

/** Choose a preset to see its words and icon. */
export default function Presets() {
  const t = useCatalogueText(MESSAGES.en);
  const [preset, setPreset] = useState<ErrorPagePreset>("not-found");
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        {PRESETS.map(([value, key]) => (
          <Button
            key={value}
            size="sm"
            variant={value === preset ? "primary" : "secondary"}
            onPress={() => setPreset(value)}
          >
            {t(key)}
          </Button>
        ))}
      </View>
      <ErrorPage key={preset} preset={preset} headingLevel={3} />
    </View>
  );
}
