/**
 * Stackra file contract:
 * Purpose: the web `PhoneField`: one field holding a country button and the number. The button, at the field's start,
 *          shows only the flag and dial code (🇸🇦 +966) and opens a popover with a searchable list: each row is the
 *          flag, the country's name in the locale and its dial code, and the search matches the name in English and
 *          Arabic, the ISO code and the dial code. The number is typed in left-to-right digits; a hidden input carries
 *          the E.164 value for a form.
 * Boundary: React Aria's Autocomplete over HeroUI's ListBox, inside the house Popover; the value is `phoneValueOf`'s.
 *           Logical properties only, so in Arabic the country button sits at the start (the right).
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0060 (RTL);
 *          WCAG 2.2 SC 1.3.1, 4.1.2.
 */
import { Description, FieldError, Label, ListBox, cn } from "@heroui/react";
import { useId, useMemo, useState, type ReactElement } from "react";
import { Autocomplete, Button as AriaButton, useLocale } from "react-aria-components";

import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { phoneCountriesOf } from "#core/functions/phone-countries-of.function";
import { phoneCountryMatches } from "#core/functions/phone-country-matches.function";
import { phoneValueOf } from "#core/functions/phone-value-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import type { PhoneFieldProps } from "#react/phone-field/phone-field.props";
import { Popover } from "#react/popover/popover";
import { SearchField } from "#react/search-field/search-field";

/** A phone number with its country, in one field. */
export function PhoneField({
  label,
  description,
  errorMessage,
  defaultCountry = "SA",
  countries,
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
}: PhoneFieldProps): ReactElement {
  const id = useId();
  const t = useUiText();
  const K = FORMS_KEYS.ui.phone_field;
  const { locale } = useLocale();
  const [ownCountry, setCountry] = useState(defaultValue?.country ?? defaultCountry);
  const [text, setText] = useState(defaultValue?.national ?? "");
  const [isOpen, setOpen] = useState(false);
  const country = value?.country ?? ownCountry;
  const shown = value === undefined ? text : (value?.national ?? "");
  const list = useMemo(() => phoneCountriesOf(locale, countries), [countries, locale]);
  const byCode = useMemo(() => new Map(list.map((item) => [item.code, item])), [list]);
  const current = byCode.get(country);
  const dial = current ? `+${current.dial}` : "";
  const report = (nextCountry: string, nextText: string) =>
    onChange?.(phoneValueOf(nextCountry, nextText));
  const pick = (code: string) => {
    setCountry(code);
    setOpen(false);
    report(code, shown);
  };
  const isLocked = Boolean(isDisabled || isReadOnly);

  return (
    <div className={cn("grid gap-1.5", isFullWidth ? "w-full" : "w-fit", className) ?? ""}>
      {label ? (
        <Label htmlFor={`${id}-number`} {...(isRequired ? { isRequired } : {})}>
          {label}
        </Label>
      ) : null}
      <div
        data-slot="phone-field"
        data-invalid={isInvalid || undefined}
        className={
          cn(
            "flex h-10 min-w-0 items-stretch overflow-hidden rounded-[var(--radius-control)] border border-field-border bg-field text-field-foreground",
            "focus-within:border-field-border-focus has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-focus",
            isInvalid && "border-danger",
            isDisabled && "opacity-60",
          ) ?? ""
        }
      >
        <Popover
          isOpen={isOpen}
          onOpenChange={setOpen}
          placement="bottom"
          align="start"
          aria-label={t(FORMS_KEYS.ui.country_select.label)}
          className="w-80 max-w-[calc(100vw-2rem)] p-0"
          trigger={
            <AriaButton
              isDisabled={isLocked}
              aria-label={t(K.selected, {
                country: current?.name ?? country,
                code: dial,
              })}
              className={({ isFocusVisible }) =>
                cn(
                  "flex shrink-0 items-center gap-1.5 border-e border-field-border ps-3 pe-2 text-sm outline-none hover:bg-default disabled:cursor-default",
                  isFocusVisible && "outline-2 -outline-offset-2 outline-focus",
                ) ?? ""
              }
            >
              {/* The flag is drawn by CSS: an emoji in the visible text left axe unable to match it to the name. */}
              <span
                aria-hidden="true"
                data-flag={current?.flag ?? ""}
                className="text-base leading-none before:content-[attr(data-flag)]"
              />
              <bdi dir="ltr" className="tabular-nums">
                {dial}
              </bdi>
              <Icon name="chevron-down" size="sm" tone="muted" />
            </AriaButton>
          }
        >
          <Autocomplete
            filter={(_text, query, node) => {
              const item = byCode.get(String(node.key));
              return item ? phoneCountryMatches(item, query) : false;
            }}
          >
            <div className="border-b border-separator p-2">
              <SearchField
                aria-label={t(FORMS_KEYS.ui.country_select.search)}
                placeholder={t(FORMS_KEYS.ui.country_select.search)}
                // oxlint-disable-next-line jsx-a11y/no-autofocus -- reason: the list opens because the user pressed the country button; its search takes the focus
                autoFocus
                isFullWidth
              />
            </div>
            <ListBox
              aria-label={t(FORMS_KEYS.ui.country_select.label)}
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[country]}
              onSelectionChange={(keys) => {
                const [key] = keys === "all" ? [] : keys;
                if (key !== undefined) pick(String(key));
              }}
              className="max-h-72 overflow-y-auto p-1"
              renderEmptyState={() => (
                <p className="m-0 p-4 text-center text-sm text-muted">{t(K.empty)}</p>
              )}
            >
              {list.map((item) => (
                <ListBox.Item key={item.code} id={item.code} textValue={item.name}>
                  <span aria-hidden="true" className="text-base leading-none">
                    {item.flag}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  <bdi dir="ltr" className="text-sm text-muted tabular-nums">
                    +{item.dial}
                  </bdi>
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Autocomplete>
        </Popover>
        <input
          id={`${id}-number`}
          type="tel"
          dir="ltr"
          inputMode="tel"
          autoComplete="tel-national"
          aria-label={typeof label === "string" ? undefined : t(K.number)}
          aria-invalid={isInvalid || undefined}
          aria-describedby={description || errorMessage ? `${id}-help` : undefined}
          required={isRequired}
          disabled={isDisabled}
          readOnly={isReadOnly}
          value={shown}
          onChange={(event) => {
            setText(event.target.value);
            report(country, event.target.value);
          }}
          // `dir="ltr"` keeps the digits in order; in Arabic they sit beside the country button, on the right.
          className="min-w-0 flex-1 bg-transparent px-3 text-left tabular-nums outline-none [unicode-bidi:isolate] rtl:text-right"
        />
      </div>
      {name ? (
        <input type="hidden" name={name} value={phoneValueOf(country, shown)?.e164 ?? ""} />
      ) : null}
      <div id={`${id}-help`}>
        {description ? <Description>{description}</Description> : null}
        {isInvalid && errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
      </div>
    </div>
  );
}
