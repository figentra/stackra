/**
 * Stackra file contract:
 * Purpose: `devIssuerKeys(config, environment)`, the dev issuer's public keys a server accepts dev tokens under
 *          (STA-2795): none when `BearerConfig.devKeys` is empty (the default, and every deployed environment), else
 *          the parsed JWK Set, but only when the running environment is `StackraEnvironment.Dev`, the developer machine
 *          `stackra dev` runs (ADR 0170 decision 5). The environment is the one reader's answer (`readEnvironment`,
 *          STA-2844), passed in by `createApp` and by `verifyCallToken`'s callers; no configuration value names it, so
 *          neither a values layer nor a host override can turn dev sign-in on. `createApp` calls it once at boot, so a
 *          deployment that carries the keys fails to start instead of answering dev tokens; `verifyCallToken` calls it
 *          per call.
 * Boundary: dev keys in any other environment (`test`, `preview`, `staging`, `production`) are refused with
 *           `ConfigInvalidError` naming `STACKRA_DEV_ISSUER_KEYS` and the environment, never a value. So is a set that
 *           is not JSON, holds no key or more than eight, or a key that is not a public ES256 key (P-256, `x` and `y`)
 *           with a `kid`, or that carries a private member (`d`): the private half never travels. The parsed set is
 *           cached per configuration instance; the environment is checked on every call.
 * Runtime: node
 * Governing contract: ADR 0206 (decision 8, amendment of 2026-11-26: the dev issuer, accepted only in `dev`);
 *                     ADR 0296 (amendment 2026-11-26: the environment comes from the runtime only); ADR 0170
 *                     (decision 5); ADR 0295 (decision 10: a bad environment fails boot); STA-2844.
 */
import { ConfigInvalidError, ENVIRONMENT_VARIABLE } from "@stackra/config";
import type { StackraEnvironment } from "@stackra/config";

import type { BearerConfig } from "#config/bearer.config";
import { DEV_ISSUER } from "#core/constants/dev-issuer.constant";

/** The most keys a dev set holds (the current key and a few rotated ones). */
const MAX_KEYS = 8;

/** A public dev key: ES256, with its `kid`. */
type DevPublicKey = JsonWebKey & { readonly kid: string };

/** The parsed key set per configuration instance. */
const CACHE = new WeakMap<object, readonly DevPublicKey[]>();

/** The refusal naming the variable, never its value. */
const refuse = (message: string): ConfigInvalidError =>
  new ConfigInvalidError("BearerConfig", [{ path: DEV_ISSUER.keysVariable, message }]);

/** Whether `key` is a public ES256 JWK with a `kid` and no private member. */
function isPublicDevKey(key: unknown): key is DevPublicKey {
  if (typeof key !== "object" || key === null || Array.isArray(key)) return false;
  const jwk = key as Record<string, unknown>;
  return (
    jwk["kty"] === "EC" &&
    jwk["crv"] === "P-256" &&
    typeof jwk["x"] === "string" &&
    typeof jwk["y"] === "string" &&
    typeof jwk["kid"] === "string" &&
    jwk["kid"] !== "" &&
    (jwk["alg"] === undefined || jwk["alg"] === DEV_ISSUER.algorithm) &&
    !Object.hasOwn(jwk, "d")
  );
}

/** The parsed and checked key set of `text`. */
function parse(text: string): readonly DevPublicKey[] {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw refuse("is not a JSON Web Key Set");
  }
  const keys = (value as { keys?: unknown } | null)?.keys;
  if (!Array.isArray(keys) || keys.length === 0 || keys.length > MAX_KEYS)
    throw refuse(`holds no key set of 1 to ${MAX_KEYS} keys`);
  if (!keys.every(isPublicDevKey))
    throw refuse(
      "holds a key that is not a public ES256 key with a kid (a private key never travels)",
    );
  return Object.freeze(keys.map((key) => Object.freeze({ ...key })));
}

/**
 * The dev issuer's public keys under `config` in `environment`, or undefined when dev sign-in is off.
 *
 * @param config - the bearer configuration; only `devKeys` is read.
 * @param environment - the running environment, from the one reader (`readEnvironment`), never a configuration value.
 * @throws ConfigInvalidError when dev keys are set outside `dev`, or are not a public ES256 key set.
 * @example
 * const keys = devIssuerKeys(container.get(BearerConfig), readEnvironment(process.env, platform));
 */
export function devIssuerKeys(
  config: Pick<BearerConfig, "devKeys">,
  environment: StackraEnvironment,
): readonly DevPublicKey[] | undefined {
  const text = config.devKeys.trim();
  if (text === "") return undefined;
  if (environment !== DEV_ISSUER.environment)
    throw refuse(
      `is set where the running environment is ${ENVIRONMENT_VARIABLE}=${environment}; the dev issuer runs only ` +
        `under stackra dev (${ENVIRONMENT_VARIABLE}=${DEV_ISSUER.environment}), never in a test run or a deployed ` +
        "environment",
    );
  const cached = CACHE.get(config);
  if (cached !== undefined) return cached;
  const keys = parse(text);
  CACHE.set(config, keys);
  return keys;
}
