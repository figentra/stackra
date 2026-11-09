/**
 * Stackra file contract:
 * Purpose: `VisitorOptions`, the shape of `VisitorConfig`: the HMAC keys that sign a visitor's identity, the header and
 *          cookie that carry it back, and the cookie's lifetime.
 * Boundary: a shape class; it registers this package's own schema (`VISITOR_CONFIG_SCHEMA`) when the module loads. Both
 *           keys are platform secrets (Infisical, synced by runway); the owner sets their values. Rotation: the new key
 *           goes in `signingKey` and the old one in `previousSigningKey` for a grace window, during which a visitor
 *           signed with the old key is accepted and re-signed with the new one.
 * Runtime: isomorphic
 * Governing contract: ADR 0173 (secrets come from Infisical); ADR 0294 (decision 26); STA-2025 (as amended
 *                     2026-11-09: a visitor's record policy runs, so a visitor needs one id across requests).
 */
import { Secret } from "@stackra/config";
import { Int, registerSchemas, Schema } from "@stackra/validation";

import { VISITOR_CONFIG_SCHEMA } from "#core/constants/visitor-config-schema.constant";

/**
 * The visitor identity settings.
 *
 * @example
 * export class VisitorConfig extends BaseVisitorConfig {
 *   override cookieMaxAgeDays = 30;
 * }
 */
export class VisitorOptions extends Schema {
  /** The HMAC-SHA-256 key that signs a new visitor; empty until the secret is set, and then every visitor is new. */
  @Secret("STACKRA_VISITOR_SIGNING_KEY")
  signingKey = "";

  /** The key `signingKey` replaced, still accepted (and re-signed) for the rotation's grace window; empty otherwise. */
  @Secret("STACKRA_VISITOR_SIGNING_KEY_PREVIOUS")
  previousSigningKey = "";

  /** How long the cookie lives, in days; each answer that re-signs it starts the count again. */
  @Int({
    min: 1,
    max: 400,
  })
  cookieMaxAgeDays = 365;

  /** The request and response header an API client (mobile, a script) carries the signed visitor in, lower case. */
  headerName = "stackra-visitor";

  /** The httpOnly cookie a browser carries the signed visitor in. */
  cookieName = "stackra_visitor";
}

registerSchemas([[VisitorOptions, VISITOR_CONFIG_SCHEMA]]);
