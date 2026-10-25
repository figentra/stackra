/**
 * Stackra file contract:
 * Purpose: `ZITADEL_PROVIDER_SCHEMA`, the root runway's `providers.zitadel`: the ZITADEL instances by name, each with
 *          its domain (the issuer's host) and the runway environments it serves.
 * Boundary: internal; `identityPlan` checks `providers.zitadel` with it, because the root runway schema keeps every
 *           provider block open for its owner to check. Strict, so a misspelt key fails. A domain is a lower-case DNS
 *           name with no scheme or port: a hosted instance is `https://` on 443.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 4: ZITADEL Cloud for SaaS, self-hosted on-prem), ADR 0290 (decision 8: the
 *                     non-production instance serves staging and public callbacks), ADR 0296 (decision 2: accounts
 *                     and vendors are root facts).
 */
import { Enum } from "@stackra/contracts";
import { RunwayEnvironment } from "@stackra/runway";
import { z } from "zod";

/** A runway environment name. */
const ENVIRONMENT = z.enum(
  Enum.values(RunwayEnvironment) as [RunwayEnvironment, ...RunwayEnvironment[]],
);

/** A lower-case DNS name of two labels or more (`id.staging.acme.example`). */
const DOMAIN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** `providers.zitadel`. */
export const ZITADEL_PROVIDER_SCHEMA = z.strictObject({
  instances: z.record(
    z.string().regex(/^[a-z][a-z0-9-]*$/, "Expected an instance name in kebab-case"),
    z.strictObject({
      domain: z.string().regex(DOMAIN, "Expected a host name, without a scheme or port"),
      environments: z.array(ENVIRONMENT).min(1),
    }),
  ),
});
