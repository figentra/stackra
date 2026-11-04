/**
 * Stackra file contract:
 * Purpose: `SecurityPage`, the identity kit's "security" settings page: the password (change it), the passkeys (add,
 *          remove), the second factors (set one up) and the device sessions (end one, or every other), each a section
 *          under the page header.
 * Boundary: composition of @stackra/ui (`PageHeader`, `Section`, `PasswordField`, `Button`, `Chip`, `DateLabel`,
 *           `Alert`, `Spinner`) and the kit's `StepUpDialog`. Data and changes go through the container's
 *           `AccountSecurity` port; adding a passkey is `registerPasskey` over the `Passkeys` port with the host's
 *           calls; setting up a factor is the host's hosted flow. A change refused with `step_up_required` opens the
 *           StepUpDialog and runs again once verified. After each change the page reads the settings again; a failed
 *           load or change shows the host's `failed` words in an alert and a success is announced in a status region.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0260 (client ports); ADR 0207 (decision 1); ADR 0206 (decision
 *                     8); ADR 0338 (decision 4); ADR 0165 (UI through @stackra/ui).
 */
import { useContainer } from "@stackra/container/react";
import type { HeadingLevel } from "@stackra/ui/contracts";
import {
  Alert,
  Button,
  Chip,
  DateLabel,
  PageHeader,
  PasswordField,
  Section,
  Spinner,
  Text,
} from "@stackra/ui/react";
import { type FormEvent, type ReactElement, useCallback, useEffect, useState } from "react";

import { AccountSecurity, Passkeys } from "#contracts/index";
import type { AccountSecurityOverview, AccountSession } from "#contracts/index";
import { registerPasskey } from "#core/index";
import type { SecurityPageProps } from "#react/security-page/security-page.props";
import { StepUpDialog } from "#react/step-up-dialog/step-up-dialog";

/** Every section, in the default order. */
const EVERY_SECTION = ["password", "passkeys", "two-factor", "sessions"] as const;

/** Whether `error` is the `step_up_required` refusal, as the port's driver or a generated client throws it. */
function isStepUpRequired(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "step_up_required"
  );
}

/**
 * The security settings page.
 *
 * @example
 * <SecurityPage passkeyCalls={passkeyCalls} onSetUpSecondFactor={openHostedSetUp} labels={labels} />
 */
