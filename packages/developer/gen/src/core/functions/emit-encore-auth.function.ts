/**
 * Stackra file contract:
 * Purpose: `emitEncoreAuth`, a service's Encore auth handler and gateway (`.stackra/encore/<member>/auth.ts`): one
 *          `authHandler` that reads the `Authorization` and `Stackra-On-Behalf-Of` headers and answers the
 *          `{ userID, actor }` the endpoints read through `getAuthData()`, by `CallAuthenticator` of `@stackra/app/server`
 *          inside `app.handlers.run`, and the app's one `Gateway` over it. User calls and service calls go through the
 *          same handler (ADR 0209, amendment of 2026-11-07, point 5).
 * Boundary: pure; written for a service whose `api.ts` is written (the caller passes that), since every endpoint, an
 *           anonymous one too, reads the auth data; a service is its own Encore app, so this is the app's one handler.
 *           The `BearerTokenInvalidError` refusal becomes `APIError.unauthenticated` with no detail; any other error
 *           (an issuer outage) propagates as it is. It names no member code and no header value.
 * Runtime: isomorphic
 * Governing contract: ADR 0209 (decision 3 and its 2026-11-07 amendment); ADR 0091 (decision 2) and 0124 (Encore is
 *                     generated); ADR 0098 (the actor from the credential); STA-2558 (wp-114).
 */
import { ENCORE_APP_IMPORT } from "#core/constants/encore-app-import.constant";
import { generatedHeader } from "#core/functions/generated-header.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The Encore auth handler and gateway of a service, or undefined for a package, an app or a service with no endpoint.
 *
 * @param ir - the member read by discovery.
 * @param hasEndpoints - whether gen writes the service's `api.ts`.
 * @example
 * emitEncoreAuth(ir, api !== undefined)?.path; // ".stackra/encore/shop/auth.ts"
 */
export function emitEncoreAuth(ir: MemberIR, hasEndpoints: boolean): GeneratedFile | undefined {
  if (ir.layout !== "service" || !hasEndpoints) return undefined;
  const header = generatedHeader({
    from: "the service's endpoints (api.ts)",
    purpose: `the Encore auth handler and gateway of ${ir.package}: every call's caller, user or service.`,
    boundary:
      "the bearer token is verified and mapped to its actor by CallAuthenticator; every failure is one " +
      "unauthenticated answer with no detail, and the token is never logged.",
    runtime: "node",
  });
  return {
    path: `.stackra/encore/${ir.member}/auth.ts`,
    content: [
      header,
      'import { BearerTokenInvalidError, CallAuthenticator } from "@stackra/app/server";',
      'import type { CallAuthData } from "@stackra/app/server";',
      'import { isRefusal } from "@stackra/errors";',
      'import { APIError, Gateway } from "encore.dev/api";',
      'import type { Header } from "encore.dev/api";',
      'import { authHandler } from "encore.dev/auth";',
      "",
      ENCORE_APP_IMPORT,
      "",
      "/** The credential headers of a call. */",
      "interface AuthParams {",
      '  authorization: Header<"Authorization">;',
      '  onBehalfOf?: Header<"Stackra-On-Behalf-Of">;',
      "}",
      "",
      "/** The caller of every call, user or service, from its verified bearer token. */",
      "export const auth = authHandler<AuthParams, CallAuthData>((params) =>",
      "  app.handlers",
      "    .run((container) => container.get(CallAuthenticator).authenticate(params))",
      "    .catch((error: unknown) => {",
      "      if (isRefusal(error, BearerTokenInvalidError))",
      '        throw APIError.unauthenticated("unauthenticated");',
      "      throw error;",
      "    }),",
      ");",
      "",
      "/** The app's one gateway, authenticating every call through `auth`. */",
      "export const gateway = new Gateway({ authHandler: auth });",
      "",
    ].join("\n"),
  };
}
