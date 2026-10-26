/**
 * Stackra file contract:
 * Purpose: `ToolEndpoint`, where one region's self-hosted tool answers, as OS integrations needs it to create the
 *          tool's managed Connection: the provider category and code, the region and the base URL.
 * Boundary: type only; plain data computed by `toolsStackPlan`, so OS reads it from the runway without Pulumi. The URL
 *           is private (the region's service-discovery namespace): only services inside the region's network reach it.
 * Runtime: isomorphic
 * Governing contract: owner decision R3-5 (2026-10-26); ADR 0444; ADR 0376 (decision 5: managed Connections).
 */

/** One tool's endpoint in one region. */
export type ToolEndpoint = {
  /** The tool's catalogue key (`documenso`, `nominatim`). */
  readonly tool: string;
  /** The provider category (`e-signature`, `ocr`, `geocoding`). */
  readonly category: string;
  /** The provider's code (`documenso`, `paddleocr`). */
  readonly provider: string;
  /** The root runway region key. */
  readonly region: string;
  /** The private base URL, `http://<tool>.<namespace>:<port>`. */
  readonly baseUrl: string;
};