export function SecurityPage({
  sections = EVERY_SECTION,
  headingLevel = 1,
  onSignOutEverywhere,
  passkeyCalls,
  onSetUpSecondFactor,
  stepUpMethods,
  labels,
  className,
}: SecurityPageProps): ReactElement {
  const container = useContainer();
  const security = container.get(AccountSecurity);
  const passkeys = container.has(Passkeys) ? container.get(Passkeys) : undefined;
  const [overview, setOverview] = useState<AccountSecurityOverview | null>(null);
  const [devices, setDevices] = useState<readonly AccountSession[]>([]);
  const [notice, setNotice] = useState<"saved" | "failed" | null>(null);
  const [isPending, setPending] = useState(false);
  const [isChanging, setChanging] = useState(false);
  const [retry, setRetry] = useState<(() => Promise<void>) | null>(null);
  const hasSessions = sections.includes("sessions");
  // Reads the settings; resolves false after a failure. `isLive` is false once the page is gone, so a late answer sets
  // nothing.
  const read = useCallback(
    (isLive: () => boolean) =>
      Promise.all([security.overview(), hasSessions ? security.sessions() : []]).then(
        ([next, sessions]) => {
          if (!isLive()) return true;
          setOverview(next);
          setDevices(sessions);
          return true;
        },
        () => {
          if (isLive()) setNotice("failed");
          return false;
        },
      ),
    [security, hasSessions],
  );
  useEffect(() => {
    let isLive = true;
    void read(() => isLive);
    return () => {
      isLive = false;
    };
  }, [read]);
  const run = async (change: () => Promise<void>) => {
    setPending(true);
    setNotice(null);
    try {
      await change();
      if (await read(() => true)) setNotice("saved");
    } catch (error) {
      if (isStepUpRequired(error)) setRetry(() => change);
      else setNotice("failed");
    } finally {
      setPending(false);
    }
  };
  const changePassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const current = String(data.get("current") ?? "");
    const next = String(data.get("next") ?? "");
    void run(async () => {
      await security.changePassword({ current, next });
      setChanging(false);
    });
  };
  const addPasskey = () =>
    void run(async () => {
      if (passkeys === undefined || passkeyCalls === undefined) return;
      const result = await registerPasskey(passkeys, labels.passkeys.newName, passkeyCalls);
      if (!result.ok) throw new Error(result.error);
    });
  const sectionLevel = (headingLevel + 1) as HeadingLevel;
  return (
    <div className={`flex flex-col gap-6 ${className ?? ""}`}>
      <PageHeader
        title={labels.title}
        description={labels.description}
        headingLevel={headingLevel}
      />
      {notice === "failed" && <Alert tone="danger" title={labels.failed} />}
      <Text role="status" tone="success" type="small">
        {notice === "saved" ? labels.saved : ""}
      </Text>
      {overview === null
        ? notice !== "failed" && <Spinner label={labels.loading} />
        : sections.map((section) => {
            if (section === "password")
              return (
                <Section
                  key={section}
                  title={labels.password.title}
                  headingLevel={sectionLevel}
                  actions={
                    overview.hasPassword && !isChanging
                      ? [
                          {
                            id: "change",
                            label: labels.password.change,
                            onPress: () => setChanging(true),
                          },
                        ]
                      : []
                  }
                >
                  {!overview.hasPassword && <Text tone="muted">{labels.password.none}</Text>}
                  {overview.hasPassword && isChanging && (
                    <form onSubmit={changePassword} className="flex max-w-sm flex-col gap-3">
                      <PasswordField
                        name="current"
                        label={labels.password.current}
                        autoComplete="current-password"
                        isRequired
                      />
                      <PasswordField
                        name="next"
                        label={labels.password.next}
                        autoComplete="new-password"
                        isRequired
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onPress={() => setChanging(false)}>
                          {labels.password.cancel}
                        </Button>
                        <Button type="submit" isLoading={isPending}>
                          {labels.password.save}
                        </Button>
                      </div>
                    </form>
                  )}
                </Section>
              );
            if (section === "passkeys")
              return (
                <Section
                  key={section}
                  title={labels.passkeys.title}
                  headingLevel={sectionLevel}
                  actions={
                    passkeyCalls !== undefined && passkeys?.isSupported() === true
                      ? [
                          {
                            id: "add",
                            label: labels.passkeys.add,
                            isDisabled: isPending,
                            onPress: addPasskey,
                          },
                        ]
                      : []
                  }
                >
                  {overview.passkeys.length === 0 ? (
                    <Text tone="muted">{labels.passkeys.empty}</Text>
                  ) : (
                    <ul className="flex flex-col divide-y divide-separator">
                      {overview.passkeys.map((passkey) => (
                        <li key={passkey.id} className="flex items-center gap-3 py-2">
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="truncate font-medium" dir="auto">
                              {passkey.name}
                            </span>
                            <div className="flex flex-wrap items-center gap-1">
                              <Text elementType="span" tone="muted" type="small">
                                {passkey.lastUsedAt === null
                                  ? labels.passkeys.never
                                  : labels.passkeys.lastUsed}
                              </Text>
                              {passkey.lastUsedAt !== null && (
                                <DateLabel date={passkey.lastUsedAt} />
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="danger-soft"
                            label={`${labels.passkeys.remove}: ${passkey.name}`}
                            isDisabled={isPending}
                            onPress={() => void run(() => security.removePasskey(passkey.id))}
                          >
                            {labels.passkeys.remove}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>
              );
            if (section === "two-factor")
              return (
                <Section
                  key={section}
                  title={labels.twoFactor.title}
                  headingLevel={sectionLevel}
                  actions={
                    onSetUpSecondFactor === undefined
                      ? []
                      : [
                          {
                            id: "set-up",
                            label: labels.twoFactor.setUp,
                            onPress: onSetUpSecondFactor,
                          },
                        ]
                  }
                >
                  {overview.secondFactors.length === 0 ? (
                    <Text tone="muted">{labels.twoFactor.none}</Text>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {overview.secondFactors.map((factor) => (
                        <li key={factor}>
                          <Chip size="sm" tone="success">
                            {labels.twoFactor.factors[factor]}
                          </Chip>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>
              );
            return (
              <Section
                key={section}
                title={labels.sessions.title}
                headingLevel={sectionLevel}
                actions={
                  devices.some((device) => !device.isCurrent)
                    ? [
                        {
                          id: "revoke-others",
                          label: labels.sessions.revokeOthers,
                          isDisabled: isPending,
                          onPress: () =>
                            void run(async () => {
                              await security.revokeOtherSessions();
                              onSignOutEverywhere?.();
                            }),
                        },
                      ]
                    : []
                }
              >
                <ul className="flex flex-col divide-y divide-separator">
                  {devices.map((device) => (
                    <li key={device.id} className="flex items-center gap-3 py-2">
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate font-medium" dir="auto">
                          {device.device}
                        </span>
                        <div className="flex flex-wrap items-center gap-1">
                          {device.location !== null && (
                            <Text elementType="span" tone="muted" type="small">
                              <span dir="auto">{device.location}</span>
                            </Text>
                          )}
                          <Text elementType="span" tone="muted" type="small">
                            {labels.sessions.lastActive}
                          </Text>
                          <DateLabel date={device.lastActiveAt} />
                        </div>
                      </div>
                      {device.isCurrent ? (
                        <Chip size="sm" tone="accent">
                          {labels.sessions.current}
                        </Chip>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          label={`${labels.sessions.revoke}: ${device.device}`}
                          isDisabled={isPending}
                          onPress={() => void run(() => security.revokeSession(device.id))}
                        >
                          {labels.sessions.revoke}
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </Section>
            );
          })}
      <StepUpDialog
        isOpen={retry !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setRetry(null);
        }}
        methods={stepUpMethods}
        reason={labels.stepUp.reason}
        onVerified={() => {
          if (retry !== null) void run(retry);
        }}
        labels={labels.stepUp}
      />
    </div>
  );
}
