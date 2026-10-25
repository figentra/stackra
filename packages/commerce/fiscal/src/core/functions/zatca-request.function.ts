/**
 * Stackra file contract:
 * Purpose: `zatcaRequest`, the ZATCA submission call for a sealed record: the invoice hash, the UUID and the signed
 *          XML in base64, to the reporting, clearance or compliance endpoint the caller names.
 * Boundary: a pure function; the endpoint and version come from pack options, and the unit's CSID is attached by the
 *           host's transport (`credential`).
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 3 and 4).
 */
import type { FiscalRecord } from "#contracts/types/fiscal-record.type";
import type { TransportRequest } from "#contracts/types/transport-request.type";
import { toBase64 } from "#core/functions/to-base64.function";

/**
 * The POST request.
 *
 * @example
 * await transport.send(zatcaRequest(record, options.reportingUrl, options.apiVersion, false));
 */
export function zatcaRequest(
  record: FiscalRecord,
  url: string,
  apiVersion: string,
  clearance: boolean,
): TransportRequest {
  return {
    method: "POST",
    url,
    credential: record.unitId,
    headers: {
      "Accept-Version": apiVersion,
      "Accept-Language": "en",
      "Content-Type": "application/json",
      ...(clearance ? { "Clearance-Status": "1" } : {}),
    },
    body: JSON.stringify({
      invoiceHash: record.hash,
      uuid: record.documentId,
      invoice: toBase64(record.payload),
    }),
  };
}
