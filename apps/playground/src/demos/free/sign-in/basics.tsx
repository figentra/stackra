/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web SignIn block (@stackra/identity): the tenant's three providers and the email and password form; a wrong password shows the error.
 * Boundary: a demo with no props: the kit block, @stackra/ui and local state only; every word from the catalogue and
 *           every price and option as demo data. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0503 (module UI kits).
 */
import { SignIn } from "@stackra/identity/react";
import { useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { SIGN_IN_KEYS } from "#src/demos/free/sign-in/sign-in-keys.constant";

/** The demo's keys. */
const K = SIGN_IN_KEYS.sign_in.basics;

/** Sign in: providers and a password form. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [error, setError] = useState<string | undefined>(undefined);
  return (
    <div className="flex w-full justify-center">
      <SignIn
        providers={[
          { id: "apple", name: "Apple" },
          { id: "google", name: "Google" },
          { id: "email", name: t(K.with_email) },
        ]}
        onProvider={() => setError(undefined)}
        onSubmit={() => setError(t(K.error))}
        onForgotPassword={() => {}}
        onSignUp={() => {}}
        error={error}
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
    </div>
  );
}
