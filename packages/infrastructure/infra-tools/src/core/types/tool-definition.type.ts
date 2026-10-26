/**
 * Stackra file contract:
 * Purpose: `ToolDefinition`, one entry of the tools catalogue: the container a self-hosted tool runs as (image, port,
 *          size, command), the public environment and the secret names it reads, the volume it keeps its data on,
 *          the OpenStreetMap extract variables it takes, and the provider category and code its managed Connection
 *          carries.
 * Boundary: type only; `TOOLS_CATALOGUE` holds the defaults and the root runway's `providers.tools.tools.<key>`
 *           overrides them. Secret names only, never a value (ADR 0173).
 * Runtime: isomorphic
 * Governing contract: owner decision R3-5 (2026-10-26); ADR 0444; ADR 0173.
 */

/** One self-hosted tool. */
export type ToolDefinition = {
  /** The pinned image, or `null` when no upstream image exists and the runway must name the one Figentra builds. */
  readonly image: string | null;
  /** The HTTP port the container listens on; a worker without one gets no endpoint. */
  readonly port?: number;
  /** Fargate CPU units (1024 is one vCPU). */
  readonly cpu: number;
  /** Fargate memory in MiB. */
  readonly memoryMb: number;
  /** Tasks kept running. */
  readonly replicas: number;
  /** The container command, when the image's default is not the one wanted. */
  readonly command?: readonly string[];
  /** Public environment variables. */
  readonly environment: Readonly<Record<string, string>>;
  /** Environment variables whose values the secret store holds, by name. */
  readonly secrets: readonly string[];
  /** The path inside the container kept on the region's persistent file system. */
  readonly volume?: string;
  /** The variables that receive the region's extract download URL and its replication (updates) URL. */
  readonly extract?: { readonly url: string; readonly updates?: string };
  /** Another tool this one runs beside, sharing its image and its switch (Chatwoot's worker). */
  readonly partOf?: string;
  /** What OS integrations registers the endpoint as: a provider category and the provider's code. */
  readonly connection?: { readonly category: string; readonly provider: string };
};
