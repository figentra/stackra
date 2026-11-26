/**
 * Stackra file contract:
 * Purpose: tests of the runbook checks and of the published runbooks themselves: `findEnvironmentDetails` finds an AWS
 *          account id, a host IPv4 address, a phone number and a reachable e-mail address with their lines and lets
 *          the generic forms through; every page under `src/docs/runbooks` is free of environment details (ADR 0185
 *          decision 4) except the known pages listed below, each of which must still need its entry, so the list only
 *          shrinks; and the incident response, on-call, postmortem and disaster-recovery runbooks exist, are in the
 *          Runbooks navigation and state the numbers of ADRs 0170, 0185 and 0186.
 * Boundary: test only; reads the member's pages and `src/config/docs.config.ts` as text and writes nothing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0185; ADR 0186; ADR 0170 (decision 8); STA-27.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

import { EnvironmentDetailKind } from "../environment-detail-kind";
import { findEnvironmentDetails } from "../find-environment-details";
import { missingFacts } from "../missing-facts";

const MEMBER = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const RUNBOOKS = join(MEMBER, "src", "docs", "runbooks");
const DOCS_CONFIG = join(MEMBER, "src", "config", "docs.config.ts");

/**
 * Published runbooks that still carry environment details, with the issue that moves them to the private runbook.
 * Remove an entry once its page is clean; the test fails while a clean page is still listed.
 */
const KNOWN_ENVIRONMENT_SPECIFIC: Readonly<Record<string, string>> = {
  "test-infrastructure.mdx": "the testbed's AWS account id and role ARNs (STA-2849)",
};

/** The operations runbooks of STA-27 and the facts each must state, with the decision each fact comes from. */
const OPERATIONS_RUNBOOKS: Readonly<Record<string, readonly string[]>> = {
  "incident-response": [
    "SEV1", // ADR 0185 decision 2
    "SEV2",
    "SEV3",
    "SEV4",
    "pages the on-call person at any hour", // ADR 0185 decision 1
    "within 15 minutes", // ADR 0170 decision 8
    "five business days", // ADR 0185 decision 2
    "/runbooks/postmortem",
    "/runbooks/on-call",
    "/runbooks/disaster-recovery",
  ],
  "on-call": [
    "Better Stack", // ADR 0185 decision 1
    "SEV1 pages", // ADR 0185 decision 1
    "second on-call person", // ADR 0185 open question 1
    "/runbooks/incident-response",
  ],
  postmortem: [
    "five business days", // ADR 0185 decision 2
    "blameless",
    "/runbooks/incident-response",
  ],
  "disaster-recovery": [
    "15 minutes", // ADR 0186 decision 5 (recovery point)
    "4 hours", // ADR 0186 decision 5 (recovery time)
    "14 days", // ADR 0186 decision 1
    "35 days", // ADR 0186 decision 2
    "never active-active", // ADR 0186 decision 6
    "never restore over the source",
    "/runbooks/restore-drill",
    "/runbooks/incident-response",
  ],
};

describe("findEnvironmentDetails", () => {
  it("finds an AWS account id, alone and inside an ARN, with its line", () => {
    const found = findEnvironmentDetails(
      "intro\nAccount `123456789012`.\narn:aws:iam::210987654321:role/deploy",
    );
    expect(found).toEqual([
      { kind: EnvironmentDetailKind.AwsAccountId, line: 2, match: "123456789012" },
      { kind: EnvironmentDetailKind.AwsAccountId, line: 3, match: "210987654321" },
    ]);
  });

  it("ignores digits that are part of a longer number or a decimal", () => {
    expect(findEnvironmentDetails("1234567890123 and 0.123456789012 and 123456789012.5")).toEqual(
      [],
    );
  });

  it("finds a host IPv4 address and lets the generic ranges through", () => {
    const text = [
      "allow 10.20.30.40/32",
      "bind 0.0.0.0 or 127.0.0.1",
      "docs 192.0.2.10, 198.51.100.7 and 203.0.113.99",
      "not an address 999.1.1.1",
    ].join("\n");
    expect(findEnvironmentDetails(text)).toEqual([
      { kind: EnvironmentDetailKind.Ipv4Address, line: 1, match: "10.20.30.40" },
    ]);
  });

  it("finds an international phone number but not a short code or a version", () => {
    const found = findEnvironmentDetails("Call +971 50 123 4567.\nRetry +1 later; version 1.2.3");
    expect(found).toEqual([
      { kind: EnvironmentDetailKind.PhoneNumber, line: 1, match: "+971 50 123 4567" },
    ]);
  });

  it("finds a reachable e-mail address and lets the example, no-reply and SSH forms through", () => {
    const text = [
      "ops@acme.io pages the team",
      "owner@example.com, bot@users.noreply.github.com, a@b.test",
      "git@github.com:acme/repo.git",
    ].join("\n");
    expect(findEnvironmentDetails(text)).toEqual([
      { kind: EnvironmentDetailKind.EmailAddress, line: 1, match: "ops@acme.io" },
    ]);
  });
});

describe("missingFacts", () => {
  it("matches without case and across line wraps", () => {
    expect(
      missingFacts("A postmortem is written within five\n  business days.", ["Five Business Days"]),
    ).toEqual([]);
  });

  it("returns each phrase the text does not state", () => {
    expect(missingFacts("RPO 15 minutes", ["15 minutes", "4 hours"])).toEqual(["4 hours"]);
  });
});

describe("the published runbooks", () => {
  const pages = readdirSync(RUNBOOKS).filter((name) => name.endsWith(".mdx"));

  it("hold no environment details (ADR 0185 decision 4)", () => {
    const leaks = pages
      .filter((name) => !(name in KNOWN_ENVIRONMENT_SPECIFIC))
      .flatMap((name) =>
        findEnvironmentDetails(readFileSync(join(RUNBOOKS, name), "utf8")).map(
          (detail) => `${name}:${detail.line} ${detail.kind} ${detail.match}`,
        ),
      );
    expect(leaks).toEqual([]);
  });

  it("list a known environment-specific page only while it still needs the entry", () => {
    for (const name of Object.keys(KNOWN_ENVIRONMENT_SPECIFIC)) {
      expect(pages, `${name} is listed but no longer exists`).toContain(name);
      const found = findEnvironmentDetails(readFileSync(join(RUNBOOKS, name), "utf8"));
      expect(
        found.length,
        `${name} is clean: remove it from KNOWN_ENVIRONMENT_SPECIFIC`,
      ).toBeGreaterThan(0);
    }
  });

  const config = readFileSync(DOCS_CONFIG, "utf8");
  for (const [slug, facts] of Object.entries(OPERATIONS_RUNBOOKS)) {
    describe(`runbooks/${slug}`, () => {
      const path = join(RUNBOOKS, `${slug}.mdx`);

      it("exists and is in the Runbooks navigation", () => {
        expect(existsSync(path), `${path} is missing`).toBe(true);
        expect(config).toContain(`"runbooks/${slug}"`);
      });

      it("states the facts of ADRs 0170, 0185 and 0186", () => {
        const text = existsSync(path) ? readFileSync(path, "utf8") : "";
        expect(missingFacts(text, facts)).toEqual([]);
      });
    });
  }
});
