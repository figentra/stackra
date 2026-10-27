/**
 * Stackra file contract:
 * Purpose: the page of the switch route: every state of a switch (off, on, disabled, read-only, required, with a
 *          description, invalid with its message), a switch named by `aria-label`, and a live settings list whose
 *          switches report their state in a readout, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import { Heading, Switch as UiSwitch, Text } from "@stackra/ui/react";
import { useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { SwitchRoute } from "#src/routes/switch/switch.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::switch.*` keys.
const STRINGS = {
  documentTitle: `${SwitchRoute.title} · Stackra Playground`,
  intro:
    "A Switch turns a setting on or off, and the change takes effect at once. Its label is its name, and its description and error message are read out with it. To choose among options that are submitted later use a checkbox.",
  states: "States",
  statesNote: "One switch per state, each with the caption of the state it shows.",
  captions: {
    off: "Off",
    on: "On",
    disabled: "Disabled",
    disabledOn: "Disabled and on",
    readOnly: "Read-only",
    required: "Required",
    description: "With a description",
    invalid: "Invalid, with a message",
  },
  labels: {
    off: "Airplane mode",
    on: "Wi-Fi",
    disabled: "Bluetooth",
    disabledOn: "Location services",
    readOnly: "Cloud backup",
    required: "Allow the app to run in the background",
    description: "Notifications",
    invalid: "Share my profile",
  },
  descriptionText: "Get an alert when an order ships.",
  errorText: "Turn this on to continue.",
  unnamed: "Without a visible label",
  unnamedNote: "A switch with no label takes an accessible name instead, as an icon toggle does.",
  unnamedName: "Mute all sounds",
  live: "Try it",
  liveNote: "Three settings; the readout lists the ones that are on.",
  settings: "Settings",
  summary: (names: string) => `On: ${names}`,
  none: "nothing",
} as const;

/** The settings of the live example. */
const SETTINGS = [
  { key: "sync", label: "Sync over mobile data" },
  { key: "dark", label: "Dark theme" },
  { key: "beta", label: "Beta features" },
] as const;

/** The list that lays samples out in a responsive grid. */
const GRID = "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3";

/** A caption and the sample it describes, as one list item. */
function Sample({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <li className="grid content-start gap-2">
      <Text tone="muted" type="small">
        {caption}
      </Text>
      {children}
    </li>
  );
}

/** The Switch page. */
export function Switch() {
  const [allowed, setAllowed] = useState(false);
  const [on, setOn] = useState<readonly string[]>(["dark"]);
  const names = SETTINGS.filter(({ key }) => on.includes(key))
    .map(({ label }) => label)
    .join(", ");

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{SwitchRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="switch-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <ul className={GRID}>
          <Sample caption={STRINGS.captions.off}>
            <UiSwitch label={STRINGS.labels.off} />
          </Sample>
          <Sample caption={STRINGS.captions.on}>
            <UiSwitch label={STRINGS.labels.on} defaultValue />
          </Sample>
          <Sample caption={STRINGS.captions.disabled}>
            <UiSwitch label={STRINGS.labels.disabled} isDisabled />
          </Sample>
          <Sample caption={STRINGS.captions.disabledOn}>
            <UiSwitch label={STRINGS.labels.disabledOn} isDisabled defaultValue />
          </Sample>
          <Sample caption={STRINGS.captions.readOnly}>
            <UiSwitch label={STRINGS.labels.readOnly} isReadOnly defaultValue />
          </Sample>
          <Sample caption={STRINGS.captions.required}>
            <UiSwitch label={STRINGS.labels.required} isRequired />
          </Sample>
          <Sample caption={STRINGS.captions.description}>
            <UiSwitch label={STRINGS.labels.description} description={STRINGS.descriptionText} />
          </Sample>
          <Sample caption={STRINGS.captions.invalid}>
            <UiSwitch
              label={STRINGS.labels.invalid}
              isInvalid={!allowed}
              errorMessage={STRINGS.errorText}
              value={allowed}
              onChange={setAllowed}
            />
          </Sample>
        </ul>
      </PageSection>

      <PageSection id="switch-unnamed" title={STRINGS.unnamed} note={STRINGS.unnamedNote}>
        <UiSwitch aria-label={STRINGS.unnamedName} />
      </PageSection>

      <PageSection id="switch-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className="grid gap-3">
          <ul aria-label={STRINGS.settings} className="grid max-w-sm gap-3">
            {SETTINGS.map(({ key, label }) => (
              <li key={key}>
                <UiSwitch
                  label={label}
                  value={on.includes(key)}
                  onChange={(isOn) =>
                    setOn((current) =>
                      isOn ? [...current, key] : current.filter((item) => item !== key),
                    )
                  }
                />
              </li>
            ))}
          </ul>
          <Text role="status">{STRINGS.summary(names || STRINGS.none)}</Text>
        </div>
      </PageSection>
    </article>
  );
}
