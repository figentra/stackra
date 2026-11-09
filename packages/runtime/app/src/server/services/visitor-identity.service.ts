/**
 * Stackra file contract:
 * Purpose: `VisitorIdentityService`, who an anonymous call's visitor is: the id in the signed token the request
 *          carries (its `stackra-visitor` header, else its `stackra_visitor` cookie), or a new visitor, with the token
 *          and cookie the answer carries back.
 * Boundary: with no signing key (the secret not set) every call is a new visitor and nothing is carried back, as before
 *           this service. A token signed with the previous key is accepted and re-signed with the current one. A forged,
 *           malformed or expired-key token is ignored: the caller becomes a new visitor, never someone else. The cookie
 *           is `HttpOnly; Secure; SameSite=Lax; Path=/`, so page scripts never read it.
 * Runtime: node
 * Governing contract: ADR 0173 (secrets); ADR 0437 (server-check order); STA-2025 (as amended 2026-11-09: a visitor's
 *                     record policy runs, so a visitor keeps one id across requests).
 */
import { Service } from "@stackra/container";
import { mintPublicId } from "@stackra/contracts";

import type { VisitorConfig } from "#config/visitor.config";
import { signVisitorToken } from "#server/functions/sign-visitor-token.function";
import { verifyVisitorToken } from "#server/functions/verify-visitor-token.function";
import type { VisitorIdentity } from "#server/types/visitor-identity.type";

/** One request's cookie named `name`, or `undefined`. */
function cookieOf(request: Request, name: string): string | undefined {
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return undefined;
}

/**
 * Resolves the visitor of an anonymous call.
 *
 * @example
 * const visitor = await container.get(VisitorIdentityService).resolve(request);
 * actor = { kind: ActorKind.Anonymous, id: visitor.id };
 */
export class VisitorIdentityService extends Service {
  /**
   * @param config - the signing keys and where the token travels.
   */
  constructor(private readonly config: VisitorConfig) {
    super();
  }

  /** The visitor `request` carries, or a new one; `issue` is set when the answer must carry the token back. */
  async resolve(request: Request): Promise<VisitorIdentity> {
    const { signingKey, previousSigningKey, headerName, cookieName } = this.config;
    if (signingKey === "") return { id: mintPublicId("anon") };
    const carried = request.headers.get(headerName) ?? cookieOf(request, cookieName);
    const known =
      carried === undefined || carried === null
        ? undefined
        : await verifyVisitorToken(carried, [signingKey, previousSigningKey]);
    if (known !== undefined && known.key === 0) return { id: known.id };
    const id = known?.id ?? mintPublicId("anon");
    const token = await signVisitorToken(id, signingKey);
    const maxAge = this.config.cookieMaxAgeDays * 86_400;
    return {
      id,
      issue: {
        header: headerName,
        token,
        cookie: `${cookieName}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`,
      },
    };
  }
}
