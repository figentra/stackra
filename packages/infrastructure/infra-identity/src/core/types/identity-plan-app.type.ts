/**
 * Stackra file contract:
 * Purpose: `IdentityPlanApp`, one OIDC client as it lands on one ZITADEL instance: its kind, the redirect and
 *          post-logout URIs of every environment the instance serves, whether it needs ZITADEL's dev mode, and its
 *          extra grants.
 * Boundary: a type only; `identityPlan` builds it and the Pulumi slice maps it to ZITADEL's app settings.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8), ADR 0277 (decisions 1 and 2), ADR 0345 (decision 3).
 */
import type { IdentityAppKind } from "#core/enums/identity-app-kind.enum";

/** One app on one instance. */
export type IdentityPlanApp = {
  /** The app's member key, also the client's name on ZITADEL. */
  readonly key: string;
  /** How it signs in. */
  readonly kind: IdentityAppKind;
  /** The callbacks, de-duplicated, in environment order. */
  readonly redirectUris: readonly string[];
  /** Where ZITADEL may return after sign-out. */
  readonly postLogoutRedirectUris: readonly string[];
  /** A BFF with an `http://` callback, which ZITADEL accepts only in dev mode; never on a production instance. */
  readonly devMode: boolean;
  /** The device-code grant, for a CLI without a browser (ADR 0277 decision 2). */
  readonly deviceCode: boolean;
  /** The token-exchange grant, for narrow tokens and acting-as (ADR 0345 decision 3, ADR 0211). */
  readonly tokenExchange: boolean;
};
