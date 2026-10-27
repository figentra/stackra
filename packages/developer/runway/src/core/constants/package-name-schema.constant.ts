/**
 * Stackra file contract:
 * Purpose: `PACKAGE_NAME_SCHEMA`, a scoped npm package name (`@figentra/mezzora-console-ui`), for the packages a
 *          surface or mobile app loads and the package an ops contribution comes from.
 * Boundary: internal; the surfaces, contribution and mobile schemas compose it. Shape only.
 * Runtime: isomorphic
 * Governing contract: ADR 0436 (products ship packages), ADR 0349 (package scope).
 */
import { z } from "zod";

/** `@scope/name`, lower case. */
export const PACKAGE_NAME_SCHEMA = z
  .string()
  .regex(/^@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/, "Expected a scoped package name");
