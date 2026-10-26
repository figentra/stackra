/**
 * Stackra file contract:
 * Purpose: `readIntegrationOptions`, the check `Integration({ ... })` runs when a class is declared: a provider code,
 *          a known category, known levels, a complete `auth` for its type, an http(s) base URL (or an https one with
 *          placeholders), known roles and connector kinds, well-formed rate limits, retries, health schedule and
 *          webhooks. It returns the options to record, `multiple` defaulted.
 * Boundary: internal. A mistake here is the author's, so it throws a `TypeError` or `RangeError` on import, never a
 *           refusal. Placeholders are not resolved here: gen fails one that names no field
 *           (`integration_placeholder_unknown`), and the managed client refuses it at call time.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 1, 6, 9, 10, 13 to 15); ADR 0305 (rule 2).
 */
import { Enum } from "@stackra/contracts";

import { AuthType } from "#core/enums/auth-type.enum";
import { ConnectionLevel } from "#core/enums/connection-level.enum";
import { ConnectorKind } from "#core/enums/connector-kind.enum";
import { IntegrationCategory } from "#core/enums/integration-category.enum";
import { IntegrationRole } from "#core/enums/integration-role.enum";
import { RateLimitScope } from "#core/enums/rate-limit-scope.enum";
import { intervalMs } from "#core/functions/interval-ms.function";
import type { IntegrationOptions } from "#core/types/integration-options.type";
import type { Interval } from "#core/types/interval.type";

/** A provider code: lowercase words joined by `-` or `_`. */
const PROVIDER = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

/** The JWT algorithms the managed client signs with. */
const JWT_ALGORITHMS: readonly string[] = ["HS256", "RS256", "ES256"];

/** The algorithms a JWT bearer assertion is signed with: a private key, never a shared secret. */
const ASSERTION_ALGORITHMS: readonly string[] = ["RS256", "ES256"];

/** The HMAC hashes a webhook signature recipe may name. */
const HMAC_HASHES: readonly string[] = ["SHA-1", "SHA-256", "SHA-512"];

/** Throws a `TypeError` naming the option unless `ok`. */
function ensure(ok: boolean, option: string, needs: string): void {
  if (!ok) throw new TypeError(`Integration({ ${option} }) ${needs}`);
}

/** Whether `value` is a non-empty string. */
const isText = (value: unknown): value is string => typeof value === "string" && value !== "";

/** Whether `value` is an absolute http or https URL with no `{field}` placeholder (a parser accepts braces in a host). */
function isHttpUrl(value: unknown): boolean {
  if (!isText(value) || /[{}]/.test(value) || !URL.canParse(value)) return false;
  return ["http:", "https:"].includes(new URL(value).protocol);
}

/** Whether `value` is an https URL once each `{field}` placeholder is filled (a per-region host). */
const isPlaceholderUrl = (value: unknown): boolean =>
  isText(value) &&
  /\{[A-Za-z_$][\w$]*\}/.test(value) &&
  value.startsWith("https://") &&
  isHttpUrl(value.replace(/\{[A-Za-z_$][\w$]*\}/g, "placeholder"));

/** Whether `value` is a whole number from 1. */
const isCount = (value: unknown): boolean => Number.isInteger(value) && (value as number) >= 1;

/** Reads an optional interval, so a malformed one throws its `RangeError` here. */
function checkInterval(value: Interval | undefined, positive = false): void {
  if (value === undefined) return;
  if (intervalMs(value) <= 0 && positive)
    throw new RangeError(`"${value}" must be longer than zero`);
}

/**
 * Checks `options` and returns what the kind registry records.
 *
 * @throws TypeError or RangeError naming the first option that is missing or malformed.
 * @example
 * readIntegrationOptions({ provider: "resend", category: IntegrationCategory.Email, levels: [], auth: { type: AuthType.None } });
 */
