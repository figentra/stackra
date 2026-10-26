/**
 * Stackra file contract:
 * Purpose: `PACKAGE_NAME_SCHEMA`, a scoped package name (`@mezzora/console-ui`): a package a surface's extension
 *          bundle or a mobile app is built from, or the ops declarations package a product contributes.
 * Boundary: internal; the package list and surface schemas compose it. Shape only: whether the package exists in the
 *           workspace is gen's check.
 * Runtime: isomorphic
 * Governing contract: ADR 0436 (decisions 2, 4 and 9), ADR 0441 (decision 3).
 */
import { z } from "zod";

/** `@mezzora/console-ui`. */
export const PACKAGE_NAME_SCHEMA = z
  .string()
  .regex(
    /^@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/,
    "Expected a scoped package name, such as @acme/console-ui",
  );
