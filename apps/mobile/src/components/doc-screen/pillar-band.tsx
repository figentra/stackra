/**
 * Stackra file contract:
 * Purpose: the native `PillarBand`: what it is, when to use it and how it is built, three stacked surfaces (side by side
 *          from the `md` breakpoint, a tablet).
 * Boundary: presentation; the words come in translated.
 * Runtime: react-native
 * Governing contract: STA-1371 (doc pages wave, owner approval 2026-10-28).
 */
import { Surface, Text, useBreakpoint, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { DOC_KEYS } from "#src/components/doc-screen/doc-keys.constant";
import type { PillarBandProps } from "#src/components/doc-screen/pillar-band.props";
import { MESSAGES } from "#src/constants/messages.constant";

const K = DOC_KEYS.showcase.doc.ui;

/** What, when and how. */
export function PillarBand({ what, when, how }: PillarBandProps) {
  const t = useCatalogueText(MESSAGES.en);
  // One column on a phone, a row from the first breakpoint up (a tablet).
  const isWide = useBreakpoint().breakpoint !== undefined;
  const pillars = [
    { id: "what", title: t(K.pillar_what), body: what },
    { id: "when", title: t(K.pillar_when), body: when },
    { id: "how", title: t(K.pillar_how), body: how },
  ];
  return (
    <View className={isWide ? "flex-row gap-3" : "gap-3"}>
      {pillars.map((pillar) => (
        <Surface key={pillar.id} className={`gap-1 p-3.5 ${isWide ? "flex-1" : ""}`}>
          <Text className="font-semibold">{pillar.title}</Text>
          <Text type="small" tone="muted">
            {pillar.body}
          </Text>
        </Surface>
      ))}
    </View>
  );
}
