/**
 * Stackra file contract:
 * Purpose: the native `QrCode`: a text or link as a QR code (`qrPathOf`) drawn with react-native-svg, dark modules on
 *          a light tile with the quiet zone.
 * Boundary: an image named by `label`; always dark on light in both themes, and never mirrored.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ISO/IEC 18004; STA-1371.
 */
import { useMemo, type ReactElement } from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { qrPathOf } from "#core/functions/qr-path-of.function";
import type { QrCodeProps } from "#native/qr-code/qr-code.props";

/** A QR code. */
export function QrCode({ value, label, size = 160, level = "M", className }: QrCodeProps): ReactElement {
  const qr = useMemo(() => qrPathOf(value, level), [value, level]);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      className={`self-start overflow-hidden rounded-[var(--radius-container)] bg-white ${className ?? ""}`}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${qr.size} ${qr.size}`}>
        <Path d={qr.path} fill="black" />
      </Svg>
    </View>
  );
}
