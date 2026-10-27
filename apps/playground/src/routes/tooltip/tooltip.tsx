/**
 * Stackra file contract:
 * Purpose: the page of the tooltip route: the four sides, the three alignments, the arrow, tooltips on icon buttons,
 *          the delay (the default, none, and a tooltip that is switched off) and a live example whose open state is
 *          driven from outside and reported, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The samples sit in centred rows so
 *           a tooltip has room on every side and is never flipped or shifted by the viewport edge. Icons are drawn by
 *           name through `IconButton`, from the registry in `components/playground-icons` (ADR 0303 decision 10).
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL);
 *          WCAG 2.2 SC 1.4.13 and 2.5.8.
 */
import { Button, Heading, IconButton, Switch, Text, Tooltip as UiTooltip } from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { TooltipRoute } from "#src/routes/tooltip/tooltip.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::tooltip.*` keys.
const STRINGS = {
  documentTitle: `${TooltipRoute.title} · Stackra Playground`,
  intro:
    "A tooltip is a short label that appears on hover and on keyboard focus, and goes on Escape. It describes an element; it never names it, so the element keeps its own accessible name. Anything longer, or anything to press, belongs in a popover. A side is by reading direction, so Start is on the left in English and on the right in Arabic.",
  placement: "Placement",
  placementNote:
    "The four sides. When there is no room on the chosen side the tooltip flips to the opposite one.",
  top: "Top",
  bottom: "Bottom",
  start: "Start",
  end: "End",
  sideText: (side: string) => `Opens on the ${side.toLowerCase()} side`,
  alignment: "Alignment",
  alignmentNote:
    "Along the edge the tooltip leaves open: Start lines up with the reading start of the element, End with its reading end.",
  alignStart: "Align start",
  alignCenter: "Align centre",
  alignEnd: "Align end",
  alignText: "Lined up with the element",
  arrow: "Arrow",
  arrowNote: "An arrow ties the tooltip to the element it describes. It is off by default.",
  withoutArrow: "No arrow",
  withArrow: "With an arrow",
  arrowText: "Pointing at its element",
  icons: "On icon buttons",
  iconsNote:
    "An icon button is named by its label; the tooltip adds what it does, to sighted users and in the description.",
  settingsLabel: "Settings",
  settingsText: "Change your preferences",
  alertsLabel: "Alerts",
  alertsText: "See what needs your attention",
  downloadLabel: "Download",
  downloadText: "Save the report as a file",
  delay: "Delay and switching off",
  delayNote:
    "A hover waits for the delay; keyboard focus never does. A disabled tooltip stays quiet and leaves the element as it was.",
  defaultDelay: "Default delay",
  defaultDelayText: "Appears after the theme's delay",
  noDelay: "No delay",
  noDelayText: "Appears at once",
  switchedOff: "Switched off",
  switchedOffText: "You will never see this",
  live: "Try it",
  liveNote:
    "A controlled tooltip. It is shown while the switch below is on, whatever the pointer does, and the state is reported.",
  liveTrigger: "Export",
  liveText: "Export the table as CSV",
  liveShow: "Show the tooltip",
  state: (isOpen: boolean) => `State: ${isOpen ? "shown" : "hidden"}`,
} as const;

/** The row that lays samples out in the middle of the page, where a tooltip has room on every side. */
const ROW = "flex flex-wrap items-center justify-center gap-4";

/** The Tooltip page. */
export function Tooltip() {
  const [isLiveOpen, setIsLiveOpen] = useState(false);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{TooltipRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="tooltip-placement" title={STRINGS.placement} note={STRINGS.placementNote}>
        <ul className={ROW}>
          {(
            [
              ["top", STRINGS.top],
              ["bottom", STRINGS.bottom],
              ["start", STRINGS.start],
              ["end", STRINGS.end],
            ] as const
          ).map(([placement, label]) => (
            <li key={placement}>
              <UiTooltip placement={placement} content={STRINGS.sideText(label)}>
                <Button variant="secondary">{label}</Button>
              </UiTooltip>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="tooltip-alignment" title={STRINGS.alignment} note={STRINGS.alignmentNote}>
        <ul className={ROW}>
          {(
            [
              ["start", STRINGS.alignStart],
              ["center", STRINGS.alignCenter],
              ["end", STRINGS.alignEnd],
            ] as const
          ).map(([align, label]) => (
            <li key={align}>
              <UiTooltip placement="bottom" align={align} content={STRINGS.alignText}>
                <Button variant="secondary">{label}</Button>
              </UiTooltip>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="tooltip-arrow" title={STRINGS.arrow} note={STRINGS.arrowNote}>
        <ul className={ROW}>
          <li>
            <UiTooltip content={STRINGS.arrowText}>
              <Button variant="secondary">{STRINGS.withoutArrow}</Button>
            </UiTooltip>
          </li>
          <li>
            <UiTooltip hasArrow content={STRINGS.arrowText}>
              <Button variant="secondary">{STRINGS.withArrow}</Button>
            </UiTooltip>
          </li>
        </ul>
      </PageSection>

      <PageSection id="tooltip-icons" title={STRINGS.icons} note={STRINGS.iconsNote}>
        <ul className={ROW}>
          <li>
            <UiTooltip content={STRINGS.settingsText}>
              <IconButton icon="settings" label={STRINGS.settingsLabel} variant="secondary" />
            </UiTooltip>
          </li>
          <li>
            <UiTooltip content={STRINGS.alertsText}>
              <IconButton icon="bell" label={STRINGS.alertsLabel} variant="secondary" />
            </UiTooltip>
          </li>
          <li>
            <UiTooltip content={STRINGS.downloadText}>
              <IconButton icon="download" label={STRINGS.downloadLabel} variant="secondary" />
            </UiTooltip>
          </li>
        </ul>
      </PageSection>

      <PageSection id="tooltip-delay" title={STRINGS.delay} note={STRINGS.delayNote}>
        <ul className={ROW}>
          <li>
            <UiTooltip content={STRINGS.defaultDelayText}>
              <Button variant="secondary">{STRINGS.defaultDelay}</Button>
            </UiTooltip>
          </li>
          <li>
            <UiTooltip delay={0} content={STRINGS.noDelayText}>
              <Button variant="secondary">{STRINGS.noDelay}</Button>
            </UiTooltip>
          </li>
          <li>
            <UiTooltip isDisabled content={STRINGS.switchedOffText}>
              <Button variant="secondary">{STRINGS.switchedOff}</Button>
            </UiTooltip>
          </li>
        </ul>
      </PageSection>

      <PageSection id="tooltip-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className={ROW}>
          <UiTooltip isOpen={isLiveOpen} onOpenChange={setIsLiveOpen} content={STRINGS.liveText}>
            <Button variant="secondary">{STRINGS.liveTrigger}</Button>
          </UiTooltip>
          <Switch label={STRINGS.liveShow} value={isLiveOpen} onChange={setIsLiveOpen} />
        </div>
        <Text role="status" data-testid="tooltip-state" tone="muted">
          {STRINGS.state(isLiveOpen)}
        </Text>
      </PageSection>
    </article>
  );
}
