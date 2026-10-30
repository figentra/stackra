/**
 * Stackra file contract:
 * Purpose: `KnobsPlayground`, the generic live playground of a component page: knobs read from the root part's
 *          generated API (`knobsFromProps`), the component mounted with their values in a pane with its own direction,
 *          scheme and density toggles, and the JSX for the current values below, with copy.
 * Boundary: loaded lazily; it finds the export by name in the `@stackra/ui/react` module (a dynamic import, already loaded); a component
 *           that throws on a combination shows the preview error, never breaks the page.
 * Runtime: browser
 * Governing contract: STA-1371 (doc pages wave, owner approval 2026-10-28); showcase redesign spec (2026-10-27) WP11.
 */
import {
  Button,
  Card,
  Icon,
  NumberField,
  Switch,
  Text,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  useCatalogueText,
} from "@stackra/ui/react";
import { type ComponentType, useEffect, useMemo, useState } from "react";

import { CodeSnippet } from "#src/components/code-snippet/code-snippet";
import { COMPONENT_PAGE_KEYS } from "#src/components/component-page/component-page-keys.constant";
import { DemoBoundary } from "#src/components/component-page/demo-boundary";
import { DOC_PAGE_KEYS } from "#src/components/doc-page/doc-page-keys.constant";
import { knobCode } from "#src/components/doc-page/knob-code.function";
import { knobsFromProps } from "#src/components/doc-page/knobs-from-props.function";
import type { KnobsPlaygroundProps } from "#src/components/doc-page/knobs-playground.props";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";

const K = DOC_PAGE_KEYS.showcase.doc.ui;
const UI_K = COMPONENT_PAGE_KEYS.showcase.ui;

const DIRECTIONS = ["ltr", "rtl"] as const;
const SCHEMES = ["light", "dark"] as const;
const DENSITIES = ["compact", "comfortable", "spacious"] as const;

