/**
 * Stackra file contract:
 * Purpose: the "rtl" demo of the native Icon: icons that point the reading way flip in Arabic; objects never do.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Icon, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";

import { MESSAGES } from "#src/constants/messages.constant";
import { ICON_DEMO_KEYS } from "#src/demos/free/icon/icon-demo-keys.constant";

/** The demo's keys. */
const K = ICON_DEMO_KEYS.demo_free.icon.rtl;

/** Icons that point the reading way, by meaning: they flip in right-to-left. */
const MIRRORED = [
  ["next", "chevron-right"],
  ["continue", "arrow-right"],
  ["send", "send-horizontal"],
  ["undo", "undo-2"],
] as const;

/** Icons that depict an object or a state: they never flip. */
const NEVER_MIRRORED = [
  ["search", "search"],
  ["done", "check"],
  ["play", "play"],
] as const;

/** Switch the language to Arabic to see the first row flip. */
export default function Rtl() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      <Text type="small" tone="muted">
        {t(K.mirrored)}
      </Text>
      <View className="flex-row flex-wrap gap-6">
        {MIRRORED.map(([meaning, name]) => (
          <Sample key={name} caption={name}>
            <Icon name={name} size="lg" label={t(K[meaning])} isMirroredInRtl />
          </Sample>
        ))}
      </View>
      <Text type="small" tone="muted">
        {t(K.never_mirrored)}
      </Text>
      <View className="flex-row flex-wrap gap-6">
        {NEVER_MIRRORED.map(([meaning, name]) => (
          <Sample key={name} caption={name}>
            <Icon name={name} size="lg" label={t(K[meaning])} />
          </Sample>
        ))}
      </View>
    </View>
  );
}
