/**
 * Stackra file contract:
 * Purpose: `MemoryESignatureDriver`, the `memory` driver of `ESignatureProvider`: envelopes kept in the process, for
 *          tests and for sandboxes, where no real provider is called (ADR 0359 decision 11).
 * Boundary: no provider and no seal: `download` answers the PDF that was sent. `settle` moves an open envelope to a
 *           status, standing in for the provider's signers; a final status never moves. `send` is idempotent on
 *           `reference`. Ids are `env_<n>`, unique per instance.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 5); ADR 0266 (memory drivers first); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";

import { SignatureStatus } from "#contracts/enums/signature-status.enum";
import { ESignatureProvider } from "#contracts/ports/e-signature-provider.port";
import type { SignatureEnvelope } from "#contracts/types/signature-envelope.type";
import type { SignatureRequest } from "#contracts/types/signature-request.type";
import { SignatureEnvelopeClosedError } from "#core/errors/signature-envelope-closed.error";
import { SignatureEnvelopeNotFoundError } from "#core/errors/signature-envelope-not-found.error";
import { SignatureNotCompleteError } from "#core/errors/signature-not-complete.error";

/** The statuses an envelope can still leave. */
const OPEN: ReadonlySet<SignatureStatus> = new Set([SignatureStatus.Sent, SignatureStatus.Viewed]);

/**
 * Keeps envelopes in memory.
 *
 * @example
 * const provider = new MemoryESignatureDriver();
 * const envelope = await provider.send(request);
 * provider.settle(envelope.id, SignatureStatus.Signed);
 */
export class MemoryESignatureDriver extends Driver(ESignatureProvider) {
  private readonly envelopes = new Map<
    string,
    { envelope: SignatureEnvelope; document: Uint8Array }
  >();

  private readonly byReference = new Map<string, string>();

  /** Opens an envelope, or answers the one already opened for the request's reference. */
  async send(request: SignatureRequest): Promise<SignatureEnvelope> {
    const existing = this.byReference.get(request.reference);
    if (existing !== undefined) return this.entry(existing).envelope;
    const id = `env_${this.envelopes.size + 1}`;
    const envelope: SignatureEnvelope = {
      id,
      reference: request.reference,
      status: SignatureStatus.Sent,
    };
    this.envelopes.set(id, { envelope, document: request.document });
    this.byReference.set(request.reference, id);
    return envelope;
  }

  /**
   * The envelope now.
   *
   * @throws SignatureEnvelopeNotFoundError when there is no such envelope.
   */
  async status(envelopeId: string): Promise<SignatureEnvelope> {
    return this.entry(envelopeId).envelope;
  }

  /**
   * The PDF that was sent, once the envelope is signed.
   *
   * @throws SignatureNotCompleteError while it is not `signed`.
   */
  async download(envelopeId: string): Promise<Uint8Array> {
    const { envelope, document } = this.entry(envelopeId);
    if (envelope.status !== SignatureStatus.Signed)
      throw SignatureNotCompleteError.create({ envelopeId, status: envelope.status });
    return document;
  }

  /**
   * Cancels an open envelope.
   *
   * @throws SignatureEnvelopeClosedError when it is already final.
   */
  async cancel(envelopeId: string): Promise<SignatureEnvelope> {
    return this.settle(envelopeId, SignatureStatus.Cancelled);
  }

  /**
   * Moves an open envelope to `status`, as the provider's signers would.
   *
   * @throws SignatureEnvelopeClosedError when it is already final.
   */
  settle(envelopeId: string, status: SignatureStatus): SignatureEnvelope {
    const entry = this.entry(envelopeId);
    if (!OPEN.has(entry.envelope.status))
      throw SignatureEnvelopeClosedError.create({ envelopeId, status: entry.envelope.status });
    const envelope: SignatureEnvelope = OPEN.has(status)
      ? { ...entry.envelope, status }
      : { ...entry.envelope, status, closedAt: new Date().toISOString() };
    this.envelopes.set(envelopeId, { ...entry, envelope });
    return envelope;
  }

  /** The stored envelope, or a refusal. */
  private entry(envelopeId: string): { envelope: SignatureEnvelope; document: Uint8Array } {
    const entry = this.envelopes.get(envelopeId);
    if (entry === undefined) throw SignatureEnvelopeNotFoundError.create({ envelopeId });
    return entry;
  }
}
