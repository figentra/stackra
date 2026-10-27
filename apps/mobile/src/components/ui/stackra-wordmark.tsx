/**
 * Stackra file contract:
 * Purpose: the Stackra beam-S wordmark drawn with react-native-svg in one colour, filled or as a hairline outline,
 *          for the design-system landing's hero stage (the solid mark and its echoes).
 * Boundary: the artwork only, always decorative here (hidden from assistive technology): the caller names the page
 *          in text. Copied from the web playground's `stackra-wordmark` (an app may not import another app), which
 *          copies apps/docs/src/assets/brand/logos/stackra-wordmark-light.svg; re-copy it when the wordmark changes.
 *          The wordmark never animates and is never glass (brand rule, ADR 0320 decision 5).
 * Runtime: react-native
 * Governing contract: ADR 0320 (glass and the showcase stage); the stackra brand kit.
 */
import Svg, { Path, Rect } from "react-native-svg";
import type { StackraWordmarkProps } from "./stackra-wordmark.props";

/** The bar and stem of the beam-S, as rectangles: x, y, width, height. */
const BEAM: readonly (readonly [number, number, number, number])[] = [
  [26.05, 24.9, 7.1, 53.2],
  [33.15, 24.9, 18.95, 7.1],
  [7.1, 71, 18.95, 7.1],
];

/** The letters `tackra`, one path. */
const LETTERS =
  "M108 78.1L93.2 78.1Q77.2 78.1 77.2 62.8L77.2 62.8L77.2 33.4L60.4 33.4L60.4 24.9L77.2 24.9L77.2 12.4L87.3 12.4L87.3 24.9L108 24.9L108 33.4L87.3 33.4L87.3 62.3Q87.3 69.6 94.3 69.6L94.3 69.6L108 69.6L108 78.1M134.4 79.3L134.4 79.3Q129.4 79.3 125.4 77.5Q121.4 75.7 119.05 72.4Q116.7 69.1 116.7 64.7L116.7 64.7Q116.7 57.9 120.85 54.15Q125 50.4 133.4 48.7L133.4 48.7L150.6 45.1Q150.6 32.7 139.8 32.7L139.8 32.7Q134.8 32.7 132 35Q129.2 37.3 128.2 41.4L128.2 41.4L117.6 40.7Q119.1 33.1 124.9 28.4Q130.7 23.7 139.8 23.7L139.8 23.7Q150 23.7 155.35 29.5Q160.7 35.3 160.7 45.5L160.7 45.5L160.7 66.5Q160.7 68.3 161.45 69.05Q162.2 69.8 163.8 69.8L163.8 69.8L166.8 69.8L166.8 78.1Q166.2 78.2 164.85 78.3Q163.5 78.4 162.2 78.4L162.2 78.4Q153.2 78.4 151.4 70.7L151.4 70.7L151.3 70.5Q149.3 74.4 144.75 76.85Q140.2 79.3 134.4 79.3M135.9 71L135.9 71Q143.2 71 146.9 67.25Q150.6 63.5 150.6 57.2L150.6 57.2L150.6 53.1L135.8 56.1Q131 57.1 129.1 58.95Q127.2 60.8 127.2 63.9L127.2 63.9Q127.2 67.3 129.5 69.15Q131.8 71 135.9 71M198.8 79.3L198.8 79.3Q191.4 79.3 185.8 75.85Q180.2 72.4 177.1 66.15Q174 59.9 174 51.5L174 51.5Q174 43.1 177.1 36.85Q180.2 30.6 185.8 27.15Q191.4 23.7 198.8 23.7L198.8 23.7Q207.9 23.7 214.05 28.75Q220.2 33.8 221.7 42.8L221.7 42.8L211.4 43.5Q210.2 38.5 206.9 35.75Q203.6 33 198.9 33L198.9 33Q192.1 33 188.3 37.95Q184.5 42.9 184.5 51.5L184.5 51.5Q184.5 60.1 188.3 65.05Q192.1 70 198.9 70L198.9 70Q203.7 70 207.15 67.15Q210.6 64.3 211.7 58.7L211.7 58.7L222 59.3Q220.5 68.4 214.2 73.85Q207.9 79.3 198.8 79.3M241.7 78.1L231.6 78.1L231.6 7.1L241.7 7.1L241.7 51.7L265.7 24.9L278.6 24.9L257.8 47.5L279.5 78.1L267.6 78.1L251.1 54.3L241.7 64.2L241.7 78.1M328.2 78.1L288 78.1L288 69.6L301.5 69.6L301.5 33.4L288 33.4L288 24.9L309.5 24.9L310.1 35.3Q312.7 24.9 322.9 24.9L322.9 24.9L334.2 24.9L334.2 33.7L323.3 33.7Q311.6 33.7 311.6 46.5L311.6 46.5L311.6 69.6L328.2 69.6L328.2 78.1M358.4 79.3L358.4 79.3Q353.4 79.3 349.4 77.5Q345.4 75.7 343.05 72.4Q340.7 69.1 340.7 64.7L340.7 64.7Q340.7 57.9 344.85 54.15Q349 50.4 357.4 48.7L357.4 48.7L374.6 45.1Q374.6 32.7 363.8 32.7L363.8 32.7Q358.8 32.7 356 35Q353.2 37.3 352.2 41.4L352.2 41.4L341.6 40.7Q343.1 33.1 348.9 28.4Q354.7 23.7 363.8 23.7L363.8 23.7Q374 23.7 379.35 29.5Q384.7 35.3 384.7 45.5L384.7 45.5L384.7 66.5Q384.7 68.3 385.45 69.05Q386.2 69.8 387.8 69.8L387.8 69.8L390.8 69.8L390.8 78.1Q390.2 78.2 388.85 78.3Q387.5 78.4 386.2 78.4L386.2 78.4Q377.2 78.4 375.4 70.7L375.4 70.7L375.3 70.5Q373.3 74.4 368.75 76.85Q364.2 79.3 358.4 79.3M359.9 71L359.9 71Q367.2 71 370.9 67.25Q374.6 63.5 374.6 57.2L374.6 57.2L374.6 53.1L359.8 56.1Q355 57.1 353.1 58.95Q351.2 60.8 351.2 63.9L351.2 63.9Q351.2 67.3 353.5 69.15Q355.8 71 359.9 71";

/** The artwork's aspect ratio, width over height. */
const WORDMARK_RATIO = 397.9 / 86.4;

/** The beam-S wordmark, as wide as its parent. */
export function StackraWordmark({ color, variant = "fill", opacity = 1 }: StackraWordmarkProps) {
  const paint =
    variant === "fill"
      ? { fill: color, fillOpacity: opacity }
      : {
          fill: "none",
          stroke: color,
          strokeOpacity: opacity,
          strokeWidth: 1,
          vectorEffect: "non-scaling-stroke" as const,
        };
  return (
    <Svg
      width="100%"
      viewBox="0 0 397.9 86.4"
      style={{ aspectRatio: WORDMARK_RATIO }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {BEAM.map(([x, y, width, height]) => (
        <Rect key={`${x}-${y}`} x={x} y={y} width={width} height={height} {...paint} />
      ))}
      <Path d={LETTERS} {...paint} />
    </Svg>
  );
}
