/**
 * Stackra file contract:
 * Purpose: `SignIn`, the identity kit's sign-in block: a card with the tenant's external providers, an email and
 *          password form with "remember me" and a forgotten-password link, and the sign-up prompt.
 * Boundary: composition of @stackra/ui only. It authenticates nothing: providers redirect through the host (the BFF and
 *           `SignInBrowser` drivers of this package) and the form hands its values to `onSubmit`.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0206 (identity); ADR 0165 (UI through @stackra/ui).
 */
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Link,
  PasswordField,
  SocialSignInButtons,
  Text,
  TextField,
} from "@stackra/ui/react";
import type { SocialProvider } from "@stackra/ui/contracts";
import { type FormEvent, type ReactElement, useState } from "react";

import type { SignInProps } from "#react/sign-in/sign-in.props";

/** No providers. */
const NONE: readonly SocialProvider[] = [];

/** The `pending` value of the email and password form. */
const FORM = "form";

/**
 * The sign-in card. A provider-only tenant passes no `onSubmit`; a password-only tenant passes no providers.
 *
 * @example
 * <SignIn providers={providers} onProvider={redirectTo} onSubmit={signIn} labels={labels} />
 */
export function SignIn({
  providers = NONE,
  onProvider,
  onSubmit,
  onForgotPassword,
  onSignUp,
  pending,
  error,
  headingLevel = 2,
  labels,
  className,
}: SignInProps): ReactElement {
  const [remember, setRemember] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit?.({
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
      remember,
    });
  };
  const isBusy = pending !== undefined;
  return (
    <Card className={`w-full max-w-sm ${className ?? ""}`}>
      <Card.Header>
        <Card.Title level={headingLevel}>{labels.title}</Card.Title>
        {labels.description && <Card.Description>{labels.description}</Card.Description>}
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        {error && <Alert tone="danger" title={error} />}
        {providers.length > 0 && (
          <SocialSignInButtons
            providers={providers}
            pendingId={pending === FORM ? undefined : pending}
            isDisabled={isBusy}
            onSignIn={(id) => onProvider?.(id)}
          />
        )}
        {providers.length > 0 && onSubmit && (
          <div className="flex items-center gap-3" role="separator" aria-label={labels.divider}>
            <span className="h-px flex-1 bg-separator" />
            <Text tone="muted" type="small">
              {labels.divider}
            </Text>
            <span className="h-px flex-1 bg-separator" />
          </div>
        )}
        {onSubmit && (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <TextField
              name="email"
              type="email"
              label={labels.email}
              autoComplete="username"
              isRequired
              isFullWidth
            />
            <PasswordField
              name="password"
              label={labels.password}
              autoComplete="current-password"
              isRequired
              isFullWidth
            />
            <div className="flex items-center justify-between gap-2">
              <Checkbox value={remember} onChange={setRemember} label={labels.remember} />
              {onForgotPassword && <Link onPress={onForgotPassword}>{labels.forgotPassword}</Link>}
            </div>
            <Button type="submit" isFullWidth isLoading={pending === FORM} isDisabled={isBusy}>
              {labels.submit}
            </Button>
          </form>
        )}
      </Card.Content>
      {onSignUp && (
        <Card.Footer className="justify-center gap-1">
          <Text tone="muted" type="small">
            {labels.signUpPrompt}
          </Text>
          <Link onPress={onSignUp}>{labels.signUp}</Link>
        </Card.Footer>
      )}
    </Card>
  );
}
