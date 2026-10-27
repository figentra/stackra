/**
 * Stackra file contract:
 * Purpose: `SHELL_LINE_SCHEMA`, a shell or mobile template line as the root runway names it: `<owner>/<shell>@<major>`
 *          (`os/console@3`, `commerce/till@1`, `os/mobile@3`).
 * Boundary: internal; the surfaces and mobile schemas compose it. Shape only: whether the line is served is the
 *           publish step's compatibility gate.
 * Runtime: isomorphic
 * Governing contract: ADR 0436 (products ship packages, the OS ships the shells), ADR 0439 (one template line per
 *                     major), ADR 0441 (decision 3).
 */
import { z } from "zod";

/** `owner/name@major`. */
export const SHELL_LINE_SCHEMA = z
  .string()
  .regex(/^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*@[0-9]+$/, "Expected <owner>/<shell>@<major>");
