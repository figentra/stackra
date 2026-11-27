/**
 * Stackra file contract:
 * Purpose: `isCoreRepository(workspace)`, whether a workspace is the Stackra core repository: the one whose members
 *          build `@stackra/cli`, the workspace the Repository commands of `stackra list` check.
 * Boundary: pure; reads only the manifests it is given.
 * Runtime: node
 * Governing contract: STA-2872 spec FR-002.
 */
import type { DoctorWorkspace } from "#node/doctor/types/doctor-workspace.type";

/** The package only the core repository builds. */
const CORE_MEMBER = "@stackra/cli";

/**
 * Whether `workspace` builds the `stackra` binary itself.
 *
 * @example
 * isCoreRepository({ manifests: [{ name: "@stackra/cli" }], scripts: {}, devPorts: [] }); // true
 */
export function isCoreRepository(workspace: DoctorWorkspace): boolean {
  return workspace.manifests.some(
    (manifest) =>
      typeof manifest === "object" &&
      manifest !== null &&
      (manifest as { readonly name?: unknown }).name === CORE_MEMBER,
  );
}
