/**
 * Stackra file contract:
 * Purpose: `SurfaceBundler`, the function that builds one surface bundle and answers its files; the CLI passes a Vite
 *          one to `buildProduct`, so Runway carries no build tool.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 4).
 */
import type { SurfaceBundleFiles } from "#node/types/surface-bundle-files.type";
import type { SurfaceBundleJob } from "#node/types/surface-bundle-job.type";

/** Builds one surface bundle. */
export type SurfaceBundler = (job: SurfaceBundleJob) => Promise<SurfaceBundleFiles>;
