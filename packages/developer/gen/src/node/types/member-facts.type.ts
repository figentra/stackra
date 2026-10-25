/**
 * Stackra file contract:
 * Purpose: `MemberFacts`, what discovery knows about a member before it reads a class: its root, key, package name
 *          and version, layout, and the facts of its `stackra.config.ts` call.
 * Boundary: a type only; read from package.json, the folder and the `define*` call's syntax tree, never by running
 *           `stackra.config.ts`.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 20, 2026-10-23 item 14: the member key is the folder name); ADR 0295
 *                     (decision 1: `stackra.config.ts` is static data).
 */
import type { MemberIR } from "#core/types/member-ir.type";

/** The facts of one member. */
export interface MemberFacts {
  /** The absolute member root (the folder that holds package.json). */
  readonly root: string;

  /** The member key: the folder name in snake_case. */
  readonly member: string;

  /** The package name. */
  readonly package: string;

  /** The package version. */
  readonly version: string;

  /** Where the member sits. */
  readonly layout: MemberIR["layout"];

  /** `app` when `stackra.config.ts` calls `defineApp`. */
  readonly kind?: "app";

  /** The `area` of `defineApp`. */
  readonly area?: string;

  /** The `targets` of `defineApp`. */
  readonly targets?: readonly string[];

  /** The dependency package names, in package.json order (dependencies, then devDependencies). */
  readonly dependencies: readonly string[];
}
