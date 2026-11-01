/**
 * Stackra file contract:
 * Purpose: `serviceManifest`, the committed `stackra.manifest.json` of a service the member consumes: the one
 *          discovery found beside the member (`services/<service>`) or in a `contract` package it depends on.
 * Boundary: pure; reads the IR only. The clients target writes a client from it, and the registrations read the wire
 *           names of the consumed events a listener imports.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decisions 2 and 4); ADR 0158 (the manifest is the contract).
 */
import type { StackraManifest } from "@stackra/contracts";

import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The manifest of the consumed `service`, or undefined when none was found.
 *
 * @example
 * serviceManifest(ir, "developer")?.events; // the developer service's events
 */
export function serviceManifest(ir: MemberIR, service: string): StackraManifest | undefined {
  // Never by a dependency's member name: that picked a package's manifest for a service of the same name (STA-1820).
  return ir.services?.find((candidate) => candidate.member === service)?.manifest;
}
