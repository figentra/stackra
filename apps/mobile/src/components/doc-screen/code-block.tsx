/**
 * Stackra file contract:
 * Purpose: a code block of the mobile component screen: mono text with line numbers on a secondary surface, scrolling
 *          sideways, always left to right (code is never translated or mirrored). No highlighter in v1 (spec 9).
 * Boundary: one presentational component; no state.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) sections 3.3 and 7.4; ADR 0302 (shapes from tokens).
 */
import { Surface, Text } from "@stackra/ui/native";
import { ScrollView, View } from "react-native";

import type { CodeBlockProps } from "#src/components/doc-screen/code-block.props";

/** Code keeps the Latin reading direction whatever the app's locale is. */
const LTR = { writingDirection: "ltr", direction: "ltr" } as const;

/** Mono source with line numbers, scrolling sideways. */
export function CodeBlock({ code }: CodeBlockProps) {
  const lines = code.split("\n");
  return (
    <Surface variant="secondary" className="overflow-hidden">
      {/* The scroller is left to right too: in Arabic a horizontal ScrollView starts at its right end, which hid the
          line numbers and pushed short code to the middle. */}
      <ScrollView
        horizontal
        style={LTR}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="p-3"
      >
        <View style={LTR}>
          {lines.map((line, index) => (
            // oxlint-disable-next-line react/no-array-index-key -- reason: lines are positional, the index is the identity
            <View key={index} className="flex-row gap-3">
              <Text type="caption" tone="muted" className="w-6 text-right font-mono" style={LTR}>
                {index + 1}
              </Text>
              <Text type="small" className="font-mono" style={LTR} selectable>
                {line === "" ? " " : line}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Surface>
  );
}
