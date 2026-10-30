/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web App header: Type in the search field, press the bell to receive a notification,
 *          and choose an entry in the account menu. The page reports each one below the bar.
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
  IconButton,
  Menu as UiMenu,
  SearchField,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { APP_HEADER_KEYS } from "#src/demos/free/app-header/app-header-keys.constant";

/** The demo's keys. */
const K = APP_HEADER_KEYS.app_header;

/** The box a bar sits in, as the shell would hold it. */
const BOX = "overflow-hidden border border-border";

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

/** App header: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [query, setQuery] = useState("");

  const [unread, setUnread] = useState(2);

  const [action, setAction] = useState<string | null>(null);

  const account = accountSections(t, t(K.profile), t(K.settings), t(K.sign_out));

  return (
    <div className="grid gap-3">
      <div className={BOX} data-sample="live">
        <UiAppHeader
          title={t(K.brand)}
          search={
            <SearchField
              aria-label={t(K.search_label)}
              placeholder={t(K.search_placeholder)}
              value={query}
              onChange={setQuery}
              isFullWidth
            />
          }
          endContent={
            <IconButton
              icon="bell"
              label={t(K.notifications, { unread })}
              variant="ghost"
              onPress={() => setUnread((count) => count + 1)}
            />
          }
          userMenu={
            <UserMenu
              label={t(K.account_label)}
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
        <Text role="status" tone="muted">
          {t(K.search_status, { query: query.trim() || "none" })}
        </Text>
        <Text role="status" tone="muted">
          {t(K.unread_status, { unread })}
        </Text>
        <Text role="status" tone="muted">
          {t(K.action_status, { action: action ?? "none" })}
        </Text>
      </div>
    </div>
  );
}
