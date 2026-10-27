/**
 * Stackra file contract:
 * Purpose: `DocumensoConnection`, one scope's Documenso instance and API key, and the e-signature calls on it: open an
 *          envelope (create, upload the PDF, send), read its status, download the signed PDF, cancel it.
 * Boundary: JSON calls go through the managed client (`api`); the PDF upload and the signed download use the
 *           presigned storage URLs Documenso answers, through plain `fetch` bounded by `timeoutMs`, because the
 *           managed client only speaks JSON. Documenso's states map onto `SignatureStatus`: `COMPLETED` is signed, a
 *           rejection is declined, an opened recipient is viewed, anything else is sent; it has no expiry. A cancelled
 *           envelope is deleted at Documenso, so a later `status` of it is not found. `send` is idempotent on
 *           `reference` through Documenso's `externalId`. Every signer needs an email (Documenso signs by email link).
 *           Envelope ids are Documenso's document ids. The content hash has no field at Documenso and is not sent.
 *           Certification pending: written from the public API v1 documentation, not yet run against an instance.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 5); ADR 0308 (rules 2, 3, 13 and 14); ADR 0356; owner decision R2-6.
 */
import { Secret } from "@stackra/config";
import {
  Connection,
  ConnectedAccount,
  ProviderRefusedError,
  ProviderUnavailableError,
} from "@stackra/integrations";

import { SignatureStatus } from "#contracts/enums/signature-status.enum";
import type { SignatureEnvelope } from "#contracts/types/signature-envelope.type";
import type { SignatureRequest } from "#contracts/types/signature-request.type";
import type { DocumensoIntegration } from "#core/drivers/documenso.integration";
import { SignatureEnvelopeClosedError } from "#core/errors/signature-envelope-closed.error";
import { SignatureEnvelopeNotFoundError } from "#core/errors/signature-envelope-not-found.error";
import { SignatureNotCompleteError } from "#core/errors/signature-not-complete.error";
import { SignatureSignerUnreachableError } from "#core/errors/signature-signer-unreachable.error";
import type { ESignatureConnection } from "#core/types/e-signature-connection.type";

/** A Documenso document as API v1 answers it (the fields read here). */
interface DocumensoDocument {
  readonly id: number;
  readonly externalId?: string | null;
  readonly status: string;
  readonly completedAt?: string | null;
  readonly recipients?: readonly {
    readonly readStatus?: string;
    readonly signingStatus?: string;
  }[];
}

/** The open statuses. */
const OPEN: readonly SignatureStatus[] = [SignatureStatus.Sent, SignatureStatus.Viewed];

/** How many of the newest documents `send` searches for an earlier envelope of the same reference. */
const RECENT = 100;

/**
 * A scope's Documenso.
 *
 * @example
 * const envelope = await connection.send(request);
 */
