/**
 * Stackra file contract:
 * Purpose: `IssueConsentSnapshotOutput`, the answer of `consent.consent_snapshot.issue@1`: the compact signed token the
 *          client sends in the `Stackra-Consent` header, and when it stops counting.
 * Boundary: a shape class in schemas/, one declaration per file; it registers its zod schema when the module loads
 *           (STA-339 replaces the registration). The snapshot itself stays inside the token (ADR 0472 decision 6: the
 *           body, never a cookie).
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decisions 1, 2 and 6); ADR 0294 (decisions 4 and 26); ADR 0305 (Output in its own
 *                     file).
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * A signed consent snapshot.
 *
 * @example
 * return IssueConsentSnapshotOutput.create({ token, expiresAt: snapshot.expiresAt });
 */
export class IssueConsentSnapshotOutput extends Schema {
  /** The compact token: base64url payload, key id and signature joined by dots. */
  token!: string;

  /** When the snapshot expires (ISO 8601); the client asks again before then. */
  expiresAt!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    IssueConsentSnapshotOutput,
    z.object({ token: z.string().min(1), expiresAt: z.iso.datetime({ offset: true }) }),
  ],
]);
