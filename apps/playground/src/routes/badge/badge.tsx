/**
 * Stackra file contract:
 * Purpose: the page of the badge route: every variant, tone and size, the four logical corners, dots, text, numbers
 *          and icons, and a badge on a pressable control whose presses pass through, all from `@stackra/ui/react`
 *          with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The anchors are decorative
 *          initials discs, a stand-in for `Ui.Avatar` (STA-361), which has not landed: swap `Disc` for it then.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { BadgePlacement, BadgeVariant, Size, Tone } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { Bell } from "lucide-react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { BadgeRoute } from "#src/routes/badge/badge.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::badge.*` keys.
const STRINGS = {
  documentTitle: `${BadgeRoute.title} · Stackra Playground`,
  intro:
    "A Badge is a count or dot pinned to a corner of another element. Corners are named by reading direction, so top-end is top right in English and top left in Arabic. A badge is hidden from assistive technology unless it has a label, and it never takes a press.",
  initials: "AK",
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
  icon: "Alerts",
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

/** A decorative initials disc standing in for an avatar: a neutral fill the dots are measured against. */
function Disc() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-10 items-center justify-center rounded-full bg-default text-sm font-medium text-default-foreground"
    >
      <bdi>{STRINGS.initials}</bdi>
    </span>
  );
}

/** The Badge page. */
export function Badge() {
  const [count, setCount] = useState(INITIAL_COUNT);
  const [presses, setPresses] = useState(0);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{BadgeRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="badge-variants" title={STRINGS.variants} note={STRINGS.variantsNote}>
        {BadgeVariant.map((variant) => (
          <div key={variant} className="grid gap-2">
            <Ui.Heading level={3}>{variant}</Ui.Heading>
            <ul className={ROW}>
              {Tone.map((tone) => (
                <li key={tone}>
                  <Ui.Badge.Anchor>
                    <Disc />
                    <Ui.Badge
                      tone={tone}
                      variant={variant}
                      label={STRINGS.variantLabel(tone, variant)}
                    >
                      5
                    </Ui.Badge>
                  </Ui.Badge.Anchor>
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
                <Ui.Badge.Anchor>
                  <Disc />
                  <Ui.Badge tone="danger" size={size} label={STRINGS.sizeLabel(size, text)}>
                    {text}
                  </Ui.Badge>
                </Ui.Badge.Anchor>
              </li>
            )),
          )}
        </ul>
      </PageSection>

      <PageSection id="badge-corners" title={STRINGS.corners} note={STRINGS.cornersNote}>
        <ul className={ROW}>
          {BadgePlacement.map((placement) => (
            <li key={placement} className="grid justify-items-center gap-2">
              <Ui.Badge.Anchor>
                <Disc />
                <Ui.Badge
                  tone="accent"
                  size="sm"
                  placement={placement}
                  label={STRINGS.cornerLabel(placement)}
                />
              </Ui.Badge.Anchor>
              <Ui.Text type="caption" tone="muted">
                <bdi>{placement}</bdi>
              </Ui.Text>
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
              <Ui.Badge.Anchor>
                <Disc />
                <Ui.Badge tone={tone} size="sm" placement="bottom-end" label={label} />
              </Ui.Badge.Anchor>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="badge-content" title={STRINGS.content} note={STRINGS.contentNote}>
        <ul className={ROW}>
          <li>
            <Ui.Badge.Anchor>
              <Disc />
              <Ui.Badge tone="accent" label={STRINGS.number}>
                {8}
              </Ui.Badge>
            </Ui.Badge.Anchor>
          </li>
          <li>
            <Ui.Badge.Anchor>
              <Disc />
              <Ui.Badge tone="success" variant="soft" label={STRINGS.word}>
                New
              </Ui.Badge>
            </Ui.Badge.Anchor>
          </li>
          <li>
            <Ui.Badge.Anchor>
              <Disc />
              <Ui.Badge tone="danger" size="lg" label={STRINGS.icon}>
                <Bell className="size-3" aria-hidden />
              </Ui.Badge>
            </Ui.Badge.Anchor>
          </li>
        </ul>
      </PageSection>

      <PageSection id="badge-control" title={STRINGS.control} note={STRINGS.controlNote}>
        <div className={ROW}>
          <Ui.Badge.Anchor>
            <Ui.IconButton
              variant="secondary"
              label={STRINGS.controlLabel(count)}
              icon={<Ui.Icon as={Bell} />}
              onPress={() => {
                setCount((value) => value + 1);
                setPresses((value) => value + 1);
              }}
            />
            <Ui.Badge tone="danger" size="sm">
              {count}
            </Ui.Badge>
          </Ui.Badge.Anchor>
          <output aria-live="polite" data-testid="press-count">
            <bdi>{STRINGS.presses(presses)}</bdi>
          </output>
        </div>
      </PageSection>
    </article>
  );
}
