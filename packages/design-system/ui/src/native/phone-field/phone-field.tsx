/**
 * Stackra file contract:
 * Purpose: the native `PhoneField`: one field holding a country button and the number. The button, at the field's
 *          start, shows only the flag and dial code (🇸🇦 +966) and opens a sheet with a searchable list: each row is
 *          the flag, the country's name in the locale and its dial code, and the search matches the name in English and
 *          Arabic, the ISO code and the dial code. The number is typed in left-to-right digits.
 * Boundary: the house Drawer (a bottom sheet on a phone) and SearchField; the value is `phoneValueOf`'s. The row
 *           follows the reading direction, so in Arabic the country button sits at the start (the right).
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0060 (RTL).
 */
import { cn } from "heroui-native";
import { useMemo, useState, type ReactElement } from "react";
import { FlatList, Pressable, TextInput, View } from "react-native";

import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { phoneCountriesOf } from "#core/functions/phone-countries-of.function";
import { phoneCountryMatches } from "#core/functions/phone-country-matches.function";
import { phoneValueOf } from "#core/functions/phone-value-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { Drawer } from "#native/drawer/drawer";
import { Icon } from "#native/icon/icon";
import { SearchField } from "#native/search-field/search-field";
import { Text } from "#native/text/text";
import type { PhoneFieldProps } from "#native/phone-field/phone-field.props";

/** A phone number with its country, in one field. */
export function PhoneField({
  label,
  description,
  errorMessage,
  defaultCountry = "SA",
  countries,
  isRequired,
  isInvalid,
  isDisabled,
  isReadOnly,
  value,
  defaultValue,
  onChange,
  className,
}: PhoneFieldProps): ReactElement {
  const t = useUiText();
  const K = FORMS_KEYS.ui.phone_field;
  const { locale } = useDesignSystem();
  const [ownCountry, setCountry] = useState(defaultValue?.country ?? defaultCountry);
  const [text, setText] = useState(defaultValue?.national ?? "");
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const country = value?.country ?? ownCountry;
  const shown = value === undefined ? text : (value?.national ?? "");
  const list = useMemo(() => phoneCountriesOf(locale, countries), [countries, locale]);
  const current = list.find((item) => item.code === country);
  const dial = current ? `+${current.dial}` : "";
  const found = list.filter((item) => phoneCountryMatches(item, query));
  const isLocked = Boolean(isDisabled || isReadOnly);
  const pick = (code: string) => {
    setCountry(code);
    setOpen(false);
    setQuery("");
    onChange?.(phoneValueOf(code, shown));
  };

  return (
    <View className={`gap-1.5 ${className ?? ""}`}>
      {label == null ? null : (
        <Text className="font-medium">
          {label}
          {isRequired ? " *" : ""}
        </Text>
      )}
      <View
        className={
          cn(
            "h-12 flex-row items-stretch overflow-hidden rounded-[var(--radius-control)] border bg-field",
            isInvalid ? "border-danger" : "border-field-border",
            isDisabled && "opacity-60",
          ) ?? ""
        }
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(K.selected, { country: current?.name ?? country, code: dial })}
          accessibilityState={{ disabled: isLocked, expanded: isOpen }}
          disabled={isLocked}
          onPress={() => setOpen(true)}
          className="flex-row items-center gap-1.5 border-e border-field-border ps-3 pe-2"
        >
          <Text>{current?.flag}</Text>
          <Text style={{ writingDirection: "ltr" }}>{dial}</Text>
          <Icon name="chevron-down" size="sm" tone="muted" />
        </Pressable>
        <TextInput
          accessibilityLabel={typeof label === "string" ? label : t(K.number)}
          value={shown}
          editable={!isLocked}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          onChangeText={(next) => {
            setText(next);
            onChange?.(phoneValueOf(country, next));
          }}
          // The digits stay left to right in Arabic too.
          style={{ writingDirection: "ltr", textAlign: "left" }}
          className="flex-1 px-3 text-base text-field-foreground"
        />
      </View>
      {description == null ? null : (
        <Text type="small" tone="muted">
          {description}
        </Text>
      )}
      {isInvalid && errorMessage ? (
        <Text type="small" tone="danger" accessibilityLiveRegion="polite">
          {errorMessage}
        </Text>
      ) : null}
      <Drawer
        isOpen={isOpen}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
        snapPoints={["75%"]}
        label={t(FORMS_KEYS.ui.country_select.label)}
      >
        <Drawer.Header>
          <Drawer.Title>{t(FORMS_KEYS.ui.country_select.label)}</Drawer.Title>
          <Drawer.Close label={t(K.close)} />
        </Drawer.Header>
        <Drawer.Body>
          <SearchField
            accessibilityLabel={t(FORMS_KEYS.ui.country_select.search)}
            placeholder={t(FORMS_KEYS.ui.country_select.search)}
            value={query}
            onChange={setQuery}
          />
          <FlatList
            data={found}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text tone="muted" className="p-4 text-center">
                {t(K.empty)}
              </Text>
            }
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: item.code === country }}
                accessibilityLabel={t(K.selected, { country: item.name, code: `+${item.dial}` })}
                onPress={() => pick(item.code)}
                className="min-h-12 flex-row items-center gap-3 border-b border-separator px-1"
              >
                <Text>{item.flag}</Text>
                <Text className="flex-1" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text tone="muted" style={{ writingDirection: "ltr" }}>
                  {`+${item.dial}`}
                </Text>
                {item.code === country ? <Icon name="check" size="sm" tone="accent" /> : null}
              </Pressable>
            )}
          />
        </Drawer.Body>
      </Drawer>
    </View>
  );
}