export class DocumensoConnection
  extends Connection<DocumensoIntegration>
  implements ESignatureConnection
{
  /** The instance's API key (team or personal token). */
  @Secret("DOCUMENSO_API_KEY")
  apiKey!: string;

  /** The instance's host name (`sign.acme.example`), filled into the Integration's base URL. */
  host!: string;

  /** The longest a PDF upload or download may take, in milliseconds. */
  timeoutMs!: number;

  /** Proves the key works by listing one document. */
  async check(): Promise<ConnectedAccount> {
    await this.api.get("/documents", { query: { page: 1, perPage: 1 } });
    return ConnectedAccount.create({ id: this.host });
  }

  /**
   * Opens an envelope, or answers the one already opened for the request's reference.
   *
   * @throws SignatureSignerUnreachableError when a signer has no email.
   */
  async send(request: SignatureRequest): Promise<SignatureEnvelope> {
    const unreachable = request.signers.find((signer) => signer.email === undefined);
    if (unreachable !== undefined)
      throw SignatureSignerUnreachableError.create({ order: unreachable.order });
    // shortcut: only the newest RECENT documents are searched; upgrade to an externalId filter when API v1 has one.
    const recent = await this.api.get<{ readonly documents: readonly DocumensoDocument[] }>(
      "/documents",
      { query: { page: 1, perPage: RECENT } },
    );
    const earlier = recent.documents.find((doc) => doc.externalId === request.reference);
    if (earlier !== undefined) return this.envelopeOf(earlier, request.reference);
    const orders = new Set(request.signers.map((signer) => signer.order));
    const created = await this.api.post<{
      readonly documentId: number;
      readonly uploadUrl: string;
    }>("/documents", {
      title: request.title,
      externalId: request.reference,
      recipients: request.signers.map((signer) => ({
        name: signer.name,
        email: signer.email,
        role: "SIGNER",
        signingOrder: signer.order,
      })),
      meta: {
        language: request.locale.split("-")[0],
        signingOrder: orders.size > 1 ? "SEQUENTIAL" : "PARALLEL",
      },
    });
    await this.transfer(created.uploadUrl, {
      method: "PUT",
      body: request.document as Uint8Array<ArrayBuffer>,
      headers: { "content-type": "application/pdf" },
    });
    await this.api.post(`/documents/${created.documentId}/send`, { sendEmail: true });
    return {
      id: String(created.documentId),
      reference: request.reference,
      status: SignatureStatus.Sent,
    };
  }

  /**
   * The envelope now.
   *
   * @throws SignatureEnvelopeNotFoundError when Documenso has no such document.
   */
  async status(envelopeId: string): Promise<SignatureEnvelope> {
    return this.envelopeOf(await this.document(envelopeId));
  }

  /**
   * The signed PDF with Documenso's seal.
   *
   * @throws SignatureNotCompleteError while the envelope is not signed.
   */
  async download(envelopeId: string): Promise<Uint8Array> {
    const envelope = await this.status(envelopeId);
    if (envelope.status !== SignatureStatus.Signed)
      throw SignatureNotCompleteError.create({ envelopeId, status: envelope.status });
    const { downloadUrl } = await this.api.get<{ readonly downloadUrl: string }>(
      `/documents/${envelopeId}/download`,
    );
    const response = await this.transfer(downloadUrl, { method: "GET" });
    return new Uint8Array(await response.arrayBuffer());
  }

  /**
   * Withdraws an open envelope (Documenso deletes the pending document).
   *
   * @throws SignatureEnvelopeClosedError when it is already final.
   */
  async cancel(envelopeId: string): Promise<SignatureEnvelope> {
    const envelope = await this.status(envelopeId);
    if (!OPEN.includes(envelope.status))
      throw SignatureEnvelopeClosedError.create({ envelopeId, status: envelope.status });
    await this.api.delete(`/documents/${envelopeId}`);
    return { ...envelope, status: SignatureStatus.Cancelled, closedAt: new Date().toISOString() };
  }

  /** The document, with Documenso's 404 as `SignatureEnvelopeNotFoundError`. */
  private async document(envelopeId: string): Promise<DocumensoDocument> {
    try {
      return await this.api.get<DocumensoDocument>(`/documents/${envelopeId}`);
    } catch (error) {
      if (ProviderRefusedError.is(error, { status: 404 }))
        throw SignatureEnvelopeNotFoundError.create({ envelopeId });
      throw error;
    }
  }

  /** The normalised envelope of a Documenso document. */
  private envelopeOf(doc: DocumensoDocument, reference?: string): SignatureEnvelope {
    const recipients = doc.recipients ?? [];
    const status =
      doc.status === "COMPLETED"
        ? SignatureStatus.Signed
        : doc.status === "REJECTED" || recipients.some((r) => r.signingStatus === "REJECTED")
          ? SignatureStatus.Declined
          : recipients.some((r) => r.readStatus === "OPENED")
            ? SignatureStatus.Viewed
            : SignatureStatus.Sent;
    const closedAt = OPEN.includes(status) ? undefined : (doc.completedAt ?? undefined);
    return {
      id: String(doc.id),
      reference: reference ?? doc.externalId ?? "",
      status,
      ...(closedAt === undefined ? {} : { closedAt }),
    };
  }

  /**
   * One call to a presigned storage URL Documenso answered.
   *
   * @throws ProviderUnavailableError when it cannot be reached, times out or answers an error status.
   */
  private async transfer(url: string, init: RequestInit): Promise<Response> {
    let response: Response;
    try {
      response = await fetch(url, { ...init, signal: AbortSignal.timeout(this.timeoutMs) });
    } catch {
      throw ProviderUnavailableError.create({ provider: "documenso" });
    }
    if (!response.ok)
      throw ProviderUnavailableError.create({ provider: "documenso", status: response.status });
    return response;
  }
}