export function readIntegrationOptions(
  options: IntegrationOptions,
): Readonly<Record<string, unknown>> {
  const { provider, category, levels, auth } = options ?? ({} as IntegrationOptions);
  ensure(
    isText(provider) && PROVIDER.test(provider),
    "provider",
    'needs a lowercase code such as "resend"',
  );
  ensure(
    Enum.values(IntegrationCategory).includes(category),
    "category",
    "needs an IntegrationCategory",
  );
  ensure(
    Array.isArray(levels) &&
      levels.every((level) => Enum.values(ConnectionLevel).includes(level)) &&
      new Set(levels).size === levels.length,
    "levels",
    "needs distinct ConnectionLevels",
  );
  ensure(Enum.values(AuthType).includes(auth?.type), "auth", "needs a type from AuthType");
  switch (auth.type) {
    case AuthType.ApiKey:
      ensure(
        isText(auth.header) !== isText(auth.query),
        "auth",
        "of an API key names exactly one of header or query",
      );
      break;
    case AuthType.Basic:
      ensure(
        isText(auth.username) && isText(auth.password),
        "auth",
        "of Basic needs username and password",
      );
      break;
    case AuthType.Jwt:
      ensure(
        JWT_ALGORITHMS.includes(auth.algorithm) && isText(auth.key),
        "auth",
        "of a JWT needs an algorithm and a key",
      );
      checkInterval(auth.expiresIn, true);
      break;
    case AuthType.OAuth2Code:
      ensure(
        isHttpUrl(auth.authorizeUrl) &&
          isHttpUrl(auth.tokenUrl) &&
          isText(auth.clientId) &&
          Array.isArray(auth.scopes),
        "auth",
        "of an authorization code needs authorizeUrl, tokenUrl, clientId and scopes",
      );
      ensure(
        auth.revokeUrl === undefined || isHttpUrl(auth.revokeUrl),
        "auth",
        "needs revokeUrl to be a URL",
      );
      ensure(
        levels.length > 0,
        "levels",
        "of an authorization code integration needs a level to hold the tokens",
      );
      checkInterval(auth.refresh?.buffer);
      break;
    case AuthType.OAuth2ClientCredentials:
      ensure(
        isHttpUrl(auth.tokenUrl) && isText(auth.clientId) && isText(auth.clientSecret),
        "auth",
        "of client credentials needs tokenUrl, clientId and clientSecret",
      );
      checkInterval(auth.refresh?.buffer);
      break;
    case AuthType.OAuth2JwtBearer:
      ensure(
        isHttpUrl(auth.tokenUrl) &&
          isText(auth.key) &&
          isText(auth.issuer) &&
          (auth.algorithm === undefined || ASSERTION_ALGORITHMS.includes(auth.algorithm)),
        "auth",
        "of a JWT bearer grant needs tokenUrl, key, issuer and an RS256 or ES256 algorithm",
      );
      checkInterval(auth.expiresIn, true);
      checkInterval(auth.refresh?.buffer);
      break;
    case AuthType.None:
      break;
  }
  ensure(
    options.requestBody === undefined || ["json", "form"].includes(options.requestBody),
    "requestBody",
    'needs "json" or "form"',
  );
  ensure(
    options.baseUrl === undefined ||
      isHttpUrl(options.baseUrl) ||
      isPlaceholderUrl(options.baseUrl),
    "baseUrl",
    "needs an http or https URL, or an https URL with {field} placeholders",
  );
  ensure(
    options.roles === undefined ||
      (Array.isArray(options.roles) &&
        options.roles.every((role) => Enum.values(IntegrationRole).includes(role)) &&
        new Set(options.roles).size === options.roles.length),
    "roles",
    "needs distinct IntegrationRoles",
  );
  ensure(
    options.connectors === undefined ||
      (Array.isArray(options.connectors) &&
        options.connectors.length > 0 &&
        options.connectors.every((kind) => Enum.values(ConnectorKind).includes(kind)) &&
        (options.roles ?? []).includes(IntegrationRole.Connector)),
    "connectors",
    "needs ConnectorKinds and the connector role",
  );
  for (const limit of options.rateLimits ?? []) {
    ensure(
      isCount(limit?.requests) && Enum.values(RateLimitScope).includes(limit.by),
      "rateLimits",
      "need whole requests from 1 and a RateLimitScope",
    );
    checkInterval(limit.per, true);
  }
  ensure(
    options.retry?.attempts === undefined || isCount(options.retry.attempts),
    "retry",
    "needs attempts from 1",
  );
  checkInterval(options.retry?.backoff);
  checkInterval(options.retry?.maxDelay);
  if (options.health !== undefined) {
    checkInterval(options.health.every, true);
    ensure(
      options.health.failAfter === undefined || isCount(options.health.failAfter),
      "health",
      "needs failAfter from 1",
    );
  }
  if (options.webhooks !== undefined) {
    ensure(
      isText(options.webhooks.scheme) &&
        isText(options.webhooks.secret) &&
        isText(options.webhooks.eventType?.path) &&
        (options.webhooks.eventId === undefined || isText(options.webhooks.eventId.path)),
      "webhooks",
      "need a scheme, a secret placeholder and an eventType path",
    );
    const signature = options.webhooks.signature;
    if (signature !== undefined) {
      const timestamped = isText(signature.timestampHeader) || isText(signature.parts?.timestamp);
      ensure(
        isText(signature.header) &&
          HMAC_HASHES.includes(signature.algorithm) &&
          ["hex", "base64"].includes(signature.encoding) &&
          (signature.secretEncoding === undefined ||
            ["utf8", "base64"].includes(signature.secretEncoding)) &&
          isText(signature.payload) &&
          signature.payload.includes("{body}") &&
          (!signature.payload.includes("{timestamp}") || timestamped) &&
          (!signature.payload.includes("{id}") || isText(signature.idHeader)) &&
          (signature.parts === undefined ||
            (isText(signature.parts.separator) &&
              isText(signature.parts.assign) &&
              isText(signature.parts.signature))) &&
          (signature.tolerance === undefined || timestamped),
        "webhooks",
        "signature needs a header, an HMAC hash, an encoding, a payload with {body}, and a timestamp for {timestamp} or a tolerance",
      );
      checkInterval(signature.tolerance, true);
    }
  }
  return { ...options, roles: options.roles ?? [], multiple: options.multiple ?? false };
}
