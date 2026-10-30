/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web App header: A right-to-left bar: the start slot is at the right, the user
 *          menu at the left, and the whole row mirrors with no side written in the component.
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
  useCatalogueText,
} from "@stackra/ui/react";
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

/** App header: Arabic. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div dir="rtl" lang="ar" data-sample="arabic" className={BOX}>
      <UiAppHeader
        startContent={
          <IconButton icon="menu" label={t(K.arabic_open_navigation)} variant="ghost" />
        }
        title={t(K.arabic_brand)}
        search={
          <SearchField
            aria-label={t(K.arabic_search_label)}
            placeholder={t(K.arabic_search_label)}
            isFullWidth
          />
        }
        endContent={<IconButton icon="bell" label={t(K.arabic_notifications)} variant="ghost" />}
        userMenu={
          <UserMenu
            label={t(K.arabic_account_label)}
            sections={accountSections(t, t(K.arabic_profile), null, t(K.arabic_sign_out))}
          />
        }
      />
    </div>
  );
}
