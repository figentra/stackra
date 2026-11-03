/**
 * Stackra file contract:
 * Purpose: proves the SecurityPage titles itself and its sections one level apart, lists the passkeys, second factors
 *          and device sessions from the `AccountSecurity` port with this device marked, removes a passkey and announces
 *          it, opens the StepUpDialog on a `step_up_required` refusal and retries once verified, changes the password,
 *          ends every other session and reports it, adds a passkey through the `Passkeys` port and the host's calls,
 *          announces a failed load in an alert, and keeps names in their own direction in Arabic.
 * Boundary: unit tier, jsdom, the real @stackra/ui components; the container binds the memory `AccountSecurity` and
 *           `Passkeys` drivers and a `SessionFake`, and the passkey calls go to the memory identity provider.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0260; ADR 0207 (decision 1); ADR 0060 (right-to-left).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import type { Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { AccountSecurity, Passkeys } from "#contracts/index";
import type { DeviceSession, PasskeyCredential } from "#contracts/index";
import {
  MemoryIdpAdminDriver,
  MemoryPasskeysDriver,
  SessionService,
  SessionStatus,
  stepUpSignIn,
} from "#core/index";
import { SecurityPage } from "#react/security-page/security-page";
import { MemoryAccountSecurityDriver } from "#testing/drivers/memory-account-security.driver";
import { SessionFake } from "#testing/session.fake";

const LABELS = {
  title: "Security",
  loading: "Loading security settings",
  failed: "Something went wrong.",
  saved: "Saved.",
  password: {
    title: "Password",
    change: "Change password",
    current: "Current password",
    next: "New password",
    save: "Save password",
    cancel: "Cancel",
    none: "You sign in without a password.",
  },
  passkeys: {
    title: "Passkeys",
    add: "Add passkey",
    newName: "This device",
    remove: "Remove",
    lastUsed: "Last used",
    never: "Never used",
    empty: "No passkeys yet.",
  },
  twoFactor: {
    title: "Two-factor",
    setUp: "Set up",
    factors: { totp: "Authenticator app", otp_email: "Email code", otp_sms: "SMS code" },
    none: "Not set up.",
  },
  sessions: {
    title: "Sessions",
    current: "This device",
    revoke: "Sign out",
    revokeOthers: "Sign out everywhere else",
    lastActive: "Last active",
  },
  stepUp: {
    title: "Confirm it's you",
    reason: "This change needs a fresh sign-in.",
    methodsIntro: "You can use:",
    methods: {
      passkey: "A passkey",
      totp: "An authenticator code",
      password: "Your password",
      "backup-code": "A backup code",
    },
    verify: "Continue",
    cancel: "Not now",
    failed: "We couldn't verify you.",
  },
};

const NOW = new Date("2026-11-02T10:00:00Z");

const DEVICES: readonly DeviceSession[] = [
  {
    id: "ses_1",
    device: "Safari on macOS",
    location: "Riyadh",
    lastActiveAt: NOW,
    isCurrent: true,
  },
  { id: "ses_2", device: "Chrome on Android", location: null, lastActiveAt: NOW, isCurrent: false },
];

/** A container with the memory drivers and a signed-in fake, and a wrapper that binds it. */
async function setUp(security = new MemoryAccountSecurityDriver()) {
  security.seed(
    {
      hasPassword: true,
      secondFactors: ["totp"],
      passkeys: [{ id: "pk_1", name: "iPhone", createdAt: NOW, lastUsedAt: null }],
    },
    DEVICES,
  );
  const session = new SessionFake().seed({ status: SessionStatus.SignedIn });
  const container = await Container.create([], {
    overrides: new Map<Token, object>([
      [SessionService, session],
      [AccountSecurity, security],
      [Passkeys, new MemoryPasskeysDriver()],
    ]),
  });
  const wrap = (children: ReactNode, dir: "ltr" | "rtl" = "ltr") => (
    <ContainerProvider container={container}>
      <div dir={dir}>{children}</div>
    </ContainerProvider>
  );
  return { security, session, wrap };
}

/** Presses the button named `name`. */
async function press(name: string | RegExp) {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name }));
  });
}

