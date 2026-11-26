/**
 * Stackra file contract:
 * Purpose: `certificatesIn`, the X.509 certificates a PEM text holds, in order: the C2PA trust list's anchors and our
 *          own signing certificates, before the driver hands the ones valid now to c2pa-rs.
 * Boundary: pure over its input (node:crypto parses, nothing is fetched). Text outside the `BEGIN CERTIFICATE` /
 *           `END CERTIFICATE` blocks (the trust list's `Subject` comment lines) is ignored, and a block that does not
 *           parse as a certificate is dropped, never thrown: an unreadable anchor is no anchor (fail closed).
 * Runtime: node
 * Governing contract: STA-2791 (CTO decision of 2026-11-25: fail closed on an unreadable trust list); RFC 7468.
 */
import { X509Certificate } from "node:crypto";

/** One PEM certificate block. */
const PEM_CERTIFICATE = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;

/**
 * The readable certificates in `pem`.
 *
 * @example
 * certificatesIn(C2PA_TRUST_LIST).length; // 34
 */
export function certificatesIn(pem: string): X509Certificate[] {
  return (pem.match(PEM_CERTIFICATE) ?? []).flatMap((block) => {
    try {
      return [new X509Certificate(block)];
    } catch {
      return [];
    }
  });
}
