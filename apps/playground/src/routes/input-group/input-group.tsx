/**
 * Stackra file contract:
 * Purpose: the page of the input-group route: both variants, a text prefix, a text suffix and both, an element
 *          affix (an icon, a reveal button), every state (required, invalid, disabled, read-only), full width and content
 *          width, and a live slug field whose preview follows what is typed, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The search icon is drawn by name
 *           through `Icon`, from the registry in `components/playground-icons`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decisions 7 and 10); ADR 0060 (light, dark, RTL).
 */
import {
  Button,
  Heading,
  Icon,
  InputGroup as UiInputGroup,
  Surface,
  Text,
} from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { InputGroupRoute } from "#src/routes/input-group/input-group.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::input-group.*` keys.
const STRINGS = {
  documentTitle: `${InputGroupRoute.title} · Stackra Playground`,
  intro:
    "An input group is a text field whose input carries a prefix and a suffix inside one border: a slash before a slug, a unit or currency after a number, an icon, a button. The prefix sits at the start and the suffix at the end, in both directions.",
  variants: "Variants",
  variantsNote:
    "Primary sits on the page; secondary is for a surface that is already tinted, so it is shown on one.",
  primary: "Primary group",
  secondary: "Secondary group",
  affixes: "Prefix and suffix",
  affixesNote: "Text affixes are read with the field; a press on one focuses the input.",
  prefixOnly: "Prefix only",
  suffixOnly: "Suffix only",
  both: "Prefix and suffix",
  amount: "Amount",
  weight: "Weight",
  elements: "Element affixes",
  elementsNote: "An icon before the value, and a button after it that reveals a password.",
  searchLabel: "Search the catalogue",
  passwordLabel: "Password",
  show: "Show password",
  hide: "Hide password",
  showShort: "Show",
  hideShort: "Hide",
  states: "States",
  statesNote:
    "Required adds the asterisk, invalid shows the error, disabled and read-only keep the value.",
  required: "Required group",
  invalid: "Invalid group",
  invalidMessage: "Enter a weight in kilograms.",
  disabled: "Disabled group",
  readOnly: "Read-only group",
  width: "Width",
  widthNote:
    "Full width fills its parent, which is the default; turn it off to size to the content.",
  full: "Full width group",
  content: "Content width group",
  live: "Try it",
  liveNote: "A page address: the preview follows the slug as it is typed.",
  liveLabel: "Page address",
  liveDescription: "Lower case letters, digits and hyphens.",
  livePreview: (slug: string) => `https://figentra.com/${slug}`,
} as const;

/** The grid that lays fields out in columns that wrap. */
const GRID = "grid gap-4 sm:grid-cols-2";

/** The InputGroup page. */
export function InputGroup() {
  const [slug, setSlug] = useState("summer-sale");
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{InputGroupRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="input-group-variants" title={STRINGS.variants} note={STRINGS.variantsNote}>
        <div className={GRID}>
          <UiInputGroup label={STRINGS.primary} variant="primary" prefix="$" defaultValue="12" />
          <Surface variant="secondary" className="rounded-lg p-4">
            <UiInputGroup
              label={STRINGS.secondary}
              variant="secondary"
              prefix="$"
              defaultValue="12"
            />
          </Surface>
        </div>
      </PageSection>

      <PageSection id="input-group-affixes" title={STRINGS.affixes} note={STRINGS.affixesNote}>
        <div className={GRID}>
          <UiInputGroup label={STRINGS.prefixOnly} prefix="https://" />
          <UiInputGroup label={STRINGS.suffixOnly} suffix="kg" />
          <UiInputGroup label={STRINGS.both} prefix="$" suffix="USD" />
          <UiInputGroup
            label={STRINGS.amount}
            prefix="$"
            suffix=".00"
            description={STRINGS.weight}
          />
        </div>
      </PageSection>

      <PageSection id="input-group-elements" title={STRINGS.elements} note={STRINGS.elementsNote}>
        <div className={GRID}>
          <UiInputGroup label={STRINGS.searchLabel} type="text" prefix={<Icon name="search" />} />
          <UiInputGroup
            label={STRINGS.passwordLabel}
            type={isRevealed ? "text" : "password"}
            suffix={
              // The visible word is part of the accessible name, as WCAG 2.5.3 asks.
              <Button
                variant="ghost"
                size="sm"
                label={isRevealed ? STRINGS.hide : STRINGS.show}
                onPress={() => setIsRevealed((revealed) => !revealed)}
              >
                {isRevealed ? STRINGS.hideShort : STRINGS.showShort}
              </Button>
            }
          />
        </div>
      </PageSection>

      <PageSection id="input-group-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <div className={GRID}>
          <UiInputGroup label={STRINGS.required} isRequired suffix="kg" />
          <UiInputGroup
            label={STRINGS.invalid}
            isInvalid
            suffix="kg"
            errorMessage={STRINGS.invalidMessage}
          />
          <UiInputGroup label={STRINGS.disabled} isDisabled suffix="kg" defaultValue="70" />
          <UiInputGroup label={STRINGS.readOnly} isReadOnly suffix="kg" defaultValue="70" />
        </div>
      </PageSection>

      <PageSection id="input-group-width" title={STRINGS.width} note={STRINGS.widthNote}>
        <div className="grid gap-4">
          <UiInputGroup label={STRINGS.full} prefix="$" />
          <UiInputGroup label={STRINGS.content} prefix="$" isFullWidth={false} />
        </div>
      </PageSection>

      <PageSection id="input-group-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <UiInputGroup
          label={STRINGS.liveLabel}
          description={STRINGS.liveDescription}
          prefix="/"
          value={slug}
          onChange={setSlug}
        />
        <Text data-testid="preview" aria-live="polite">
          <bdi>{STRINGS.livePreview(slug)}</bdi>
        </Text>
      </PageSection>
    </article>
  );
}
