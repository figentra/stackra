/**
 * Stackra file contract:
 * Purpose: `AccountMenu`, the identity kit's account menu: a button with the signed-in user's picture and name that
 *          opens the host's groups (profile, security, appearance, language) and a last group, headed by the user's
 *          address, with "Sign out".
 * Boundary: composition of @stackra/ui's `Menu` over `useSession`. Signing out is the container's
 *           `SessionService.signOut`, which ends the session here even when the provider cannot be reached, so
 *           `onSignOut` follows either way. Renders nothing unless a user is signed in.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0206 (decision 8); ADR 0165 (UI through @stackra/ui).
 */
import type { MenuSection } from "@stackra/ui/contracts";
import { Avatar, Button, Menu } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { AccountMenuProps } from "#react/account-menu/account-menu.props";
import { useSession } from "#react/session/use-session";

/** No host groups. */
const NONE: readonly MenuSection[] = [];

/** The sign-out group's key; namespaced so it never meets a host's. */
const SESSION_SECTION = "identity.session";

/**
 * The account menu. Place it at the end of an app bar.
 *
 * @example
 * <AccountMenu sections={sections} onSignOut={() => navigate("/")} labels={labels} />
 */
export function AccountMenu({
  sections = NONE,
  onSignOut,
  labels,
  className,
}: AccountMenuProps): ReactElement | null {
  const session = useSession();
  const { user } = session;
  if (user === null) return null;
  const signOut = () =>
    void session
      .signOut()
      .catch(() => undefined)
      .finally(() => onSignOut?.());
  return (
    <Menu
      align="end"
      sections={[
        ...sections,
        {
          id: SESSION_SECTION,
          title: user.email,
          items: [
            {
              id: `${SESSION_SECTION}.sign_out`,
              label: labels.signOut,
              onPress: signOut,
            },
          ],
        },
      ]}
    >
      <Button
        variant="ghost"
        label={`${labels.trigger}: ${user.displayName}`}
        startIcon={<Avatar name={user.displayName} src={user.avatarUrl} size="sm" />}
        className={`text-start ${className ?? ""}`}
      >
        <span className="max-w-40 truncate" dir="auto">
          {user.displayName}
        </span>
      </Button>
    </Menu>
  );
}
