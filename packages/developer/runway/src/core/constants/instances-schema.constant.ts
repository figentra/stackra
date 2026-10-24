/**
 * Stackra file contract:
 * Purpose: `INSTANCES_SCHEMA`, the `instances` of a topology group or of its split workers: `min` (0 or more) and
 *          `max` (1 or more), with `min` never above `max`.
 * Boundary: internal; a root runway fact only. A member runway never holds instances (ADR 0296 decision 1).
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 2).
 */
import { z } from "zod";

/** The instance range of a process allocation. */
export const INSTANCES_SCHEMA = z
  .strictObject({ min: z.int().min(0), max: z.int().min(1) })
  .refine((instances) => instances.min <= instances.max, {
    message: "`min` is above `max`",
    path: ["min"],
  });
