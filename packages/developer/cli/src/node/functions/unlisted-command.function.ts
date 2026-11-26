/**
 * Stackra file contract:
 * Purpose: `unlistedCommand(cwd)`, which commands `stackra list` leaves out in the workspace around `cwd`: outside the
 *          Stackra core repository the Repository group (its own checks), and anywhere a command of `COMMAND_FITS`
 *          whose fit the workspace lacks (the search commands without @stackra/search). In the core repository nothing
 *          is left out. The workspace is read once, on the first question, so a run that lists nothing reads nothing.
 * Boundary: reads the workspace's manifests and root runway.yaml; an unreadable workspace counts as an app with none
 *           of the fits, so the list stays short rather than failing. The commands still run by name, and
 *           `stackra list --all` shows them.
 * Runtime: node
 * Governing contract: STA-2872 spec FR-002.
 */
import type { CommandStructure } from "@stackra/console/contracts";

import { COMMAND_FITS } from "#node/constants/command-fits.constant";
import { readDoctorWorkspace } from "#node/doctor/functions/read-doctor-workspace.function";
import { isCoreRepository } from "#node/functions/is-core-repository.function";
import { workspaceFits } from "#node/functions/workspace-fits.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import type { CommandFit } from "#node/types/command-fit.type";
import type { CommandGroup } from "#node/types/command-group.type";

/** The heading of the core repository's own checks. */
const REPOSITORY: CommandGroup = "Repository";

/** What the list needs to know of the workspace. */
type Listing = { readonly core: boolean; readonly fits: (fit: CommandFit) => boolean };

/** The workspace around `cwd` as the list sees it; an unreadable one is an app with no fits. */
function readListing(cwd: string): Listing {
  const root = workspaceRoot(cwd);
  try {
    const workspace = readDoctorWorkspace(root);
    return { core: isCoreRepository(workspace), fits: workspaceFits(root, workspace) };
  } catch {
    return { core: false, fits: () => false };
  }
}

/**
 * The `unlisted` test of `createConsole` for a run in `cwd`.
 *
 * @example
 * createConsole({ name: "stackra", version, commands, unlisted: unlistedCommand(process.cwd()) });
 */
export function unlistedCommand(cwd: string): (structure: CommandStructure) => boolean {
  let listing: Listing | undefined;
  return (structure) => {
    listing ??= readListing(cwd);
    if (listing.core) return false;
    if (structure.group === REPOSITORY) return true;
    const fit = COMMAND_FITS[structure.name];
    return fit !== undefined && !listing.fits(fit);
  };
}