/** The knobs playground of `entry`. */
export default function KnobsPlayground({ entry, part, title, hasChildren }: KnobsPlaygroundProps) {
  const t = useCatalogueText(MESSAGES.en);
  const knobs = useMemo(() => knobsFromProps(part.props), [part]);
  const seed = useMemo(
    () =>
      Object.fromEntries(
        knobs.map((knob) => [
          knob.prop,
          knob.control === "text" ? (knob.prop === "label" ? title : "") : knob.initial,
        ]),
      ) as Record<string, unknown>,
    [knobs, title],
  );
  const [values, setValues] = useState(seed);
  const [dir, setDir] = useState<(typeof DIRECTIONS)[number]>();
  const [scheme, setScheme] = useState<(typeof SCHEMES)[number]>();
  const [density, setDensity] = useState<(typeof DENSITIES)[number]>("comfortable");
  const [Component, setComponent] = useState<ComponentType<Record<string, unknown>>>();
  useEffect(() => {
    let isLive = true;
    // The entry's export by name; the module is already loaded, so this resolves at once.
    void import("@stackra/ui/react").then((ui) => {
      const found = (ui as Record<string, unknown>)[entry.exportName];
      // A memo or forwardRef component is an object, a plain one a function.
      if (isLive && found && (typeof found === "function" || typeof found === "object"))
        setComponent(() => found as ComponentType<Record<string, unknown>>);
    });
    return () => {
      isLive = false;
    };
  }, [entry.exportName]);
  if (knobs.length === 0) return <Text tone="muted">{t(K.no_knobs)}</Text>;
  if (!Component) return null;
  const set = (prop: string, value: unknown) =>
    setValues((current) => ({ ...current, [prop]: value }));
  // Empty text knobs stay out of the props, so a component's own default applies.
  const props = Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== "" && value !== undefined),
  );
  const children = hasChildren ? title : undefined;

  return (
    <Card className="grid min-w-0 gap-0 overflow-hidden p-0 [contain:inline-size] lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="grid min-w-0 grid-rows-[1fr_auto]">
        <div
          dir={dir}
          lang={dir === "rtl" ? "ar" : dir === "ltr" ? "en" : undefined}
          data-theme={scheme}
          data-density={density}
          className={`relative grid min-h-56 min-w-0 place-items-center overflow-x-auto bg-background p-6 pt-14 text-foreground ${scheme ?? ""}`}
          style={{ colorScheme: scheme }}
        >
          <span aria-hidden="true" className="stage-dots" />
          <div className="absolute start-2 top-2 flex flex-wrap gap-1">
            <ToggleButtonGroup
              aria-label={t(UI_K.direction)}
              size="sm"
              selectionMode="single"
              selectedKeys={dir ? [dir] : []}
              onSelectionChange={(keys) => setDir(DIRECTIONS.find((value) => keys.has(value)))}
            >
              {DIRECTIONS.map((value) => (
                <ToggleButton key={value} id={value} aria-label={value.toUpperCase()}>
                  <span dir="ltr" className="font-mono text-xs uppercase">
                    {value}
                  </span>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <ToggleButtonGroup
              aria-label={t(UI_K.scheme)}
              size="sm"
              selectionMode="single"
              selectedKeys={scheme ? [scheme] : []}
              onSelectionChange={(keys) => setScheme(SCHEMES.find((value) => keys.has(value)))}
            >
              {SCHEMES.map((value) => (
                <ToggleButton key={value} id={value} aria-label={value}>
                  <Icon name={value === "light" ? Icons.Sun : Icons.Moon} size="sm" />
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <ToggleButtonGroup
              aria-label={t(K.density)}
              size="sm"
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[density]}
              onSelectionChange={(keys) =>
                setDensity(DENSITIES.find((value) => keys.has(value)) ?? "comfortable")
              }
            >
              {DENSITIES.map((value) => (
                <ToggleButton key={value} id={value}>
                  <span className="text-xs">{t(K[`density_${value}`])}</span>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </div>
          <DemoBoundary
            key={JSON.stringify(props)}
            fallback={<Text tone="danger">{t(UI_K.preview_error)}</Text>}
          >
            <Component {...props}>{children}</Component>
          </DemoBoundary>
        </div>
        <div className="border-t border-separator p-2">
          <CodeSnippet
            code={knobCode(entry.exportName, knobs, values, children)}
            title={`${entry.slug}.tsx`}
            copyLabel={t(UI_K.copy)}
          />
        </div>
      </div>
      <form
        aria-label={t(K.playground)}
        className="grid content-start gap-3 border-separator p-4 max-lg:border-t lg:border-s"
        onSubmit={(event) => event.preventDefault()}
      >
        {knobs.map((knob) =>
          knob.control === "switch" ? (
            <Switch
              key={knob.prop}
              label={knob.prop}
              value={values[knob.prop] === true}
              onChange={(isOn: boolean) => set(knob.prop, isOn)}
            />
          ) : knob.control === "number" ? (
            <NumberField
              key={knob.prop}
              label={knob.prop}
              value={typeof values[knob.prop] === "number" ? (values[knob.prop] as number) : null}
              onChange={(value: number | null) => set(knob.prop, value ?? undefined)}
            />
          ) : knob.control === "text" ? (
            <TextField
              key={knob.prop}
              label={knob.prop}
              value={String(values[knob.prop] ?? "")}
              onChange={(value: string) => set(knob.prop, value)}
            />
          ) : (
            <div key={knob.prop} className="grid gap-1">
              <Text type="small" className="font-mono" id={`knob-${knob.prop}`}>
                {knob.prop}
              </Text>
              <ToggleButtonGroup
                aria-labelledby={`knob-${knob.prop}`}
                size="sm"
                selectionMode="single"
                selectedKeys={values[knob.prop] ? [String(values[knob.prop])] : []}
                onSelectionChange={(keys) =>
                  set(
                    knob.prop,
                    knob.options?.find((option) => keys.has(option)),
                  )
                }
                className="flex-wrap"
              >
                {(knob.options ?? []).map((option) => (
                  <ToggleButton key={option} id={option}>
                    <span dir="ltr" className="font-mono text-xs">
                      {option}
                    </span>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </div>
          ),
        )}
        <Button
          variant="ghost"
          size="sm"
          onPress={() => setValues(seed)}
          className="justify-self-start"
        >
          {t(K.reset)}
        </Button>
      </form>
    </Card>
  );
}
