/**
 * Stackra file contract:
 * Purpose: `postGotenbergForm`, one multipart call to a Gotenberg engine route, answering the PDF bytes.
 * Boundary: internal to this package (the `gotenberg` drivers); not exported from the entry. Plain `fetch`, no SDK;
 *           a failure to connect, a timeout and an error status all become `PdfEngineFailedError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2).
 */
import { PdfEngineFailedError } from "#core/errors/pdf-engine-failed.error";
import type { GotenbergEndpoint } from "#core/types/gotenberg-endpoint.type";

/**
 * The PDF the engine at `endpoint` answers for `form` on `route`.
 *
 * @throws PdfEngineFailedError when the engine cannot be reached, times out or answers an error status.
 *
 * @example
 * const pdf = await postGotenbergForm(endpoint, "/forms/pdfengines/merge", form);
 */
export async function postGotenbergForm(
  endpoint: GotenbergEndpoint,
  route: string,
  form: FormData,
): Promise<Uint8Array> {
  let response: Response;
  try {
    response = await fetch(`${endpoint.url.replace(/\/+$/u, "")}${route}`, {
      method: "POST",
      body: form,
      headers: { ...endpoint.headers },
      signal: AbortSignal.timeout(endpoint.timeoutMs),
    });
  } catch {
    throw PdfEngineFailedError.create({ route, status: null });
  }
  if (!response.ok) throw PdfEngineFailedError.create({ route, status: response.status });
  return new Uint8Array(await response.arrayBuffer());
}
