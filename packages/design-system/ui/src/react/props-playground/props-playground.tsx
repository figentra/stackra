/**
 * Stackra file contract:
 * Purpose: the web `PropsPlayground`: a live component over a panel of its props, each a text field, switch, choice
 *          or number field named by the prop, with a reset; plus a theme switch that draws the preview in a product's
 *          tokens and a direction switch that turns it right-to-left. The proof that a product changes its colour,
 *          never the controls.
 * Boundary: a group named by `label`. The theme and direction apply to the preview's own element and its overlays
 *           (portalled into it), never to the page: a nested DesignSystemProvider cannot scope them, since it writes
 *           onto `<html>`. The controls come in as a prop; the docs build them from the showcase registry. Prop names
 *           are code and stay Latin.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); ADR 0340 (decision 2); STA-2041.
 */
import { cn } from "@heroui/react";
import { type ReactElement, useState } from "react";
import { I18nProvider } from "react-aria-components";

import type { PlaygroundControl } from "#contracts/types/playground-control.type";
import { LONG_TAIL_KEYS } from "#core/constants/long-tail-keys.constant";
import { Button } from "#react/button/button";
import { PortalContainer } from "#react/design-system-provider/portal-container";
import { useThemeStyle } from "#react/hooks/use-theme-style";
import { useUiText } from "#react/hooks/use-ui-text";
import { NumberField } from "#react/number-field/number-field";
import type { PropsPlaygroundProps } from "#react/props-playground/props-playground.props";
import { SegmentedControl } from "#react/segmented-control/segmented-control";
import { Select } from "#react/select/select";
import { Switch } from "#react/switch/switch";
import { TextField } from "#react/text-field/text-field";

/** The playground's words. */
const K = LONG_TAIL_KEYS.ui.props_playground;

/** The theme switch's key for the page's own theme. */
const DEFAULT = "default";

/** A control's starting value when it names none. */
function startOf(control: PlaygroundControl): string | boolean | number {
  if (control.default !== undefined) return control.default;
  if (control.type === "boolean") return false;
  if (control.type === "number") return 0;
  return control.type === "enum" ? (control.options?.[0] ?? "") : "";
}

/** A live component with a panel of its props, a theme switch and a direction switch. */
export function PropsPlayground({
  label,
  controls,
  render,
  values,
  defaultValues,
  onChange,
  brands,
  hasDirection = true,
  resetLabel,
  className,
}: PropsPlaygroundProps): ReactElement {
  const t = useUiText();
  const start = () => ({
    ...Object.fromEntries(controls.map((control) => [control.name, startOf(control)])),
    ...defaultValues,
  });
  const [own, setOwn] = useState(start);
  const [brand, setBrand] = useState(DEFAULT);
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");
  const [layer, setLayer] = useState<HTMLDivElement | null>(null);
  const current = values ?? own;
  const chosen = brands?.find((item) => item.id === brand);
  const style = useThemeStyle(chosen?.theme);

  const set = (name: string, value: string | boolean | number) => {
    const next = { ...current, [name]: value };
    setOwn(next);
    onChange?.(next);
  };
  const reset = () => {
    const next = start();
    setOwn(next);
    onChange?.(next);
    setBrand(DEFAULT);
    setDirection("ltr");
  };

  return (
    <div
      role="group"
      aria-label={label}
      data-slot="props-playground"
      className={cn(
        "grid overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface md:grid-cols-[1fr_20rem]",
        className,
      )}
    >
      <div
        role="region"
        aria-label={t(K.preview)}
        dir={direction}
        lang={direction === "rtl" ? "ar" : "en"}
        style={style}
        {...(chosen ? { "data-brand": chosen.theme.name } : {})}
        data-slot="props-playground-preview"
        className="relative flex min-h-64 items-center justify-center bg-background p-8 text-foreground"
      >
        <div ref={setLayer} className="fixed top-0 left-0 z-(--z-overlay)" />
        <PortalContainer container={layer}>
          <I18nProvider locale={direction === "rtl" ? "ar" : "en"}>{render(current)}</I18nProvider>
        </PortalContainer>
      </div>
      <div className="flex flex-col gap-4 border-t border-border p-4 md:border-t-0 md:border-s">
        <div className="flex items-center justify-between gap-2">
          <span dir="ltr" className="font-mono text-sm font-semibold">
            {label}
          </span>
          <Button variant="ghost" size="sm" onPress={reset}>
            {resetLabel ?? t(K.reset)}
          </Button>
        </div>
        {brands && brands.length > 0 ? (
          <SegmentedControl
            label={t(K.theme)}
            size="sm"
            selectedKey={brand}
            onSelectionChange={setBrand}
            items={[
              { id: DEFAULT, label: t(K.theme_default) },
              ...brands.map((item) => ({ id: item.id, label: item.label })),
            ]}
          />
        ) : null}
        {hasDirection ? (
          <SegmentedControl
            label={t(K.direction)}
            size="sm"
            selectedKey={direction}
            onSelectionChange={(key) => setDirection(key === "rtl" ? "rtl" : "ltr")}
            items={[
              { id: "ltr", label: t(K.ltr) },
              { id: "rtl", label: t(K.rtl) },
            ]}
          />
        ) : null}
        <div role="group" aria-label={t(K.controls)} className="flex flex-col gap-3">
          {controls.map((control) => {
            const value = current[control.name];
            const common = { label: control.name, description: control.type };
            if (control.type === "boolean")
              return (
                <Switch
                  key={control.name}
                  {...common}
                  value={value === true}
                  onChange={(next) => set(control.name, next)}
                />
              );
            if (control.type === "enum")
              return (
                <Select
                  key={control.name}
                  {...common}
                  description={(control.options ?? []).join(" | ")}
                  items={(control.options ?? []).map((option) => ({ id: option, label: option }))}
                  value={typeof value === "string" ? value : null}
                  onChange={(next) => set(control.name, next ?? "")}
                />
              );
            if (control.type === "number")
              return (
                <NumberField
                  key={control.name}
                  {...common}
                  value={typeof value === "number" ? value : null}
                  onChange={(next) => set(control.name, next ?? 0)}
                />
              );
            return (
              <TextField
                key={control.name}
                {...common}
                value={typeof value === "string" ? value : String(value ?? "")}
                onChange={(next) => set(control.name, next)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
