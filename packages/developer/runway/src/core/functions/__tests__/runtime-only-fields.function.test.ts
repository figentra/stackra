/**
 * Stackra file contract:
 * Purpose: unit tests of `runtimeOnlyFields`: an `env` row naming `STACKRA_ENVIRONMENT` gives its config key and field,
 *          once however many manifests repeat it; so does the app manifest's `STACKRA_DEV_ISSUER_KEYS` row (the dev
 *          sign-in's key set, STA-2795); a row of another variable, a row without a config field and a manifest of
 *          another shape give nothing (STA-2844).
 * Boundary: test only; pure inputs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0296 (amendment
 *                     2026-11-26); STA-2844.
 */
import { describe, expect, it } from "@stackra/testing";

import { runtimeOnlyFields } from "#core/functions/runtime-only-fields.function";

/** The outbox manifest's rows, as gen writes them. */
const OUTBOX = {
  env: [
    {
      name: "STACKRA_ENVIRONMENT",
      kind: "config",
      config: "outbox.relay_inbox",
      class: "RelayInboxConfig",
      field: "environment",
    },
    { name: "STACKRA_OUTBOX_BATCH", kind: "config", config: "outbox", field: "batch" },
  ],
};

/** The app manifest's bearer rows, as gen writes them. */
const APP = {
  env: [
    {
      name: "STACKRA_BEARER_ISSUER",
      kind: "config",
      type: "string",
      required: false,
      config: "app.bearer",
      class: "BearerConfig",
      field: "issuer",
    },
    {
      name: "STACKRA_DEV_ISSUER_KEYS",
      kind: "config",
      type: "string",
      required: false,
      config: "app.bearer",
      class: "BearerConfig",
      field: "devKeys",
    },
  ],
};

describe("runtimeOnlyFields", () => {
  it("names each field mapped to a safety-critical variable, once", () => {
    expect(runtimeOnlyFields([OUTBOX, OUTBOX])).toEqual([
      { config: "outbox.relay_inbox", field: "environment", variable: "STACKRA_ENVIRONMENT" },
    ]);
  });

  it("names the dev sign-in's key set: dev keys are runtime-only, like the environment (STA-2795)", () => {
    expect(runtimeOnlyFields([APP, OUTBOX])).toEqual([
      { config: "app.bearer", field: "devKeys", variable: "STACKRA_DEV_ISSUER_KEYS" },
      { config: "outbox.relay_inbox", field: "environment", variable: "STACKRA_ENVIRONMENT" },
    ]);
  });

  it("skips other variables, rows without a config field and manifests of another shape", () => {
    expect(
      runtimeOnlyFields([
        { env: [{ name: "STACKRA_ENVIRONMENT", kind: "public" }] },
        { env: [{ name: "SENTRY_ENVIRONMENT", config: "observability", field: "environment" }] },
        { env: "none" },
        null,
        "text",
      ]),
    ).toEqual([]);
  });
});
