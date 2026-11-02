/**
 * Stackra file contract:
 * Purpose: `SignInProps`, what a host hands the native SignIn block: the providers it offers, the handlers and every
 *          word. The same props as the web block's, so one login configuration drives both.
 * Boundary: an interface in its own file beside the component (ADR 0305). Which providers show, whether a password
 *           form shows and all copy are the tenant's login configuration (a market pack adds national providers); the
 *           block hard-codes none of them.
 * Runtime: react-native
 * Governing contract: ADR 0504 (module UI kits); ADR 0206 (identity, provider-neutral); ADR 0302 (decision 3: web and
 *                     native parity); ADR 0305.
 */
import type { HeadingLevel, SocialProvider } from "@stackra/ui/contracts";

/**
 * The sign-in card's providers, form and words.
 *
 * @example
 * <SignIn providers={providers} onProvider={(id) => void session.signIn()} onSubmit={signIn} labels={labels} />
 */
export interface SignInProps {
  /** The external providers; none hides the provider buttons and the divider. */
  readonly providers?: readonly SocialProvider[] | undefined;
  /** A provider button was pressed; the host starts that provider's sign-in (the Expo `SignInBrowser` driver). */
  readonly onProvider?: ((providerId: string) => void) | undefined;
  /** The email and password form was submitted; omit it for a provider-only sign-in. */
  readonly onSubmit?:
    | ((values: {
        readonly email: string;
        readonly password: string;
        readonly remember: boolean;
      }) => void)
    | undefined;
  /** Called by the forgot-password link; omit it to hide the link. */
  readonly onForgotPassword?: (() => void) | undefined;
  /** Called by the sign-up link; omit it to hide the link. */
  readonly onSignUp?: (() => void) | undefined;
  /** The provider id or "form" that is signing in: its button spins and the rest wait. */
  readonly pending?: string | undefined;
  /** The last attempt's error, shown above the form and announced. */
  readonly error?: string | undefined;
  /** The title's level in the page outline: 2 by default; native announces it as a header at any level. */
  readonly headingLevel?: HeadingLevel | undefined;
  /** The sign-in card's words; the host writes them. */
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
  /** Styles the root (Uniwind classes). */
  readonly className?: string | undefined;
}
