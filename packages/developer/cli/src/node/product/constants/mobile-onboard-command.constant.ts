/**
 * Stackra file contract:
 * Purpose: `MOBILE_ONBOARD_COMMAND`, `stackra mobile onboard [--app <key>] [--check|--live]`: takes a product's mobile app
 *          from nothing to store-ready (`runMobileOnboard`).
 * Boundary: data plus dispatch.
 * Runtime: node
 * Governing contract: ADR 0482.
 */
import { runMobileOnboard } from "#node/product/functions/run-mobile-onboard.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The `stackra mobile onboard` command definition. */
export const MOBILE_ONBOARD_COMMAND: CliCommand = {
  name: "mobile onboard",
  summary:
    "Onboard a product's mobile app: ids, EAS project, Apple bundle id, Google project and Firebase, Sentry, signing, push, stores",
  usage: "stackra mobile onboard [--app <key>] [--check|--live]",
  options: {
    app: { type: "string" },
    check: { type: "boolean" },
    live: { type: "boolean" },
  },
  run: runMobileOnboard,
};
