/**
 * Stackra file contract:
 * Purpose: `SignInProps`, what a host hands the SignIn block: the providers it offers, the handlers and every word.
 * Boundary: an interface in its own file beside the component (ADR 0305). Which providers show, whether a password
 *           form shows and all copy are the tenant's login configuration (a market pack adds national providers); the
 *           block hard-codes none of them.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0206 (identity, provider-neutral); ADR 0305.
 */
import type { SocialProvider } from "@stackra/ui/contracts";

/**
 * The sign-in card's providers, form and words.
 *
 * @example
 * <SignIn providers={providers} onProvider={redirectTo} onSubmit={signIn} labels={labels} />
 */
export interface SignInProps {
  /** The external providers; none hides the provider buttons and the divider. */
  readonly providers?: readonly SocialProvider[] | undefined;
  /** A provider button was pressed; the host starts that provider's redirect. */
  readonly onProvider?: ((providerId: string) => void) | undefined;
  /** The email and password form was submitted; omit it for a provider-only sign-in. */
  readonly onSubmit?:
    | ((values: {
        readonly email: string;
        readonly password: string;
        readonly remember: boolean;
      }) => void)
    | undefined;
  readonly onForgotPassword?: (() => void) | undefined;
  readonly onSignUp?: (() => void) | undefined;
  /** The provider id or "form" that is signing in: its button spins and the rest wait. */
  readonly pending?: string | undefined;
  /** The last attempt's error, shown above the form. */
  readonly error?: string | undefined;
  readonly labels: {
    readonly title: string;
    readonly description?: string | undefined;
    readonly email: string;
    readonly password: string;
    readonly remember: string;
    readonly submit: string;
    readonly forgotPassword: string;
    /** Between the providers and the form: "or". */
    readonly divider: string;
    /** "New here?" before the sign-up link. */
    readonly signUpPrompt: string;
    readonly signUp: string;
  };
  readonly className?: string | undefined;
}
