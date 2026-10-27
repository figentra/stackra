/**
 * Stackra file contract:
 * Purpose: `ASSET_PATH_SCHEMA`, a repository path inside the root `assets/` tree (`assets/mobile/staff`), for the
 *          root runway's landing `content` and a mobile app's `assets` and `store` paths.
 * Boundary: internal; the surfaces and mobile schemas compose it. Shape only: no segment starts with a dot, so `..`
 *           and hidden folders fail; whether the folder exists is the publish step's check.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 1 and enforcement: paths outside `assets/` are refused).
 */
import { z } from "zod";

/** `assets` or a path below it, each segment starting with a letter, digit, `_` or `-`. */
export const ASSET_PATH_SCHEMA = z
  .string()
  .regex(/^assets(\/[A-Za-z0-9_-][A-Za-z0-9._-]*)*\/?$/, "Expected a path inside assets/");
