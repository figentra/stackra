/**
 * Stackra file contract:
 * Purpose: the page of the app-header route: the bar with every part, each part alone (title only, a logo as the
 *          title, search and user menu without actions, a long title that shortens), an Arabic bar in a right-to-left
 *          block, and a live bar whose search field, notification button and user menu report what they did, all from
 *          `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n, text in another language carries
 *           its own `lang`. Each bar sits in a box, inside this page's `main`, so none is a banner landmark (a `header`
 *           in `main` is not one) and none takes a `label`. The page adds the icons it draws beyond the playground
 *           registry through a registry of its own.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0314; ADR 0060 (right-to-left); WCAG 2.2
 *          SC 1.3.1, 2.5.8 and 4.1.3.
 */
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/react";
import { Ellipsis, Menu } from "@stackra/icons/react/lucide-icons";
import type { MenuSection } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { AppHeaderRoute } from "#src/routes/app-header/app-header.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::app-header.*` keys.
const STRINGS = {
  documentTitle: `${AppHeaderRoute.title} · Stackra Playground`,
  intro:
    "The app header is the console's top bar: a slot for the button that opens the sidebar, the app's name or logo, a search slot that takes the room left over, the bar's actions and the user's menu. Every part is a node you fill, so the bar imports no other piece of the shell. Its title is not a heading, because the page's one h1 is the page header's.",
  parts: "Parts",
  partsNote:
    "From the start to the end of the bar: start slot, title, search, end slot, user menu. The search slot is the flexible gap, so the end parts stay at the end with or without a search.",
  all: "Every part",
  titleOnly: "Title only",
  logo: "A logo as the title",
  noActions: "Search and user menu",
  long: "A long title shortens",
  longTitle: "Acme Wholesale Distribution and Fulfilment Services International",
  arabic: "Arabic",
  arabicNote:
    "A right-to-left bar: the start slot is at the right, the user menu at the left, and the whole row mirrors with no side written in the component.",
  live: "Try it",
  liveNote:
    "Type in the search field, press the bell to receive a notification, and choose an entry in the account menu. The page reports each one below the bar.",
  brand: "Acme",
  openNavigation: "Open navigation",
  searchLabel: "Search orders",
  searchPlaceholder: "Search orders",
  notifications: (unread: number) => `Notifications, ${unread} unread`,
  accountLabel: "Account menu",
  profile: "Profile",
  settings: "Settings",
  signOut: "Sign out",
  user: "Ada Lovelace",
  searchStatus: (query: string) =>
    query.trim() === "" ? "No search yet." : `Searching for “${query.trim()}”.`,
  unreadStatus: (unread: number) =>
    unread === 1 ? "1 unread notification." : `${unread} unread notifications.`,
  actionStatus: (action: string | null) =>
    action === null ? "No account action chosen." : `Account action chosen: ${action}.`,
  arabicBrand: "أكمي",
  arabicOpenNavigation: "فتح التنقل",
  arabicSearchLabel: "البحث في الطلبات",
  arabicNotifications: "الإشعارات",
  arabicAccountLabel: "قائمة الحساب",
  arabicProfile: "الملف الشخصي",
  arabicSignOut: "تسجيل الخروج",
  arabicUser: "منى السالم",
} as const;

/** The icons this page draws beyond the playground registry. */
const PAGE_ICONS = defineIconRegistry({ ellipsis: Ellipsis, menu: Menu });

/** The box a bar sits in, as the shell would hold it. */
const BOX = "overflow-hidden rounded-xl border border-border";

/** The grid that lays the samples out in one column of cards. */
const GRID = "grid gap-4";

/** A caption and the sample it describes, as one list item. */
function Sample({
  caption,
  className,
  children,
}: {
  readonly caption: string;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <li className="grid content-start gap-2">
      <Ui.Text tone="muted" type="small">
        {caption}
      </Ui.Text>
      <div className={[BOX, className].filter(Boolean).join(" ")}>{children}</div>
    </li>
  );
}

/** The sections of an account menu, in the text the caller gives. */
const accountSections = (
  profile: string,
  settings: string | null,
  signOut: string,
): MenuSection[] => [
  {
    id: "account",
    title: "Account",
    isTitleHidden: true,
    items: [
      { id: "profile", label: profile },
      ...(settings === null ? [] : [{ id: "settings", label: settings }]),
    ],
  },
  {
    id: "session",
    title: "Session",
    isTitleHidden: true,
    items: [{ id: "sign-out", label: signOut, tone: "danger" }],
  },
];

/** An avatar button that opens the account menu. */
function UserMenu({
  label,
  user,
  sections,
  onAction,
}: {
  readonly label: string;
  readonly user: string;
  readonly sections: readonly MenuSection[];
  readonly onAction?: (id: string) => void;
}) {
  return (
    <Ui.Menu sections={sections} {...(onAction ? { onAction } : {})}>
      <Ui.Button variant="ghost" label={label}>
        <Ui.Avatar name={user} size="sm" />
      </Ui.Button>
    </Ui.Menu>
  );
}

