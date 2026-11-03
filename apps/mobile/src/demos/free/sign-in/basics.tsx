/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native SignIn block (@stackra/identity): the tenant's three providers and the
 *          email and password form; a provider press spins its button, and a submitted password shows the error.
 * Boundary: a demo with no props: the kit block and local state only; nothing signs in (an app's `onProvider` starts
 *           the provider through the Expo `SignInBrowser` driver). Every word from the catalogue. The same file is the
 *           preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); ADR 0504 (module UI kits).
 */
import { SignIn } from "@stackra/identity/native";
import { useCatalogueText } from "@stackra/ui/native";
import { useEffect, useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { SIGN_IN_DEMO_KEYS } from "#src/demos/free/sign-in/sign-in-demo-keys.constant";

/** The demo's keys. */
const K = SIGN_IN_DEMO_KEYS.demo_free.sign_in.basics;

/** The `pending` value of the email and password form. */
const FORM = "form";

/** Sign in: providers and a password form. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [pending, setPending] = useState<string | undefined>(undefined);
  const [isRefused, setIsRefused] = useState(false);
  useEffect(() => {
    if (pending === undefined) return undefined;
    // The demo's stand-in for the sign-in round trip: a provider comes back, the password is refused.
    const timer = setTimeout(() => {
      setIsRefused(pending === FORM);
      setPending(undefined);
    }, 1200);
    return () => clearTimeout(timer);
  }, [pending]);
  const start = (id: string) => {
    setIsRefused(false);
    setPending(id);
  };
  return (
    <SignIn
      providers={[
        { id: "apple", name: "Apple" },
        { id: "google", name: "Google" },
        { id: "email", name: t(K.with_email) },
      ]}
      onProvider={start}
      onSubmit={() => start(FORM)}
      onForgotPassword={() => {}}
      onSignUp={() => {}}
      pending={pending}
      error={isRefused ? t(K.error) : undefined}
      labels={{
        title: t(K.title),
        description: t(K.description),
        email: t(K.email),
        password: t(K.password),
        remember: t(K.remember),
        submit: t(K.submit),
        forgotPassword: t(K.forgot),
        divider: t(K.divider),
        signUpPrompt: t(K.prompt),
        signUp: t(K.sign_up),
      }}
    />
  );
}
