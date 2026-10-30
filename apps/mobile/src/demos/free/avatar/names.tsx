/**
 * Stackra file contract:
 * Purpose: the "names" demo of the native Avatar: initials from the first and last words; an Arabic name gives one letter.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Avatar } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";

/** Sample people's names (never translated), each beside its initials. */
const NAMES = ["Ada Lovelace", "Plato", "émile zola", "ليلى أحمد"] as const;

/** Each name and the initials it gives. */
export default function Names() {
  return (
    <View className="flex-row flex-wrap items-start gap-4">
      {NAMES.map((name) => (
        <Sample key={name} caption={name}>
          <Avatar name={name} tone="accent" variant="soft" />
        </Sample>
      ))}
    </View>
  );
}
