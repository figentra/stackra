/**
 * Stackra file contract:
 * Purpose: the native `Heading` on HeroUI Native `Typography.Heading` (header role, Dynamic Type ramp): draws the
 *          style `type` (default the level's) with the shared tone, alignment, truncation and language. React Native
 *          has no heading levels, so `level` sets only the default style.
 * Boundary: no styling of its own; needs the native DesignSystemProvider for the locale.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decisions 6 and 7); ADR 0165 (UI contract); WCAG 2.2 SC 1.3.1.
 */
import { Typography } from "heroui-native";

import { TONE_CLASS_NAME } from "#core/constants/tone-class-name.constant";
import { isArabic } from "#core/functions/is-arabic.function";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import type { HeadingProps } from "#native/heading/heading.props";

/**
 * A heading with the header role. `level` is accepted for the shared contract but React Native has no heading
 * levels to report, so it only picks the default `type`. Must sit inside the native `DesignSystemProvider`.
 */
export function Heading({
  level,
  type = `h${level}`,
  tone = "default",
  align,
  isTruncated,
  lang,
  className,
  ...rest
}: HeadingProps) {
  const { locale } = useDesignSystem();
  const arabicClass = isArabic(lang ?? locale) ? `type-${type}-ar` : "";
  return (
    <Typography.Heading
      type={type}
      color={tone === "muted" ? "muted" : "default"}
      align={align ?? "start"}
      truncate={isTruncated ?? false}
      className={[TONE_CLASS_NAME[tone], arabicClass, className].filter(Boolean).join(" ")}
      {...(lang ? { accessibilityLanguage: lang } : {})}
      {...rest}
    />
  );
}
