/**
 * Stackra file contract:
 * Purpose: `SHELL_LINE_SCHEMA`, the shell or template line a surface or mobile app targets: `<owner>/<shell>@<line>`
 *          (`os/console@3`, `commerce/till@1`, `os/mobile@3`).
 * Boundary: internal; the surface and mobile app schemas compose it. Shape only: whether the edge serves that line is
 *           the registry's check (ADR 0436 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0436 (decisions 4 and 5: `targets: console@N`), ADR 0439 (decision 1: the native line).
 */
import { z } from "zod";

/** `os/console@3`. */
export const SHELL_LINE_SCHEMA = z
  .string()
  .regex(
    /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*@[0-9]+$/,
    "Expected <owner>/<shell>@<line>, such as os/console@3",
  );
