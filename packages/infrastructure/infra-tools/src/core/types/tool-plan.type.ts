/**
 * Stackra file contract:
 * Purpose: `ToolPlan`, one tool as one region runs it: its resolved container (image, port, size, command,
 *          environment), each secret with the parameter that holds it, its volume (EFS, or EBS on EC2), its endpoint
 *          and the variable that receives the region's Valkey URL.
 * Boundary: type only; plain data a test compares and `awsToolsStack` (`./node`) turns into resources.
 * Runtime: isomorphic
 * Governing contract: owner decision R3-5 (2026-10-26); ADR 0444; ADR 0173 (secret names only).
 */
import type { ToolEndpoint } from "#core/types/tool-endpoint.type";

/** One tool in one region. */
export type ToolPlan = {
  /** The catalogue key. */
  readonly key: string;
  /** `<project>-<env>-<region>-<key>`: the task family and the service name. */
  readonly name: string;
  /** The container image the task runs. */
  readonly image: string;
  /** The container port the tool listens on; absent for a worker. */
  readonly port?: number;
  /** The task's CPU units (1024 is one vCPU). */
  readonly cpu: number;
  /** The task's memory in MiB. */
  readonly memoryMb: number;
  /** How many tasks the service keeps running. */
  readonly replicas: number;
  /** The container command, when it overrides the image's own. */
  readonly command?: readonly string[];
  /** Public variables, the extract URLs included. */
  readonly environment: Readonly<Record<string, string>>;
  /** Each secret variable and the parameter (`<secretsPath>/<key>/<NAME>`) it is read from. */
  readonly secrets: readonly { readonly name: string; readonly parameter: string }[];
  /** The container path kept on the persistent file system. */
  readonly volume?: string;
  /** Absent for a worker. */
  readonly endpoint?: ToolEndpoint;
  /** The variable that receives the region's Valkey URL; the program fills it from the cache it declares. */
  readonly cacheVariable?: string;
  /** Set when `volume` lives on one EC2 instance's EBS disk instead of EFS. */
  readonly ebs?: { readonly diskGb: number; readonly instanceType: string };
};
