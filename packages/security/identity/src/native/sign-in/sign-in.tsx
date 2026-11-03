/**
 * Stackra file contract:
 * Purpose: `SignIn`, the identity kit's native sign-in block: a card with the tenant's external providers, an email and
 *          password form with "remember me" and a forgotten-password link, and the sign-up prompt. The web block's
 *          props on React Native.
 * Boundary: composition of @stackra/ui/native only. It authenticates nothing: a provider press goes to `onProvider`,
 *           where the host starts the provider's sign-in through this entry's Expo drivers (`ExpoSignInBrowserDriver`,
 *           `ExpoAppleSignInDriver`), and the form hands its values to `onSubmit`. With no form element on native, the
 *           fields are controlled and the password's return key submits.
 * Runtime: react-native
 * Governing contract: ADR 0504 (module UI kits); ADR 0206 (identity); ADR 0302 (decision 3: native UI from
 *                     @stackra/ui).
 */
import type { SocialProvider } from "@stackra/ui/contracts";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Cluster,
  Link,
  PasswordField,
  Separator,
  SocialSignInButtons,
  Stack,
  Text,
  TextField,
} from "@stackra/ui/native";
import { type ReactElement, useState } from "react";

import type { SignInProps } from "#native/sign-in/sign-in.props";

/** No providers. */
const NONE: readonly SocialProvider[] = [];

/** The `pending` value of the email and password form. */
const FORM = "form";

/**
 * The sign-in card. A provider-only tenant passes no `onSubmit`; a password-only tenant passes no providers.
 *
 * @example
 * <SignIn providers={providers} onProvider={startProvider} onSubmit={signIn} labels={labels} />
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const isBusy = pending !== undefined;
  const submit = () => {
    if (!isBusy) onSubmit?.({ email, password, remember });
  };
  return (
    <Card className={["w-full max-w-sm self-center", className].filter(Boolean).join(" ")}>
      <Card.Header>
        <Card.Title level={headingLevel}>{labels.title}</Card.Title>
        {labels.description && <Card.Description>{labels.description}</Card.Description>}
      </Card.Header>
      <Card.Content className="gap-4">
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
          <Cluster gap="sm" className="flex-nowrap">
            <Separator className="flex-1" />
            <Text tone="muted" type="small">
              {labels.divider}
            </Text>
            <Separator className="flex-1" />
          </Cluster>
        )}
        {onSubmit && (
          <Stack gap="sm">
            <TextField
              name="email"
              type="email"
              label={labels.email}
              value={email}
              onChange={setEmail}
              returnKeyType="next"
              isRequired
              isDisabled={isBusy}
            />
            <PasswordField
              name="password"
              label={labels.password}
              value={password}
              onChange={setPassword}
              returnKeyType="go"
              onSubmitEditing={submit}
              isRequired
              isDisabled={isBusy}
            />
            <Cluster gap="sm" justify="between">
              <Checkbox value={remember} onChange={setRemember} label={labels.remember} />
              {onForgotPassword && (
                <Link onPress={onForgotPassword} underline="hover">
                  {labels.forgotPassword}
                </Link>
              )}
            </Cluster>
            <Button isFullWidth isLoading={pending === FORM} isDisabled={isBusy} onPress={submit}>
              {labels.submit}
            </Button>
          </Stack>
        )}
      </Card.Content>
      {onSignUp && (
        <Card.Footer className="flex-row flex-wrap items-center justify-center gap-1">
          <Text tone="muted" type="small">
            {labels.signUpPrompt}
          </Text>
          <Link onPress={onSignUp} underline="hover">
            {labels.signUp}
          </Link>
        </Card.Footer>
      )}
    </Card>
  );
}
