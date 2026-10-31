/**
 * Stackra file contract:
 * Purpose: the web `NativeSelect`: the Select contract on the browser's own `select`, styled as a house field (the
 *          label, the field, a chevron at the inline end, the description and the error), for long forms, kiosks and
 *          phones where the platform picker is best.
 * Boundary: the browser draws the list. The label, description and error are tied to the `select` with `for` and
 *           `aria-describedby`; `isInvalid` sets `aria-invalid`. Read-only is a disabled-looking select that still
 *           submits through a hidden input.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0055; WCAG 2.2
 *          SC 1.3.1, 3.3.1, 4.1.2.
 */
import { cn } from "@heroui/react";
import { useId, useState, type ReactElement } from "react";

import { Icon } from "#react/icon/icon";
import type { NativeSelectProps } from "#react/native-select/native-select.props";

/** A select drawn by the browser. */
export function NativeSelect({
  items,
  label,
  description,
  errorMessage,
  placeholder,
  isFullWidth = true,
  isRequired,
  isInvalid,
  isDisabled,
  isReadOnly,
  value,
  defaultValue,
  onChange,
  name,
  className,
  ...rest
}: NativeSelectProps): ReactElement {
  const id = useId();
  const [own, setOwn] = useState(defaultValue ?? null);
  const key = value === undefined ? own : value;
  const described = [description && `${id}-description`, isInvalid && errorMessage && `${id}-error`]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cn("flex flex-col gap-1", isFullWidth ? "w-full" : "w-fit", className) ?? ""}>
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
          {isRequired ? (
            <span aria-hidden className="text-danger">
              {" *"}
            </span>
          ) : null}
        </label>
      ) : null}
      <div className="relative">
        <select
          {...rest}
          id={id}
          name={isReadOnly ? undefined : name}
          value={key ?? ""}
          required={isRequired}
          disabled={isDisabled || isReadOnly}
          aria-invalid={isInvalid || undefined}
          aria-describedby={described || undefined}
          onChange={(event) => {
            const next = event.target.value || null;
            if (value === undefined) setOwn(next);
            onChange?.(next);
          }}
          className={
            cn(
              "h-10 w-full appearance-none rounded-[var(--radius-control)] border border-field-border bg-field ps-3 pe-9 text-field-foreground outline-none focus-visible:border-field-border-focus focus-visible:[outline-style:var(--focus-ring-style)] focus-visible:outline-(length:--focus-ring-width) focus-visible:outline-focus disabled:opacity-(--opacity-muted)",
              isInvalid && "border-danger",
            ) ?? ""
          }
        >
          {placeholder || key === null ? <option value="">{placeholder ?? ""}</option> : null}
          {items.map((item) => (
            <option key={item.id} value={item.id} disabled={item.isDisabled}>
              {item.label}
            </option>
          ))}
        </select>
        {isReadOnly && name ? <input type="hidden" name={name} value={key ?? ""} /> : null}
        <Icon
          name="chevron-down"
          size="sm"
          className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>
      {description ? (
        <p id={`${id}-description`} className="text-xs text-muted">
          {description}
        </p>
      ) : null}
      {isInvalid && errorMessage ? (
        <p id={`${id}-error`} className="text-xs text-danger">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
