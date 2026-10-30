/**
 * Stackra file contract:
 * Purpose: the native `Barcode`: a value as a Code 128 or EAN-13 barcode (`barcodeOf`, our own encoder) drawn with
 *          react-native-svg, dark bars on a light tile with the quiet zone and the digits under it in platform Text.
 *          An invalid value shows an error line.
 * Boundary: an image named by `label` or the value. Always dark on light in both themes and laid out left to right
 *           in Arabic too: a barcode never mirrors.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ISO/IEC 15417; ISO/IEC 15420; STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import { useMemo, type ReactElement } from "react";
import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { LONG_TAIL_KEYS } from "#core/constants/long-tail-keys.constant";
import { barcodeOf } from "#core/functions/barcode-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import type { BarcodeProps } from "#native/barcode/barcode.props";

/** The barcode's words. */
const K = LONG_TAIL_KEYS.ui.barcode;

/** Points per module. */
const MODULE = 2;

/** A linear barcode. */
export function Barcode({
  value,
  format = "code128",
  label,
  height = 64,
  showText = true,
  className,
}: BarcodeProps): ReactElement {
  const t = useUiText();
  const drawing = useMemo(() => barcodeOf(value, format, height), [value, format, height]);
  if (drawing === null) {
    return (
      <View
        className={[
          "self-start rounded-[var(--radius-container)] border border-danger bg-danger-soft px-3 py-2",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Text className="text-sm text-danger-soft-foreground">{t(K.invalid)}</Text>
      </View>
    );
  }
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label ?? drawing.text}
      style={{ direction: "ltr" }}
      className={[
        "items-center gap-1 self-start rounded-[var(--radius-container)] bg-white pt-3 pb-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Svg
        width={drawing.width * MODULE}
        height={height}
        viewBox={`0 0 ${drawing.width} ${height}`}
        preserveAspectRatio="none"
      >
        <Path d={drawing.path} fill="black" />
      </Svg>
      {showText ? (
        <Text className="font-mono text-sm text-black" importantForAccessibility="no">
          {drawing.text}
        </Text>
      ) : null}
    </View>
  );
}
