/**
 * Stackra file contract:
 * Purpose: unit tests of `registerNotificationMails`: each body is recorded against its notification class, each
 *          namespace's loaders are recorded, and a body that is not a component is refused.
 * Boundary: test only; reads `NOTIFICATION_MAILS` directly.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0223 (bodies bound by name).
 */
import { describe, expect, it } from "@stackra/testing";

import { Notification } from "#core/bases/notification.base";
import { NotificationCategory } from "#core/enums/notification-category.enum";
import type { Recipient } from "#core/values/recipient.value";
import { NOTIFICATION_MAILS } from "#node/constants/notification-mails.constant";
import { registerNotificationMails } from "#node/functions/register-notification-mails.function";
import type { MailBody } from "#react/mail/mail-body.type";

class WelcomeNotification extends Notification({ category: NotificationCategory.Activity }) {
  recipients(): Recipient[] {
    return [];
  }
}

/** The welcome body as gen compiles it. */
function WelcomeMail(): null {
  return null;
}

/** A catalogue loader of the `accounts` namespace. */
const load = async () => ({ default: { welcome: { mail: { subject: "Welcome" } } } });

describe("registerNotificationMails", () => {
  it("records each body and each namespace's loaders", () => {
    registerNotificationMails({
      bodies: [[WelcomeNotification, WelcomeMail]],
      catalogues: { accounts: { en: load } },
    });
    expect(NOTIFICATION_MAILS.bodies.get(WelcomeNotification)).toBe(WelcomeMail);
    expect(NOTIFICATION_MAILS.catalogues.get("accounts")).toEqual({ en: load });
  });

  it("refuses a body that is not a component", () => {
    expect(() =>
      registerNotificationMails({
        bodies: [[WelcomeNotification, "welcome.mail.tsx" as unknown as MailBody<object>]],
        catalogues: {},
      }),
    ).toThrow(/WelcomeNotification is not a component/);
  });
});
