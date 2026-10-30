/**
 * Stackra file contract:
 * Purpose: `ToolDefinition`, one entry of the tools catalogue: the container a self-hosted tool runs as (image, port,
 *          size, command), the public environment and the secret names it reads, the volume it keeps its data on,
 *          the OpenStreetMap extract variables it takes, and the provider category and code its managed Connection
 *          carries; the image per provider, the tool it needs, the Valkey variable, its database on the shared server,
 *          whether its volume is on EFS or on an EC2 instance's EBS disk, whether it needs a GPU, and whether it runs by
 *          default.
 * Boundary: type only; `TOOLS_CATALOGUE` holds the defaults and the root runway's `providers.tools.tools.<key>`
 *           overrides them. Secret names only, never a value (ADR 0173). An environment value may hold
 *           `{namespace}`, replaced by the region's private namespace.
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
  /** The image per provider code other than the default (OCR's `surya`); the engine is baked into the image. */
  readonly providerImages?: Readonly<Record<string, string>>;
  /** Another tool this one reads from at run time (Photon imports from Nominatim's database). */
  readonly requires?: string;
  /** The variable that receives the region's Valkey URL (`rediss://<primary>:6379`). */
  readonly cache?: string;
  /** Its logical database on the environment's shared Postgres server (ADR 0238), with the extensions it needs. */
  readonly database?: { readonly name: string; readonly extensions?: readonly string[] };
  /** Where `volume` lives: `efs` (Fargate, the default) or `ebs` (one EC2 instance with an encrypted disk). */
  readonly storage?: "efs" | "ebs";
  /** The EBS disk size in GiB, when `storage` is `ebs`. */
  readonly diskGb?: number;
  /** The EC2 instance type, when `storage` is `ebs` or the tool is `gpu` (`g6.xlarge` when left out). */
  readonly instanceType?: string;
  /** Runs on an ECS capacity provider of GPU instances (one GPU per task) instead of Fargate. */
  readonly gpu?: boolean;
  /** Whether the tool runs unless the runway says otherwise; true when left out. */
  readonly enabled?: boolean;
};
