/**
 * Stackra file contract:
 * Purpose: `nativeDom`, a stand-in of `react-native` that renders plain DOM, so a native component's own logic runs in
 *          jsdom.
 * Boundary: test-only; used as `vi.mock("react-native", async () => (await import("#testing/fakes/native-dom")).nativeDom)`.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); ADR 0305 (one declaration per file); STA-1371.
 */
import { domOf } from "#testing/fakes/dom-of.function";

/** The `react-native` stand-in. */
export const nativeDom = {
  View: domOf("div"),
  Text: domOf("span"),
  Pressable: domOf("button"),
  TouchableOpacity: domOf("button"),
  ScrollView: domOf("div"),
  TextInput: domOf("input"),
  AccessibilityInfo: { announceForAccessibility: (): undefined => undefined },
  Platform: { OS: "ios", select: (options: Record<string, unknown>): unknown => options["ios"] },
  StyleSheet: { create: <T,>(styles: T): T => styles, hairlineWidth: 1 },
  I18nManager: { isRTL: false },
  useWindowDimensions: (): { width: number; height: number } => ({ width: 390, height: 844 }),
  Keyboard: { dismiss: (): undefined => undefined },
};
