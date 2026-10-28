/**
 * Stackra file contract:
 * Purpose: the page of the badge route: every variant, tone and size, the four logical corners, dots, text, numbers
 *          and icons, and a badge on a pressable control whose presses pass through, all from `@stackra/ui/react`
 *          with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The anchors are decorative
 *          plain discs, a stand-in for `Avatar` (STA-361): swap `Disc` for it when a sample needs a real avatar.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Enum, Tone } from "@stackra/contracts";
import { BadgePlacement, BadgeVariant, Size } from "@stackra/ui/contracts";
import { Badge as UiBadge, Heading, Icon, IconButton, Text } from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { BadgeRoute } from "#src/routes/badge/badge.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::badge.*` keys.
const STRINGS = {
  new: "New",
  documentTitle: `${BadgeRoute.title} · Stackra Playground`,
  intro:
    "A Badge is a count or dot pinned to a corner of another element. Corners are named by reading direction, so top-end is top right in English and top left in Arabic. A badge is hidden from assistive technology unless it has a label, and it never takes a press.",
  variants: "Variants and tones",
  variantsNote: "A row per variant, an anchor per tone, each badge labelled for a screen reader.",
  variantLabel: (tone: string, variant: string) => `${tone} ${variant}: 5 new`,
  sizes: "Sizes",
  sizesNote: "Small, medium and large, with a one-digit count and a capped one.",
  sizeLabel: (size: string, count: string) => `${size}: ${count} new`,
  corners: "Corners",
  cornersNote: "The four logical corners, each with a labelled dot.",
  cornerLabel: (placement: string) => `Dot at ${placement}`,
  dots: "Dots",
  dotsNote: "Presence dots at the bottom end, small.",
  online: "Online",
  away: "Away",
  busy: "Busy",
  content: "Content",
  contentNote: "A number, a word and an icon.",
  number: "8 new",
  word: "New item",
  iconLabel: "Alerts",
  control: "On a control",
  controlNote:
    "The badge is not labelled: the button's own name already says the count, and a press on the badge reaches the button.",
  controlLabel: (count: number) => `Notifications, ${count} unread`,
  presses: (count: number) => `Pressed ${count} ${count === 1 ? "time" : "times"}.`,
} as const;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-6";

/** The count the control sample starts at, which its label names. */
const INITIAL_COUNT = 3;

/**
 * A plain disc standing in for an avatar: a neutral fill the dots are measured against. It holds no text, because a
 * badge overlaps the disc's corner and a text there would have an undeterminable background to a contrast check.
 */
function Disc() {
  return <span aria-hidden="true" className="inline-flex size-10 rounded-full bg-default" />;
}

/** The Badge page. */
export function Badge() {
  const [count, setCount] = useState(INITIAL_COUNT);
  const [presses, setPresses] = useState(0);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{BadgeRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="badge-variants" title={STRINGS.variants} note={STRINGS.variantsNote}>
        {BadgeVariant.map((variant) => (
          <div key={variant} className="grid gap-2">
            <Heading level={3}>{variant}</Heading>
            <ul className={ROW}>
              {Enum.values(Tone).map((tone) => (
                <li key={tone}>
                  <UiBadge.Anchor>
                    <Disc />
                    <UiBadge
                      tone={tone}
                      variant={variant}
                      label={STRINGS.variantLabel(tone, variant)}
                    >
                      {5}
                    </UiBadge>
                  </UiBadge.Anchor>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </PageSection>

      <PageSection id="badge-sizes" title={STRINGS.sizes} note={STRINGS.sizesNote}>
        <ul className={ROW}>
          {Size.flatMap((size) =>
            ["5", "99+"].map((text) => (
              <li key={`${size}-${text}`}>
                <UiBadge.Anchor>
                  <Disc />
                  <UiBadge tone="danger" size={size} label={STRINGS.sizeLabel(size, text)}>
                    {text}
                  </UiBadge>
                </UiBadge.Anchor>
              </li>
            )),
          )}
        </ul>
      </PageSection>

      <PageSection id="badge-corners" title={STRINGS.corners} note={STRINGS.cornersNote}>
        <ul className={ROW}>
          {BadgePlacement.map((placement) => (
            <li key={placement} className="grid justify-items-center gap-2">
              <UiBadge.Anchor>
                <Disc />
                <UiBadge
                  tone="accent"
                  size="sm"
                  placement={placement}
                  label={STRINGS.cornerLabel(placement)}
                />
              </UiBadge.Anchor>
              <Text type="caption" tone="muted">
                <bdi>{placement}</bdi>
              </Text>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="badge-dots" title={STRINGS.dots} note={STRINGS.dotsNote}>
        <ul className={ROW}>
          {(
            [
              ["success", STRINGS.online],
              ["warning", STRINGS.away],
              ["danger", STRINGS.busy],
            ] as const
          ).map(([tone, label]) => (
            <li key={tone}>
              <UiBadge.Anchor>
                <Disc />
                <UiBadge tone={tone} size="sm" placement="bottom-end" label={label} />
              </UiBadge.Anchor>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="badge-content" title={STRINGS.content} note={STRINGS.contentNote}>
        <ul className={ROW}>
          <li>
            <UiBadge.Anchor>
              <Disc />
              <UiBadge tone="accent" label={STRINGS.number}>
                {8}
              </UiBadge>
            </UiBadge.Anchor>
          </li>
          <li>
            <UiBadge.Anchor>
              <Disc />
              <UiBadge tone="success" variant="soft" label={STRINGS.word}>
                {STRINGS.new}
              </UiBadge>
            </UiBadge.Anchor>
          </li>
          <li>
            <UiBadge.Anchor>
              <Disc />
              <UiBadge tone="danger" size="lg" label={STRINGS.iconLabel}>
                <Icon name="bell" className="size-3" />
              </UiBadge>
            </UiBadge.Anchor>
          </li>
        </ul>
      </PageSection>

      <PageSection id="badge-control" title={STRINGS.control} note={STRINGS.controlNote}>
        <div className={ROW}>
          <UiBadge.Anchor>
            <IconButton
              variant="secondary"
              label={STRINGS.controlLabel(count)}
              icon={<Icon name="bell" />}
              onPress={() => {
                setCount((value) => value + 1);
                setPresses((value) => value + 1);
              }}
            />
            <UiBadge tone="danger" size="sm">
              {count}
            </UiBadge>
          </UiBadge.Anchor>
          <output aria-live="polite" data-testid="press-count">
            <bdi>{STRINGS.presses(presses)}</bdi>
          </output>
        </div>
      </PageSection>
    </article>
  );
}
