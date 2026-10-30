/**
 * Stackra file contract:
 * Purpose: the Theme Studio's "Mobile app" template: a wallet app's home screen, phone wide whatever the device: a
 *          greeting with an avatar and a notification button, a balance card, quick actions, recent activity and a
 *          tab bar.
 * Boundary: a canvas template with no props; the theme is the canvas's. Fixed sample data.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio).
 */
import type { IconName } from "@stackra/icons/contracts";
import {
  Avatar,
  Badge,
  Button,
  Heading,
  Icon,
  IconButton,
  Surface,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { THEME_STUDIO_KEYS } from "#src/routes/theme-studio/theme-studio-keys.constant";

import { STUDIO_DISPLAY } from "./studio-display.constant";

/** The template's keys. */
const K = THEME_STUDIO_KEYS.theme_studio.mobile;

const ACTIONS = [
  { id: "send", icon: Icons.SendHorizontal },
  { id: "request", icon: Icons.Download },
  { id: "top_up", icon: Icons.Plus },
] as const satisfies readonly { id: string; icon: IconName }[];

const ACTIVITY = [
  { id: "groceries", icon: Icons.ShoppingCart, time: "today", amount: "-182.40" },
  { id: "salary", icon: Icons.Wallet, time: "yesterday", amount: "+9,500.00" },
  { id: "coffee", icon: Icons.Heart, time: "monday", amount: "-18.00" },
] as const satisfies readonly { id: string; icon: IconName; time: string; amount: string }[];

const TABS = [
  { id: "home", icon: Icons.House },
  { id: "cards", icon: Icons.CreditCard },
  { id: "activity", icon: Icons.ChartColumn },
  { id: "profile", icon: Icons.Settings },
] as const satisfies readonly { id: string; icon: IconName }[];

/** The mobile app template. */
export function StudioMobileScreen() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="mx-auto grid w-full max-w-[390px] gap-5">
      <header className="flex items-center gap-3">
        <Avatar name={t(K.name)} />
        <div className="grid min-w-0 flex-1">
          <Text tone="muted" type="small">
            {t(K.greeting)}
          </Text>
          <Heading level={2} className={`[font:var(--h4)] ${STUDIO_DISPLAY}`}>
            {t(K.name)}
          </Heading>
        </div>
        <Badge.Anchor>
          <IconButton icon={Icons.Bell} label={t(K.notifications)} variant="secondary" />
          <Badge tone="danger" size="sm" label={t(K.notifications)}>
            {3}
          </Badge>
        </Badge.Anchor>
      </header>
      <section
        className="grid gap-1 bg-accent p-5 text-accent-foreground"
        style={{ borderRadius: "calc(var(--radius)*4)" }}
      >
        <span className="text-sm opacity-80">{t(K.balance)}</span>
        <span className={`text-3xl font-semibold ${STUDIO_DISPLAY}`}>
          <bdi dir="ltr">{t(K.balance_value)}</bdi>{" "}
          <span className="text-base">{t(K.currency)}</span>
        </span>
      </section>
      <div className="grid grid-cols-3 gap-2">
        {ACTIONS.map(({ id, icon }) => (
          <Button
            key={id}
            variant="secondary"
            startIcon={icon}
            isFullWidth
            className="h-auto flex-col py-3"
          >
            {t(K[id])}
          </Button>
        ))}
      </div>
      <Surface
        variant="secondary"
        className="grid gap-1 p-3"
        style={{ borderRadius: "calc(var(--radius)*3)" }}
      >
        <Heading level={3} className={`px-1 pb-1 [font:var(--h5)] ${STUDIO_DISPLAY}`}>
          {t(K.activity)}
        </Heading>
        <ul className="grid gap-1">
          {ACTIVITY.map(({ id, icon, time, amount }) => (
            <li
              key={id}
              className="flex items-center gap-3 bg-surface p-3"
              style={{ borderRadius: "calc(var(--radius)*2)" }}
            >
              <span
                className="grid size-9 place-items-center bg-accent-soft text-accent-soft-foreground"
                style={{ borderRadius: "var(--radius-full)" }}
              >
                <Icon name={icon} size="sm" />
              </span>
              <span className="grid min-w-0 flex-1">
                <span className="truncate text-sm font-medium">{t(K.items[id])}</span>
                <span className="text-xs text-muted">{t(K.times[time])}</span>
              </span>
              <span
                dir="ltr"
                className={`text-sm font-semibold ${amount.startsWith("+") ? "text-success" : ""}`}
              >
                {amount}
              </span>
            </li>
          ))}
        </ul>
      </Surface>
      <nav
        aria-label={t(K.tabs_label)}
        className="grid grid-cols-4 border border-separator bg-surface p-1"
        style={{ borderRadius: "calc(var(--radius)*4)" }}
      >
        {TABS.map(({ id, icon }, index) => (
          // oxlint-disable-next-line jsx-a11y/anchor-is-valid -- reason: a mock tab bar inside a template picture; its links go nowhere by design
          <a
            key={id}
            href="#"
            aria-current={index === 0 ? "page" : undefined}
            className="grid justify-items-center gap-1 py-2 text-xs text-muted aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent-soft-foreground"
            style={{ borderRadius: "calc(var(--radius)*3)" }}
          >
            <Icon name={icon} size="sm" />
            {t(K.tabs[id])}
          </a>
        ))}
      </nav>
    </div>
  );
}
