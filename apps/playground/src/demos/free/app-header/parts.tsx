/**
 * Stackra file contract:
 * Purpose: the "parts" demo of the web App header: From the start to the end of the bar: start slot, title, search,
 *          end slot, user menu. The search slot is the flexible gap, so the end parts stay at the end with or without
 *          a search.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317; ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.5.8 and 4.1.3.
 */
import type { MenuSection } from "@stackra/ui/contracts";
import {
  AppHeader as UiAppHeader,
  Avatar,
  Button,
  Icon,
  IconButton,
  Menu as UiMenu,
  SearchField,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
import type { ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { APP_HEADER_KEYS } from "#src/demos/free/app-header/app-header-keys.constant";

/** The demo's keys. */
const K = APP_HEADER_KEYS.app_header;

/** The box a bar sits in, as the shell would hold it. */
const BOX = "overflow-hidden border border-border";

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
      <Text tone="muted" type="small">
        {caption}
      </Text>
      <div className={[BOX, className].filter(Boolean).join(" ")}>{children}</div>
    </li>
  );
}

/** The sections of an account menu, in the text the caller gives. */
const accountSections = (
  t: ReturnType<typeof useCatalogueText>,
  profile: string,
  settings: string | null,
  signOut: string,
): MenuSection[] => [
  {
    id: "account",
    title: t(K.sample.account),
    isTitleHidden: true,
    items: [
      { id: "profile", label: profile },
      ...(settings === null ? [] : [{ id: "settings", label: settings }]),
    ],
  },
  {
    id: "session",
    title: t(K.sample.session),
    isTitleHidden: true,
    items: [{ id: "sign-out", label: signOut, tone: "danger" }],
  },
];

/** An avatar button that opens the account menu. */
function UserMenu({
  label,
  sections,
  onAction,
}: {
  readonly label: string;
  readonly sections: readonly MenuSection[];
  readonly onAction?: (id: string) => void;
}) {
  return (
    <UiMenu sections={sections} {...(onAction ? { onAction } : {})}>
      <Button variant="ghost" label={label}>
        {/* An icon, not initials: initials are visible text that the menu's name does not hold (WCAG 2.5.3). */}
        <Avatar size="sm" />
      </Button>
    </UiMenu>
  );
}

/** App header: Parts. */
export default function Parts() {
  const t = useCatalogueText(MESSAGES.en);
  const account = accountSections(t, t(K.profile), t(K.settings), t(K.sign_out));

  return (
    <ul className={GRID}>
      <Sample caption={t(K.all)}>
        <UiAppHeader
          startContent={<IconButton icon="menu" label={t(K.open_navigation)} variant="ghost" />}
          title={t(K.brand)}
          search={
            <SearchField
              aria-label={t(K.search_label)}
              placeholder={t(K.search_placeholder)}
              isFullWidth
            />
          }
          endContent={
            <IconButton icon="bell" label={t(K.notifications, { unread: 2 })} variant="ghost" />
          }
          userMenu={<UserMenu label={t(K.account_label)} sections={account} />}
        />
      </Sample>
      <Sample caption={t(K.title_only)}>
        <UiAppHeader title={t(K.brand)} />
      </Sample>
      <Sample caption={t(K.logo)}>
        <UiAppHeader
          title={
            <span className="flex items-center gap-2 font-semibold">
              <Icon name="building" />
              {t(K.brand)}
            </span>
          }
        />
      </Sample>
      <Sample caption={t(K.no_actions)}>
        <UiAppHeader
          title={t(K.brand)}
          search={
            <SearchField
              aria-label={t(K.search_label)}
              placeholder={t(K.search_placeholder)}
              isFullWidth
            />
          }
          userMenu={<UserMenu label={t(K.account_label)} sections={account} />}
        />
      </Sample>
      <Sample caption={t(K.long)} className="max-w-sm">
        <UiAppHeader
          title={t(K.long_title)}
          userMenu={<UserMenu label={t(K.account_label)} sections={account} />}
        />
      </Sample>
    </ul>
  );
}
