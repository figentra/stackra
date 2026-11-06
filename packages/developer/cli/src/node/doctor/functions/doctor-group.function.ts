/**
 * Stackra file contract:
 * Purpose: `doctorGroup(name)`, the checklist heading of a doctor check: Machine, Tools, Repo, Registries or Accounts.
 * Boundary: pure; a check the table does not name sits under Machine.
 * Runtime: node
 * Governing contract: ADR 0027 (CLI tools pinned in mise); STA-1966 spec FR-009.
 */

import type { DoctorGroup } from "#node/doctor/types/doctor-group.type";

/** The checks that sit under a heading other than Machine, by name. */
const GROUPS: Readonly<Record<string, DoctorGroup>> = {
  "encore CLI": "Tools",
  "pulumi CLI": "Tools",
  "claude CLI": "Tools",
  "opencode CLI": "Tools",
  "Xcode command-line tools": "Tools",
  "iOS simulator": "Tools",
  "pnpm install done": "Repo",
  "agents:check clean": "Repo",
  ".mcp.json present": "Repo",
  "@stackra registry readable": "Registries",
  "@figentra registry readable": "Registries",
  "GitHub CLI signed in": "Accounts",
  "infisical logged in": "Accounts",
  "aws bedrock profile": "Accounts",
};

/**
 * The heading a check sits under.
 *
 * @param name - the check's name.
 * @example
 * doctorGroup("Docker engine running"); // "Machine"
 */
export function doctorGroup(name: string): DoctorGroup {
  return GROUPS[name] ?? "Machine";
}
