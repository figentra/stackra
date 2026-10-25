/**
 * Stackra file contract:
 * Purpose: `ClientReplicaSourceDriver`, the `client` driver of `@stackra/query`'s `ReplicaSource`: sends a replica
 *          query through the client's `ClientTransport` with the device's slice and the change cursor as its input
 *          (`{ legalEntityId, cursor }`), and hands back the server's answer: the rows changed since the cursor and the
 *          ids removed, or a full fill (ADR 0338 decision 3).
 * Boundary: finds the query's route among the loaded refs; a key no loaded query ref has rejects, as a refresh of a
 *           client that is not loaded. The answer is checked against the wire form of `ReplicaChanges` (times as ISO
 *           8601 text); `ReplicaStore` checks it again before it keeps anything. The cursor is opaque and sent back as
 *           it came; the first fill sends none. The slice only asks: the server narrows the replica to the slice it
 *           authorised for the device's session, whatever the input says.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3); ADR 0343 (decision 4: the legal entity is the transfer boundary); ADR 0142.
 */
import { Driver } from "@stackra/container";
import { ReplicaSource } from "@stackra/query/contracts";
import type { ReplicaChanges } from "@stackra/query/contracts";
import { json } from "@stackra/validation";
import { z } from "zod";

import { ClientTransport } from "#contracts/ports/client-transport.port";
import { CALL_REFS } from "#core/constants/call-refs.constant";

/** A replica query's answer on the wire. */
const REPLICA_CHANGES_SCHEMA = z.object({
  rows: z.array(z.object({ id: z.string().min(1), at: z.string(), data: json() })),
  removed: z.array(z.string().min(1)),
  cursor: z.string().min(1),
  asOf: z.string(),
  full: z.boolean(),
});

/**
 * Reads replica changes through the client transport.
 *
 * @example
 * drivers: [{ port: ReplicaSource, candidates: { client: () => ClientReplicaSourceDriver } }]
 */
export class ClientReplicaSourceDriver extends Driver(ReplicaSource) {
  private readonly transport: ClientTransport;

  /** @param transport - the client's transport. */
  constructor(transport: ClientTransport) {
    super();
    this.transport = transport;
  }

  /**
   * The changes of the replica query keyed `query` since `cursor`, limited to `slice`.
   *
   * @throws TypeError when no loaded query ref has the key.
   * @throws ClientError the server's refusal, or a `TransportError` when it was not reached.
   * @throws ZodError when the answer is not a replica's.
   */
  async changes(
    query: string,
    cursor: string | null,
    slice: Readonly<Record<string, string>>,
  ): Promise<ReplicaChanges> {
    const ref = CALL_REFS.get(query);
    if (ref?.kind !== "query")
      throw new TypeError(
        `${query} is not a loaded query: load its client before its replica refreshes`,
      );
    const answer = await this.transport.send({
      key: query,
      kind: "query",
      ...(ref.endpoint === undefined ? {} : { endpoint: ref.endpoint }),
      input: { ...slice, ...(cursor === null ? {} : { cursor }) },
      output: REPLICA_CHANGES_SCHEMA,
    });
    return REPLICA_CHANGES_SCHEMA.parse(answer);
  }
}
