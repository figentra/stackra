/**
 * Stackra file contract:
 * Purpose: the "tones" demo of the native Link: one link per `tone`, with each `underline`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Enum, Tone } from "@stackra/contracts";
import { LinkUnderline } from "@stackra/ui/contracts";
import { Link } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";

/** Every tone with `hover` (standalone) and `always`. */
export default function Tones() {
  return (
    <View className="gap-3">
      {LinkUnderline.map((underline) => (
        <Sample key={underline} caption={underline}>
          <View className="flex-row flex-wrap gap-4">
            {Enum.values(Tone).map((tone) => (
              <Link key={tone} href="https://heroui.com" tone={tone} underline={underline}>
                {tone}
              </Link>
            ))}
          </View>
        </Sample>
      ))}
    </View>
  );
}
