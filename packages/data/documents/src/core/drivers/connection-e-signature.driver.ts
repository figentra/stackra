/**
 * Stackra file contract:
 * Purpose: `ConnectionESignatureDriver`, the `connection` driver of `ESignatureProvider`: each envelope goes to the
 *          provider ADR 0356 picks (the scope's own Connection of a provider the Market offers, else the Market's
 *          platform Connection), and every follow-up of it reaches the same Connection again.
 * Boundary: the choice is `ProviderResolver`'s over the capability `e-signature` and the connection class per provider
 *           code (`drivers`; `{ documenso: DocumensoConnection }` here, DocuSign and Nafath or UAE Pass are OS
 *           integrations, R3-8, so the host passes its own map). The envelope id it answers is
 *           `<provider>:<connectionId>:<provider's id>`, so `status`, `download` and `cancel` reload the Connection
 *           that opened it; any other id is not found. Idempotency on `reference` is the Connection's.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 5); ADR 0356 (decisions 2 to 4); ADR 0266; owner decisions R2-6 and R3-8.
 */
import { Driver } from "@stackra/container";
import type { Connection, ProviderDrivers, ProviderResolver } from "@stackra/integrations";

import { ESignatureProvider } from "#contracts/ports/e-signature-provider.port";
import type { SignatureEnvelope } from "#contracts/types/signature-envelope.type";
import type { SignatureRequest } from "#contracts/types/signature-request.type";
import { SignatureEnvelopeNotFoundError } from "#core/errors/signature-envelope-not-found.error";
import type { ESignatureConnection } from "#core/types/e-signature-connection.type";

/** The capability code `ProviderDefaults` lists e-signature providers under. */
const CAPABILITY = "e-signature";

/**
 * E-signature through the chosen provider's Connection.
 *
 * @example
 * const provider = new ConnectionESignatureDriver(resolver, { documenso: DocumensoConnection });
 * const envelope = await provider.send(request); // envelope.id "documenso:conn_…:42"
 */
export class ConnectionESignatureDriver extends Driver(ESignatureProvider) {
  /** Picks the provider. */
  private readonly resolver: ProviderResolver;

  /** The connection class per provider code. */
  private readonly drivers: ProviderDrivers<ESignatureConnection>;

  /**
   * @param resolver - the integrations provider resolver.
   * @param drivers - the connection class per provider code (each key its Integration's `provider`).
   */
  constructor(resolver: ProviderResolver, drivers: ProviderDrivers<ESignatureConnection>) {
    super();
    this.resolver = resolver;
    this.drivers = drivers;
  }

  /** Opens an envelope at the resolved provider, or answers the one already opened for the reference. */
  async send(request: SignatureRequest): Promise<SignatureEnvelope> {
    const connection = await this.resolver.resolve(CAPABILITY, this.drivers);
    const provider = Object.entries(this.drivers).find(
      ([, type]) => connection instanceof type,
    )?.[0];
    return this.wrap(provider ?? "", connection, await connection.send(request));
  }

  /**
   * The envelope now.
   *
   * @throws SignatureEnvelopeNotFoundError when the id is not one this driver answered.
   */
  async status(envelopeId: string): Promise<SignatureEnvelope> {
    const { provider, connection, id } = await this.open(envelopeId);
    return this.wrap(provider, connection, await connection.status(id));
  }

  /**
   * The signed PDF.
   *
   * @throws SignatureNotCompleteError while the envelope is not signed.
   */
  async download(envelopeId: string): Promise<Uint8Array> {
    const { connection, id } = await this.open(envelopeId);
    return connection.download(id);
  }

  /**
   * Withdraws an open envelope.
   *
   * @throws SignatureEnvelopeClosedError when it is already final.
   */
  async cancel(envelopeId: string): Promise<SignatureEnvelope> {
    const { provider, connection, id } = await this.open(envelopeId);
    return this.wrap(provider, connection, await connection.cancel(id));
  }

  /** The envelope with its id prefixed by provider and Connection. */
  private wrap(
    provider: string,
    connection: Connection,
    envelope: SignatureEnvelope,
  ): SignatureEnvelope {
    return { ...envelope, id: `${provider}:${connection.id}:${envelope.id}` };
  }

  /** The Connection that opened `envelopeId`, and the provider's own id. */
  private async open(envelopeId: string): Promise<{
    provider: string;
    connection: Connection & ESignatureConnection;
    id: string;
  }> {
    const [provider = "", connectionId = "", ...rest] = envelopeId.split(":");
    const id = rest.join(":");
    if (id === "" || !Object.hasOwn(this.drivers, provider))
      throw SignatureEnvelopeNotFoundError.create({ envelopeId });
    const connection = await this.resolver.byConnection(this.drivers, provider, connectionId);
    return { provider, connection, id };
  }
}
