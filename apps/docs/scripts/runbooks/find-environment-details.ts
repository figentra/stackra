/**
 * Stackra file contract:
 * Purpose: `findEnvironmentDetails`, the check behind ADR 0185 decision 4 (generic runbooks are public,
 *          environment-specific ones are private): it scans a page's text for the details that tie it to one
 *          environment (an AWS account id, an IPv4 address outside the unspecified, loopback, broadcast and
 *          documentation ranges, a phone number, an e-mail address outside the reserved example domains) and returns
 *          each with its line.
 * Boundary: pure: text in, findings out. Reading the pages and deciding what fails is the test's
 *           (`__tests__/runbooks.test.ts`, run by this member's `test` task in `pnpm verify`).
 * Runtime: node
 * Governing contract: ADR 0185 (decision 4); STA-27.
 */
import type { EnvironmentDetail } from "./environment-detail";
import { EnvironmentDetailKind } from "./environment-detail-kind";

const AWS_ACCOUNT_ID = /(?<![\d.])\d{12}(?![\d.])/g;
const IPV4 = /(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])/g;
const PHONE = /(?<![\w+])\+\d[\d ()-]{6,}\d/g;
const EMAIL = /([A-Za-z0-9._%+-]+)@((?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,})/g;
const NOT_A_DIGIT = /\D/g;

/** Address blocks that never name a real host: unspecified, loopback, broadcast and the RFC 5737 examples. */
const GENERIC_IPV4_PREFIXES = [
  "0.",
  "127.",
  "255.255.255.255",
  "192.0.2.",
  "198.51.100.",
  "203.0.113.",
];

/** Domains reserved for examples (RFC 2606) and GitHub's no-reply addresses. */
const GENERIC_EMAIL_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "users.noreply.github.com",
  "noreply.github.com",
]);

/** Top-level names reserved for examples and tests (RFC 2606, RFC 6761). */
const GENERIC_EMAIL_SUFFIXES = [".example", ".test", ".invalid", ".localhost"];

/** Whether `address` is a dotted quad of real octets that could name a host. */
function isSpecificIpv4(address: string): boolean {
  if (address.split(".").some((octet) => Number(octet) > 255)) return false;
  return !GENERIC_IPV4_PREFIXES.some((prefix) => address === prefix || address.startsWith(prefix));
}

/** Whether `local@domain` is an address a reader could actually reach. */
function isSpecificEmail(local: string, domain: string): boolean {
  const host = domain.toLowerCase();
  // `git@github.com:owner/repo` is the generic SSH remote form, not a person.
  if (local === "git") return false;
  if (GENERIC_EMAIL_DOMAINS.has(host)) return false;
  return !GENERIC_EMAIL_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

/**
 * The environment-specific details in a runbook's text, in line order. An empty list means the page is fit to publish
 * under ADR 0185 decision 4.
 *
 * @param text - the page source (MDX).
 */
export function findEnvironmentDetails(text: string): EnvironmentDetail[] {
  const found: EnvironmentDetail[] = [];
  text.split("\n").forEach((content, index) => {
    const line = index + 1;
    for (const match of content.matchAll(AWS_ACCOUNT_ID)) {
      found.push({ kind: EnvironmentDetailKind.AwsAccountId, line, match: match[0] });
    }
    for (const match of content.matchAll(IPV4)) {
      if (isSpecificIpv4(match[0]))
        found.push({ kind: EnvironmentDetailKind.Ipv4Address, line, match: match[0] });
    }
    for (const match of content.matchAll(PHONE)) {
      if (match[0].replaceAll(NOT_A_DIGIT, "").length >= 8) {
        found.push({ kind: EnvironmentDetailKind.PhoneNumber, line, match: match[0] });
      }
    }
    for (const match of content.matchAll(EMAIL)) {
      const [address, local = "", domain = ""] = match;
      if (isSpecificEmail(local, domain))
        found.push({ kind: EnvironmentDetailKind.EmailAddress, line, match: address });
    }
  });
  return found;
}