/** The AppHeader page. */
export function AppHeader() {
  const [query, setQuery] = useState("");
  const [unread, setUnread] = useState(2);
  const [action, setAction] = useState<string | null>(null);
  const account = accountSections(STRINGS.profile, STRINGS.settings, STRINGS.signOut);

  return (
    <IconRegistryProvider registry={PAGE_ICONS}>
      <article className="grid gap-10">
        <title>{STRINGS.documentTitle}</title>
        <header className="grid gap-2">
          <Ui.Heading level={1}>{AppHeaderRoute.title}</Ui.Heading>
          <Ui.Text className="max-w-prose">
            <bdi>{STRINGS.intro}</bdi>
          </Ui.Text>
        </header>

        <PageSection id="app-header-parts" title={STRINGS.parts} note={STRINGS.partsNote}>
          <ul className={GRID}>
            <Sample caption={STRINGS.all}>
              <Ui.AppHeader
                startContent={
                  <Ui.IconButton icon="menu" label={STRINGS.openNavigation} variant="ghost" />
                }
                title={STRINGS.brand}
                search={
                  <Ui.SearchField
                    aria-label={STRINGS.searchLabel}
                    placeholder={STRINGS.searchPlaceholder}
                    isFullWidth
                  />
                }
                endContent={
                  <Ui.IconButton icon="bell" label={STRINGS.notifications(2)} variant="ghost" />
                }
                userMenu={
                  <UserMenu label={STRINGS.accountLabel} user={STRINGS.user} sections={account} />
                }
              />
            </Sample>
            <Sample caption={STRINGS.titleOnly}>
              <Ui.AppHeader title={STRINGS.brand} />
            </Sample>
            <Sample caption={STRINGS.logo}>
              <Ui.AppHeader
                title={
                  <span className="flex items-center gap-2 font-semibold">
                    <Ui.Icon name="building" />
                    {STRINGS.brand}
                  </span>
                }
              />
            </Sample>
            <Sample caption={STRINGS.noActions}>
              <Ui.AppHeader
                title={STRINGS.brand}
                search={
                  <Ui.SearchField
                    aria-label={STRINGS.searchLabel}
                    placeholder={STRINGS.searchPlaceholder}
                    isFullWidth
                  />
                }
                userMenu={
                  <UserMenu label={STRINGS.accountLabel} user={STRINGS.user} sections={account} />
                }
              />
            </Sample>
            <Sample caption={STRINGS.long} className="max-w-sm">
              <Ui.AppHeader
                title={STRINGS.longTitle}
                userMenu={
                  <UserMenu label={STRINGS.accountLabel} user={STRINGS.user} sections={account} />
                }
              />
            </Sample>
          </ul>
        </PageSection>

        <PageSection id="app-header-arabic" title={STRINGS.arabic} note={STRINGS.arabicNote}>
          <div dir="rtl" lang="ar" data-sample="arabic" className={BOX}>
            <Ui.AppHeader
              startContent={
                <Ui.IconButton icon="menu" label={STRINGS.arabicOpenNavigation} variant="ghost" />
              }
              title={STRINGS.arabicBrand}
              search={
                <Ui.SearchField
                  aria-label={STRINGS.arabicSearchLabel}
                  placeholder={STRINGS.arabicSearchLabel}
                  isFullWidth
                />
              }
              endContent={
                <Ui.IconButton icon="bell" label={STRINGS.arabicNotifications} variant="ghost" />
              }
              userMenu={
                <UserMenu
                  label={STRINGS.arabicAccountLabel}
                  user={STRINGS.arabicUser}
                  sections={accountSections(STRINGS.arabicProfile, null, STRINGS.arabicSignOut)}
                />
              }
            />
          </div>
        </PageSection>

        <PageSection id="app-header-live" title={STRINGS.live} note={STRINGS.liveNote}>
          <div className="grid gap-3">
            <div className={BOX} data-sample="live">
              <Ui.AppHeader
                title={STRINGS.brand}
                search={
                  <Ui.SearchField
                    aria-label={STRINGS.searchLabel}
                    placeholder={STRINGS.searchPlaceholder}
                    value={query}
                    onChange={setQuery}
                    isFullWidth
                  />
                }
                endContent={
                  <Ui.IconButton
                    icon="bell"
                    label={STRINGS.notifications(unread)}
                    variant="ghost"
                    onPress={() => setUnread((count) => count + 1)}
                  />
                }
                userMenu={
                  <UserMenu
                    label={STRINGS.accountLabel}
                    user={STRINGS.user}
                    sections={account}
                    onAction={(id) =>
                      setAction(
                        account.flatMap((section) => section.items).find((item) => item.id === id)
                          ?.label ?? id,
                      )
                    }
                  />
                }
              />
            </div>
            <div className="grid gap-1" data-sample="live-status">
              <Ui.Text role="status" tone="muted">
                {STRINGS.searchStatus(query)}
              </Ui.Text>
              <Ui.Text role="status" tone="muted">
                {STRINGS.unreadStatus(unread)}
              </Ui.Text>
              <Ui.Text role="status" tone="muted">
                {STRINGS.actionStatus(action)}
              </Ui.Text>
            </div>
          </div>
        </PageSection>
      </article>
    </IconRegistryProvider>
  );
}
