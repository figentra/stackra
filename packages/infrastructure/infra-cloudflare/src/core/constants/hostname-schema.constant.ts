/**
 * Stackra file contract:
 * Purpose: `HOSTNAME_SCHEMA`, a fully qualified host name of two or more DNS labels: a zone (`figentra.com`) or a host
 *          under one (`static.stackra.figentra.com`).
 * Boundary: internal; the stack schemas compose it. Record names, which may hold `_` and `@`, have their own pattern.
 * Runtime: isomorphic
 * Governing contract: ADR 0175 (domain names), ADR 0290 (decisions 1 and 2).
 */
import { z } from "zod";

/** `figentra.cloud`, `static.stackra.figentra.com`. */
export const HOSTNAME_SCHEMA = z
  .string()
  .max(253)
  .regex(
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/,
    "Expected a lower-case host name such as static.stackra.figentra.com",
  );