describe("SecurityPage", () => {
  afterEach(cleanup);

  it("lists the port's settings under headings one level apart", async () => {
    const { wrap } = await setUp();
    render(wrap(<SecurityPage labels={LABELS} />));
    expect(screen.getByRole("heading", { level: 1, name: "Security" })).toBeTruthy();
    expect(await screen.findByRole("heading", { level: 2, name: "Passkeys" })).toBeTruthy();
    expect(screen.getByText("iPhone")).toBeTruthy();
    expect(screen.getByText("Never used")).toBeTruthy();
    expect(screen.getByText("Authenticator app")).toBeTruthy();
    expect(screen.getByText("Safari on macOS")).toBeTruthy();
    expect(screen.getByText("This device")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign out: Chrome on Android" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Safari on macOS/ })).toBeNull();
  });

  it("removes a passkey and announces it", async () => {
    const { wrap } = await setUp();
    render(wrap(<SecurityPage sections={["passkeys"]} labels={LABELS} />));
    await screen.findByText("iPhone");
    await press("Remove: iPhone");
    await waitFor(() => expect(screen.getByText("No passkeys yet.")).toBeTruthy());
    expect(screen.getByRole("status").textContent).toBe("Saved.");
  });

  it("asks for a step-up when refused, then retries", async () => {
    const security = new MemoryAccountSecurityDriver().requireStepUpOnce();
    const { session, wrap } = await setUp(security);
    render(wrap(<SecurityPage sections={["passkeys"]} labels={LABELS} />));
    await screen.findByText("iPhone");
    await press("Remove: iPhone");
    const dialog = await screen.findByRole("dialog", { name: "Confirm it's you" });
    expect(dialog.textContent).toContain("This change needs a fresh sign-in.");
    await press("Continue");
    expect(session.signIn).toHaveBeenCalledWith(stepUpSignIn());
    await waitFor(() => expect(screen.getByText("No passkeys yet.")).toBeTruthy());
  });

  it("changes the password", async () => {
    const { security, wrap } = await setUp();
    render(wrap(<SecurityPage sections={["password"]} labels={LABELS} />));
    await screen.findByRole("button", { name: "Change password" });
    await press("Change password");
    fireEvent.change(screen.getByLabelText(/^Current password/), { target: { value: "old one" } });
    fireEvent.change(screen.getByLabelText(/^New password/), {
      target: { value: "a long new password" },
    });
    await press("Save password");
    await waitFor(() => expect(security.passwords).toEqual(["a long new password"]));
    expect(screen.queryByLabelText(/^New password/)).toBeNull();
  });

  it("ends every other session and reports it", async () => {
    const { wrap } = await setUp();
    const onSignOutEverywhere = vi.fn();
    render(
      wrap(
        <SecurityPage
          sections={["sessions"]}
          onSignOutEverywhere={onSignOutEverywhere}
          labels={LABELS}
        />,
      ),
    );
    await screen.findByText("Chrome on Android");
    await press("Sign out everywhere else");
    await waitFor(() => expect(onSignOutEverywhere).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText("Chrome on Android")).toBeNull());
  });

  it("adds a passkey through the device and the host's calls", async () => {
    const idp = new MemoryIdpAdminDriver();
    const userId = await idp.createUser({
      organizationId: "org_1",
      username: "rana",
      givenName: "Rana",
      familyName: "Haddad",
      email: "rana@acme.example",
    });
    const confirm = vi.fn(
      (input: { passkeyId: string; name: string; credential: PasskeyCredential }) =>
        idp.finishPasskeyRegistration(userId, input.passkeyId, input.credential, input.name),
    );
    const { wrap } = await setUp();
    render(
      wrap(
        <SecurityPage
          sections={["passkeys"]}
          passkeyCalls={{ register: () => idp.startPasskeyRegistration(userId), confirm }}
          labels={LABELS}
        />,
      ),
    );
    await screen.findByText("iPhone");
    await press("Add passkey");
    await waitFor(() => expect(confirm).toHaveBeenCalled());
    expect(confirm.mock.calls[0]?.[0].name).toBe("This device");
  });

  it("has no add action without the host's calls", async () => {
    const { wrap } = await setUp();
    render(wrap(<SecurityPage sections={["passkeys"]} labels={LABELS} />));
    await screen.findByText("iPhone");
    expect(screen.queryByRole("button", { name: "Add passkey" })).toBeNull();
  });

  it("announces a failed load", async () => {
    const security = new MemoryAccountSecurityDriver();
    vi.spyOn(security, "overview").mockRejectedValue(new Error("down"));
    const { wrap } = await setUp(security);
    render(wrap(<SecurityPage labels={LABELS} />));
    expect((await screen.findByRole("alert")).textContent).toContain(LABELS.failed);
  });

  it("keeps names in their own direction in Arabic", async () => {
    const { wrap } = await setUp();
    render(wrap(<SecurityPage sections={["sessions"]} labels={LABELS} />, "rtl"));
    const device = await screen.findByText("Safari on macOS");
    expect(device.getAttribute("dir")).toBe("auto");
    expect(screen.getByText("Riyadh").getAttribute("dir")).toBe("auto");
    const row = device.closest("li");
    expect(row?.className).not.toMatch(/\b(text-left|text-right|ml-|mr-|pl-|pr-)/);
  });
});
