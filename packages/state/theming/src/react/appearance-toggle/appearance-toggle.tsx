/**
 * Stackra file contract:
 * Purpose: `AppearanceToggle`, the theming kit's colour scheme control on the web: the schemes on offer as segments,
 *          a dark-mode switch, or a menu behind a button for a site header. Picking one keeps it on the device.
 * Boundary: composition of @stackra/ui over `useColorScheme`. The schemes on offer are `ThemingConfig.schemes`, in
 *           their order. Uncontrolled it sets the container's `ColorSchemeService`; with `value` it only reports
 *           `onChange`. The switch is on while dark is on screen and picks light or dark, never system.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0060 (light and dark); ADR 0302 (decision 3: UI from
 *                     @stackra/ui); UI build list spec 2026-11-02 (prop changes).
 */
import { useContainer } from "@stackra/container/react";
import { Dropdown, SegmentedControl, Switch, Text } from "@stackra/ui/react";
import type { ColorScheme } from "@stackra/ui/contracts";
import { type ReactElement, useId } from "react";

import { ThemingConfig } from "#core/index";
import type { AppearanceToggleProps } from "#react/appearance-toggle/appearance-toggle.props";
import { useColorScheme } from "#react/color-scheme/use-color-scheme";

/**
 * The colour scheme picker.
 *
 * @example
 * <AppearanceToggle variant="menu" label={t(K.appearance)} labels={{ light: t(K.light), dark: t(K.dark), system: t(K.system) }} />
 */
export function AppearanceToggle({
  label,
  description,
  isDisabled,
  value,
  onChange,
  variant = "segmented",
  className,
  labels,
}: AppearanceToggleProps): ReactElement {
  const state = useColorScheme();
  const schemes = useContainer().get(ThemingConfig).schemes;
  const descriptionId = useId();
  const chosen = value ?? state.scheme;
  const choose = (scheme: ColorScheme) => {
    if (value === undefined) state.setScheme(scheme);
    onChange?.(scheme);
  };
  const describedBy = description === undefined ? {} : { "aria-describedby": descriptionId };
  const help =
    description === undefined ? null : (
      <Text id={descriptionId} tone="muted" type="small">
        {description}
      </Text>
    );

  if (variant === "switch")
    return (
      <Switch
        label={label}
        value={(chosen === "system" ? state.resolved : chosen) === "dark"}
        onChange={(isDark) => choose(isDark ? "dark" : "light")}
        {...(description === undefined ? {} : { description })}
        {...(isDisabled === undefined ? {} : { isDisabled })}
        {...(className === undefined ? {} : { className })}
      />
    );

  if (variant === "menu")
    return (
      <div className={`flex flex-col gap-1 ${className ?? ""}`}>
        <Dropdown>
          <Dropdown.Trigger
            variant="ghost"
            aria-label={`${label}: ${labels[chosen]}`}
            {...describedBy}
            {...(isDisabled === undefined ? {} : { isDisabled })}
          >
            {labels[chosen]}
          </Dropdown.Trigger>
          <Dropdown.Menu
            selectionMode="single"
            selectedKeys={[chosen]}
            onAction={(key) => choose(String(key) as ColorScheme)}
          >
            {schemes.map((scheme) => (
              <Dropdown.Item key={scheme} id={scheme}>
                {labels[scheme]}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
        {help}
      </div>
    );

  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <SegmentedControl
        label={label}
        items={schemes.map((scheme) => ({ id: scheme, label: labels[scheme] }))}
        selectedKey={chosen}
        onSelectionChange={(key) => choose(key as ColorScheme)}
        {...describedBy}
        {...(isDisabled === undefined ? {} : { isDisabled })}
      />
      {help}
    </div>
  );
}
