/**
 * Stackra file contract:
 * Purpose: unit tests of `readRunwayEvents`: each environment's `events` block with the signing key's default name,
 *          keys in order and subscribers with their origins; undefined without a runway file or any block (STA-1910).
 * Boundary: test only; writes small member folders under `<gen>/.cache/runway-events/` (gitignored).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0511 (amendment of 2026-11-02); STA-1910.
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

import { readRunwayEvents } from "#node/functions/read-runway-events.function";

/** The gen package root. */
const GEN_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));

/** Counts the folders this process wrote, so tests never share one. */
let written = 0;

/** A member folder holding `runway` as its runway.yaml (none when undefined); returns its root. */
function member(runway: string | undefined): string {
  written += 1;
  const root = join(GEN_ROOT, ".cache", "runway-events", `${process.pid}-${written}`);
  rmSync(root, { recursive: true, force: true });
  mkdirSync(root, { recursive: true });
  if (runway !== undefined) writeFileSync(join(root, "runway.yaml"), runway);
  return root;
}

describe(readRunwayEvents, () => {
  it("reads each environment's block, the signing key's name defaulted", () => {
    const root = member(
      [
        "environments:",
        "  dev:",
        "    events:",
        "      keys:",
        "        - id: pay-dev-2",
        "          publicKey: bmV4dA",
        "        - id: pay-dev-1",
        "          publicKey: Y3VycmVudA",
        "      subscribers:",
        "        - member: billing",
        "          inbox: http://localhost:4012",
        "          events:",
        "            - payments.payment.captured.v1",
        "  prod:",
        "    queues: {}",
      ].join("\n"),
    );
    expect(readRunwayEvents(root)).toEqual({
      dev: {
        signingKey: "STACKRA_EVENTS_SIGNING_KEY",
        keys: [
          { id: "pay-dev-2", publicKey: "bmV4dA" },
          { id: "pay-dev-1", publicKey: "Y3VycmVudA" },
        ],
        subscribers: [
          {
            member: "billing",
            inbox: "http://localhost:4012",
            events: ["payments.payment.captured.v1"],
          },
        ],
      },
    });
  });

  it("is undefined without a runway file or without any events block", () => {
    expect(readRunwayEvents(member(undefined))).toBeUndefined();
    expect(readRunwayEvents(member("environments:\n  dev:\n    queues: {}\n"))).toBeUndefined();
  });
});
