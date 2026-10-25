/**
 * Stackra file contract:
 * Purpose: the page of the ItemCard route: `@stackra-pro/ui`'s ItemCard as a setting row (an icon, a title, a
 *          description and a named switch that reports its state) and as a device list whose trailing action is a
 *          status chip or a button.
 * Boundary: presentation and local state only.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as Ui from "@stackra/ui/react";
import * as UiPro from "@stackra-pro/ui/react";
import { useState } from "react";

import { DemoIcon } from "#src/components/demo-icon";
import { ProItemCardRoute } from "#src/routes/pro-item-card/pro-item-card.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-item-card.*` keys.
const STRINGS = {
  documentTitle: `${ProItemCardRoute.title} · Stackra Playground`,
  intro:
    "A row with an icon, a title, a description and a trailing action: a switch, a button or a status.",
  setting: "Setting",
  notifications: "Email notifications",
  notificationsText: "Get a message when someone mentions you",
  notificationsSwitch: "Email notifications",
  on: "Notifications are on.",
  off: "Notifications are off.",
  devices: "Devices",
  laptop: "Work laptop",
  laptopText: "Last active two minutes ago",
  active: "Active",
  tablet: "Tablet",
  tabletText: "Last active three days ago",
  revoke: "Revoke",
  revokeTablet: "Revoke Tablet",
  revoked: "The tablet has been revoked.",
} as const;

/** The ItemCard page. */
export function ProItemCard() {
  const [isOn, setOn] = useState(true);
  const [isRevoked, setRevoked] = useState(false);

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProItemCardRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="setting-heading" className="grid max-w-xl gap-3">
        <h2 id="setting-heading" className="type-h2">
          {STRINGS.setting}
        </h2>
        <UiPro.ItemCard>
          <UiPro.ItemCard.Icon>
            <DemoIcon name="gear" />
          </UiPro.ItemCard.Icon>
          <UiPro.ItemCard.Content>
            <UiPro.ItemCard.Title>{STRINGS.notifications}</UiPro.ItemCard.Title>
            <UiPro.ItemCard.Description>{STRINGS.notificationsText}</UiPro.ItemCard.Description>
          </UiPro.ItemCard.Content>
          <UiPro.ItemCard.Action>
            <Ui.Switch value={isOn} onChange={setOn} aria-label={STRINGS.notificationsSwitch} />
          </UiPro.ItemCard.Action>
        </UiPro.ItemCard>
        <p role="status">
          <bdi>{isOn ? STRINGS.on : STRINGS.off}</bdi>
        </p>
      </section>
      <section aria-labelledby="devices-heading" className="grid max-w-xl gap-3">
        <h2 id="devices-heading" className="type-h2">
          {STRINGS.devices}
        </h2>
        <div className="grid gap-2">
          <UiPro.ItemCard>
            <UiPro.ItemCard.Icon>
              <DemoIcon name="users" />
            </UiPro.ItemCard.Icon>
            <UiPro.ItemCard.Content>
              <UiPro.ItemCard.Title>{STRINGS.laptop}</UiPro.ItemCard.Title>
              <UiPro.ItemCard.Description>{STRINGS.laptopText}</UiPro.ItemCard.Description>
            </UiPro.ItemCard.Content>
            <UiPro.ItemCard.Action>
              <Ui.Chip tone="success" size="sm" variant="soft">
                {STRINGS.active}
              </Ui.Chip>
            </UiPro.ItemCard.Action>
          </UiPro.ItemCard>
          <UiPro.ItemCard>
            <UiPro.ItemCard.Icon>
              <DemoIcon name="doc" />
            </UiPro.ItemCard.Icon>
            <UiPro.ItemCard.Content>
              <UiPro.ItemCard.Title>{STRINGS.tablet}</UiPro.ItemCard.Title>
              <UiPro.ItemCard.Description>{STRINGS.tabletText}</UiPro.ItemCard.Description>
            </UiPro.ItemCard.Content>
            <UiPro.ItemCard.Action>
              {isRevoked ? (
                <span role="status" className="text-sm">
                  <bdi>{STRINGS.revoked}</bdi>
                </span>
              ) : (
                <Ui.Button
                  size="sm"
                  variant="outline"
                  label={STRINGS.revokeTablet}
                  onPress={() => setRevoked(true)}
                >
                  {STRINGS.revoke}
                </Ui.Button>
              )}
            </UiPro.ItemCard.Action>
          </UiPro.ItemCard>
        </div>
      </section>
    </article>
  );
}
