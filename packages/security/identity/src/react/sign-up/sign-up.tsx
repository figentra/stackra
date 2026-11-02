/**
 * Stackra file contract:
 * Purpose: `SignUp`, the identity kit's sign-up block: a card that walks the host's steps (the account with the
 *          providers and the password policy, the emailed code, the first organisation) behind a stepper, and hands
 *          the new session to `onSignedUp`.
 * Boundary: composition of @stackra/ui (`Card`, `Stepper`, `SocialSignInButtons`, `TextField`, `PasswordField`,
 *           `OtpInput`, `Button`, `Alert`, `Link`) and the kit's `PasswordPolicyChecklist`, over `useSession`. Each
 *           step's call is the host's; a failed one stays on its step with the host's `failed` words in an alert.
 *           `onSignedUp` runs once, after the last step, as soon as the session is signed in.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0206 (identity); ADR 0207 (decision 3); ADR 0165 (UI through
 *                     @stackra/ui).
 */
import {
  Alert,
  Button,
  Card,
  Link,
  OtpInput,
  PasswordField,
  SocialSignInButtons,
  Stepper,
  Text,
  TextField,
} from "@stackra/ui/react";
import { type FormEvent, type ReactElement, useEffect, useRef, useState } from "react";

import { SessionStatus } from "#core/index";
import { PasswordPolicyChecklist } from "#react/password-policy-checklist/password-policy-checklist";
import { useSession } from "#react/session/use-session";
import type { SignUpProps } from "#react/sign-up/sign-up.props";

/** The default steps. */
const ACCOUNT_THEN_VERIFY = ["account", "verify"] as const;

/**
 * The sign-up card.
 *
 * @example
 * <SignUp providers={providers} onAccount={register} onVerify={confirm} termsHref="/terms" privacyHref="/privacy" labels={labels} />
 */
export function SignUp({
  steps = ACCOUNT_THEN_VERIFY,
  providers,
  onProvider,
  onAccount,
  onVerify,
  onOrganization,
  policy,
  termsHref,
  privacyHref,
  onSignedUp,
  headingLevel = 2,
  labels,
  className,
}: SignUpProps): ReactElement {
  const session = useSession();
  const [index, setIndex] = useState(0);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [isPending, setPending] = useState(false);
  const [isFailed, setFailed] = useState(false);
  const [isDone, setDone] = useState(false);
  const reported = useRef(false);
  useEffect(() => {
    if (!isDone || reported.current || session.status !== SessionStatus.SignedIn) return;
    reported.current = true;
    onSignedUp?.(session);
  }, [isDone, onSignedUp, session]);
  const step = steps[index] ?? "account";
  const isLast = index >= steps.length - 1;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) ?? "");
    setPending(true);
    setFailed(false);
    try {
      if (step === "account")
        await onAccount?.({ name: text("name"), email: text("email"), password });
      else if (step === "verify") await onVerify?.(code);
      else await onOrganization?.({ name: text("organization") });
      if (isLast) setDone(true);
      else setIndex(index + 1);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  };
  return (
    <Card className={`w-full max-w-sm ${className ?? ""}`}>
      <Card.Header>
        <Card.Title level={headingLevel}>{labels.title}</Card.Title>
        {labels.description && <Card.Description>{labels.description}</Card.Description>}
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        {steps.length > 1 && (
          <Stepper
            label={labels.progress}
            variant="compact"
            currentStep={step}
            steps={steps.map((id) => ({ id, label: labels.steps[id] }))}
          />
        )}
        {isFailed && <Alert tone="danger" title={labels.failed} />}
        {step === "account" && providers.length > 0 && (
          <>
            <SocialSignInButtons
              providers={providers}
              isDisabled={isPending}
              onSignIn={(id) => onProvider?.(id)}
            />
            <div className="flex items-center gap-3" role="separator" aria-label={labels.divider}>
              <span className="h-px flex-1 bg-separator" />
              <Text tone="muted" type="small">
                {labels.divider}
              </Text>
              <span className="h-px flex-1 bg-separator" />
            </div>
          </>
        )}
        <form key={step} onSubmit={(event) => void submit(event)} className="flex flex-col gap-3">
          {step === "account" && (
            <>
              <TextField name="name" label={labels.name} autoComplete="name" isRequired />
              <TextField
                name="email"
                type="email"
                label={labels.email}
                autoComplete="email"
                isRequired
              />
              <PasswordField
                name="password"
                label={labels.password}
                autoComplete="new-password"
                value={password}
                onChange={setPassword}
                isRequired
                description={
                  policy && labels.rules ? (
                    <PasswordPolicyChecklist
                      policy={policy}
                      password={password}
                      labels={labels.rules}
                    />
                  ) : undefined
                }
              />
            </>
          )}
          {step === "verify" && (
            <OtpInput label={labels.code} value={code} onChange={setCode} isRequired />
          )}
          {step === "organization" && (
            <TextField
              name="organization"
              label={labels.organization}
              autoComplete="organization"
              isRequired
            />
          )}
          <Button type="submit" isFullWidth isLoading={isPending} isDisabled={isDone}>
            {isLast ? labels.submit : labels.next}
          </Button>
        </form>
        {termsHref && privacyHref && (
          <Text tone="muted" type="small">
            {labels.agreement} <Link href={termsHref}>{labels.terms}</Link> {labels.and}{" "}
            <Link href={privacyHref}>{labels.privacy}</Link>
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}
