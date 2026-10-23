/**
 * Stackra file contract:
 * Purpose: the native `Text` on HeroUI Native `Typography.Paragraph`: maps the shared contract (`type`, `tone`,
 *          `isTruncated`, `lang` to `accessibilityLanguage`), adds the theme's `-ar` class for Arabic text (from `lang`
 *          or the provider's locale) and passes every other React Native text prop through unchanged.
 * Boundary: no styling of its own; needs the native DesignSystemProvider for the locale.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decisions 6 and 7); ADR 0165 (HeroUI Native on native).
 */
import { Typography, type TypographyParagraphProps } from "heroui-native";

import type { TextContractProps } from "#contracts/types/text-contract-props.type";
import { TONE_CLASS_NAME } from "#core/constants/tone-class-name.constant";
import { TYPOGRAPHY_TYPE } from "#core/constants/typography-type.constant";
import { isArabic } from "#core/functions/is-arabic.function";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";

/**
 * Props of the native Text: the shared contract plus HeroUI Native Typography.Paragraph's props, passed through.
 * HeroUI's `color` and `truncate` are the contract's `tone` and `isTruncated`, so the type refuses them.
 */
export type TextProps = TextContractProps &
  Omit<TypographyParagraphProps, keyof TextContractProps | "color" | "truncate">;

/**
 * Running text in the theme's type scale. Arabic text, by `lang` or by the screen's locale, takes the theme's `-ar`
 * style. Must sit inside the native `DesignSystemProvider`, which holds the locale.
 */
export function Text({
  type = "body",
  tone = "default",
  align,
  isTruncated,
  lang,
  className,
  ...rest
}: TextProps) {
  const { locale } = useDesignSystem();
  // `type-<type>-ar` is the theme's own class (named after the token), not a utility, so no scanning is needed.
  const arabicClass = isArabic(lang ?? locale) ? `type-${type}-ar` : "";
  return (
    <Typography.Paragraph
      type={TYPOGRAPHY_TYPE[type]}
      color={tone === "muted" ? "muted" : "default"}
      align={align ?? "start"}
      truncate={isTruncated ?? false}
      className={[TONE_CLASS_NAME[tone], arabicClass, className].filter(Boolean).join(" ")}
      {...(lang ? { accessibilityLanguage: lang } : {})}
      {...rest}
    />
  );
}
