/**
 * Stackra file contract:
 * Purpose: unit tests of `yamlValue`: nested block mappings, lists of mappings and of scalars (block and one-line
 *          flow), quoted scalars, a value holding a colon (an origin) and comments become plain data (STA-1910).
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296; STA-1910.
 */
import { describe, expect, it } from "@stackra/testing";

import { yamlValue } from "#node/functions/yaml-value.function";

describe(yamlValue, () => {
  it("reads mappings, lists of mappings and scalars, quotes, origins and comments", () => {
    const source = [
      "# a runway file",
      "environments:",
      "  dev:",
      "    events:",
      "      signingKey: STACKRA_EVENTS_SIGNING_KEY # a name, never a value",
      "      keys:",
      "        - id: pay-dev-1",
      '          publicKey: "cGF5"',
      "      subscribers:",
      "        - member: billing",
      "          inbox: http://localhost:4012",
      "          events:",
      "            - payments.payment.captured.v1",
      "        - member: ledger",
      "          inbox: https://ledger.example.com",
      "          events: [payments.payment.failed.v1, 'payments.payment.captured.v1']",
      "    queues: {}",
      "  prod:",
      "    replicas:",
      "    - one",
    ].join("\n");
    expect(yamlValue(source)).toEqual({
      environments: {
        dev: {
          events: {
            signingKey: "STACKRA_EVENTS_SIGNING_KEY",
            keys: [{ id: "pay-dev-1", publicKey: "cGF5" }],
            subscribers: [
              {
                member: "billing",
                inbox: "http://localhost:4012",
                events: ["payments.payment.captured.v1"],
              },
              {
                member: "ledger",
                inbox: "https://ledger.example.com",
                events: ["payments.payment.failed.v1", "payments.payment.captured.v1"],
              },
            ],
          },
          queues: {},
        },
        prod: { replicas: ["one"] },
      },
    });
  });

  it("reads an empty document as undefined and a key without a value as null", () => {
    expect(yamlValue("# nothing\n")).toBeUndefined();
    expect(yamlValue("events:\n")).toEqual({ events: null });
  });
});
