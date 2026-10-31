/**
 * Stackra file contract:
 * Purpose: the native `Rating`: a row of stars (or `icon`), filled in the warning colour up to the value. Picking is a
 *          radio group, one radio per star ("3 stars"), with a selection haptic; `isClearable` lets a press on the
 *          chosen star clear it. Read-only it is one image ("3.5 out of 5 stars") and a fraction fills part of a star,
 *          clipped from the reading start.
 * Boundary: the colour is never the only signal: each radio and the image say the number. Colours come from the theme
 *           (`useThemeColor`); sizes are the icon sizes. The row follows the layout direction, so it mirrors in Arabic.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.4.1 and 4.1.2; STA-1371.
 */
import { useThemeColor } from "heroui-native";
import { useState, type ReactElement } from "react";
import { Pressable, View } from "react-native";

import { ICON_SIZES } from "#core/constants/icon-sizes.constant";
import { RATING_KEYS } from "#core/constants/rating-keys.constant";
import { starFillOf } from "#core/functions/star-fill-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { haptics } from "#native/haptics/haptics";
import { useNumberFormat } from "#native/hooks/use-number-format";
import { Icon } from "#native/icon/icon";
import type { RatingProps } from "#native/rating/rating.props";
import { Text } from "#native/text/text";

const K = RATING_KEYS.ui.rating;

/** A star score: picked, or shown read-only with a fraction. */
export function Rating({
  value,
  defaultValue = 0,
  onChange,
  maxValue = 5,
  size = "md",
  icon = "star",
  isClearable,
  isReadOnly,
  isDisabled,
  isInvalid,
  label,
  description,
  errorMessage,
  className,
}: RatingProps): ReactElement {
  const t = useUiText();
  const format = useNumberFormat();
  const [active, inactive] = useThemeColor(["warning", "muted"]);
  const [own, setOwn] = useState(defaultValue);
  const current = value ?? own;
  const pick = (next: number) => {
    haptics.play("selection");
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  const spoken = t(K.value, { value: format(current), max: format(maxValue) });
  const positions = Array.from({ length: maxValue }, (_, index) => index + 1);
  const side = ICON_SIZES[size];
  const drawn = (color: string) =>
    typeof icon === "string" ? <Icon name={icon} size={size} stroke={color} fill={color} /> : icon;
  const star = (position: number) => {
    const fill = starFillOf(current, position);
    return (
      <View style={{ width: side, height: side }}>
        {drawn(inactive)}
        {fill > 0 ? (
          <View
            className="absolute inset-y-0 start-0 overflow-hidden"
            style={{ width: side * fill }}
          >
            <View className="absolute start-0 top-0" style={{ width: side, height: side }}>
              {drawn(active)}
            </View>
          </View>
        ) : null}
      </View>
    );
  };
  const row = `flex-row ${size === "lg" ? "gap-2" : "gap-1"}`;
  const caption = typeof label === "string" ? label : undefined;

  if (isReadOnly) {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={caption ? `${caption}: ${spoken}` : spoken}
        className={`${row} ${className ?? ""}`}
      >
        {positions.map((position) => (
          <View key={position}>{star(position)}</View>
        ))}
      </View>
    );
  }

  return (
    <View className={`gap-1.5 ${isDisabled ? "opacity-50" : ""} ${className ?? ""}`}>
      {label ? <Text className="font-medium">{label}</Text> : null}
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={caption ?? t(K.label)}
        className={row}
      >
        {positions.map((position) => (
          <Pressable
            key={position}
            disabled={Boolean(isDisabled)}
            accessibilityRole="radio"
            accessibilityLabel={t(K.star, { count: position })}
            accessibilityState={{ checked: position === current, disabled: Boolean(isDisabled) }}
            hitSlop={4}
            onPress={() => pick(isClearable && position === current ? 0 : position)}
            className="active:scale-90"
          >
            {star(position)}
          </Pressable>
        ))}
      </View>
      {description ? (
        <Text type="small" tone="muted">
          {description}
        </Text>
      ) : null}
      {isInvalid && errorMessage ? (
        <Text type="small" tone="danger" accessibilityLiveRegion="polite">
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}
