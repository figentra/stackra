/**
 * Stackra file contract:
 * Purpose: the "long" demo of the native Link: an Arabic sentence whose link wraps across lines.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Link, Text } from "@stackra/ui/native";
import { View } from "react-native";

/** The sample sentence is Arabic in every language: the demo is about Arabic text wrapping. */
const BEFORE = "هذه جملة عربية طويلة تحتوي على";
const LINK = "رابط يلتف عبر عدة أسطر داخل الجملة";
const AFTER = "، ثم تتابع الجملة بعده.";

/** The link wraps with the sentence. */
export default function Long() {
  return (
    <View className="flex-row flex-wrap items-center gap-1">
      <Text lang="ar">{BEFORE}</Text>
      <Link href="https://heroui.com">{LINK}</Link>
      <Text lang="ar">{AFTER}</Text>
    </View>
  );
}
