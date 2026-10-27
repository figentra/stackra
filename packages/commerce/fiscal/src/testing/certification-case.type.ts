/**
 * Stackra file contract:
 * Purpose: `CertificationCase`, one authority's published reference case: the driver, the pack options with the
 *          authority's published sandbox endpoints, a document, the chain context, the recorded port answers and the
 *          values the specification fixes.
 * Boundary: a type only, in the `./testing` entry. Cases are recorded from the published specifications, not from a
 *           sandbox run.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 1 to 4); ADR 0269 (fixtures in the owning package's `./testing`);
 *                     owner decision D3 (2026-10-27): certification pending until a sandbox run passes.
 */
import type { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import type { FiscalDriver } from "#contracts/ports/fiscal-driver.port";
import type { FiscalDocument } from "#contracts/types/fiscal-document.type";
import type { SealContext } from "#contracts/types/seal-context.type";
import type { TillCredential } from "#contracts/types/till-credential.type";
import type { TransportResponse } from "#contracts/types/transport-response.type";
import type { CertificationPorts } from "#testing/certification-ports.type";

/** One authority's reference case. */
export type CertificationCase = {
  /** Stable id, `<driver key>.<case>`; a sandbox config is keyed by it. */
  readonly id: string;
  /** The authority and the mandate. */
  readonly authority: string;
  /** The published document and section the expected values come from. */
  readonly source: string;
  /** Builds the driver over the run's ports. */
  readonly driver: (ports: CertificationPorts) => FiscalDriver;
  /** Pack options: the authority's published sandbox endpoints and codes. */
  readonly options: Readonly<Record<string, unknown>>;
  /** The document sealed. */
  readonly document: FiscalDocument;
  /** The chain position and sealing time (the options come from `options`). */
  readonly context: Omit<SealContext, "options">;
  /** Recorded port answers for the offline run. */
  readonly recorded: {
    readonly device?: Readonly<Record<string, unknown>>;
    readonly credentials?: readonly TillCredential[];
    readonly answers?: readonly TransportResponse[];
  };
  /** What the specification fixes. */
  readonly expect: {
    /** The exact chain hash; checked on a fully recorded run only when `portFree` (the hash needs no port). */
    readonly hash?: string;
    /** The exact QR text; checked on a fully recorded run only. */
    readonly qr?: string;
    /** Whether `hash` holds with any ports (no signer or device feeds it). */
    readonly portFree?: boolean;
    /** Substrings the payload must hold, with any ports. */
    readonly payload?: readonly string[];
    /** Substrings the QR text must hold, with any ports. */
    readonly qrContains?: readonly string[];
    /** The submission verdict on the recorded answers. */
    readonly outcome?: FiscalRecordStatus;
  };
};
