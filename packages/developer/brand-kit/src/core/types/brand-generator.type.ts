/**
 * Stackra file contract:
 * Purpose: `BrandGenerator`, the shape every per-output generator has: a pure function of the read kit and the SVG
 *          renderer that returns its files in memory.
 * Boundary: internal type of the `.` entry; generators never touch the file system.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: deterministic output).
 */
import type { GeneratedFile } from "#contracts/types/generated-file.type";
import type { KitInput } from "#contracts/types/kit-input.type";
import type { SvgRenderer } from "#contracts/types/svg-renderer.type";

/** Generates one output kind's files. */
export type BrandGenerator = (input: KitInput, render: SvgRenderer) => Promise<GeneratedFile[]>;
