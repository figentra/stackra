/**
 * Stackra file contract:
 * Purpose: the web `Rating`: a row of stars (or `icon`), filled in the warning colour up to the value. Picking is a
 *          React Aria radio group, one radio per star ("3 stars"), so the arrow keys move along the row in the
 *          reading direction; `isClearable` lets a press on the chosen star, or Delete, clear it. Read-only it is one
 *          image ("3.5 out of 5 stars") and a fraction fills part of a star, clipped from the reading start.
 * Boundary: the colour is never the only signal: each radio and the image say the number. A press squashes the star
 *           at full motion only. Colours and sizes are tokens.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.4.1, 2.1.1 and 4.1.2; STA-1371.
 */
import { Description, FieldError, Label, cn } from "@heroui/react";
import { useState, type ReactElement } from "react";
import { Radio, RadioGroup } from "react-aria-components";

import { ICON_SIZES } from "#core/constants/icon-sizes.constant";
import { RATING_KEYS } from "#core/constants/rating-keys.constant";
import { starFillOf } from "#core/functions/star-fill-of.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Icon } from "#react/icon/icon";
import { useNumberFormat } from "#react/hooks/use-number-format";
import { useUiText } from "#react/hooks/use-ui-text";
import type { RatingProps } from "#react/rating/rating.props";

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
  isRequired,
  isInvalid,
  label,
  description,
  errorMessage,
  name,
  className,
}: RatingProps): ReactElement {
  const t = useUiText();
  const format = useNumberFormat();
  const [own, setOwn] = useState(defaultValue);
  const current = value ?? own;
  const pick = (next: number) => {
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  const spoken = t(K.value, { value: format(current), max: format(maxValue) });
  const positions = Array.from({ length: maxValue }, (_, index) => index + 1);
  const box = { width: ICON_SIZES[size], height: ICON_SIZES[size] };
  const star = (position: number) => {
    const fill = starFillOf(current, position);
    const drawn =
      typeof icon === "string" ? <Icon name={icon} size={size} fill="currentColor" /> : icon;
    return (
      <span className="relative inline-flex text-muted/60" style={box}>
        {drawn}
        {fill > 0 ? (
          <span
            data-slot="rating-fill"
            className="absolute inset-y-0 start-0 inline-flex overflow-hidden text-warning"
            style={{ width: `${fill * 100}%` }}
          >
            <span className="absolute inset-y-0 start-0 inline-flex" style={box}>
              {drawn}
            </span>
          </span>
        ) : null}
      </span>
    );
  };
  const row = cn("inline-flex", size === "lg" ? "gap-2" : "gap-1");

  if (isReadOnly) {
    return (
      <span
        role="img"
        aria-label={typeof label === "string" ? `${label}: ${spoken}` : spoken}
        data-slot="rating"
        className={cn(row, className)}
      >
        {positions.map((position) => (
          <span key={position}>{star(position)}</span>
        ))}
      </span>
    );
  }

  return (
    <RadioGroup
      data-slot="rating"
      orientation="horizontal"
      value={current > 0 ? String(current) : null}
      onChange={(picked) => pick(Number(picked))}
      {...(label ? {} : { "aria-label": t(K.label) })}
      {...omitUndefined({ isDisabled, isRequired, isInvalid, name })}
      className={cn("grid gap-1.5 data-[disabled]:opacity-50", className) ?? ""}
    >
      {label ? <Label>{label}</Label> : null}
      <div className={row}>
        {positions.map((position) => (
          <Radio
            key={position}
            value={String(position)}
            aria-label={t(K.star, { count: position })}
            // A press on the chosen star clears it: a radio group never reports re-picking the same value.
            onPress={() => {
              if (isClearable && position === current) pick(0);
            }}
            onKeyDown={(event) => {
              if (isClearable && (event.key === "Delete" || event.key === "Backspace")) pick(0);
            }}
            className="cursor-pointer rounded-[var(--radius-control-inner)] outline-none transition-transform duration-(--duration-fast) data-[disabled]:cursor-default data-[focus-visible]:ring-2 data-[focus-visible]:ring-focus data-[pressed]:scale-90 motion-reduce:transition-none"
          >
            {star(position)}
          </Radio>
        ))}
      </div>
      {description ? <Description>{description}</Description> : null}
      {isInvalid && errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </RadioGroup>
  );
}
