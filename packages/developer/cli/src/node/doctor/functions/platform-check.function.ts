/**
 * Stackra file contract:
 * Purpose: `platformCheck(platform?, release?, env?)`, the first line of the `stackra doctor` checklist (and of the
 *          machine check `stackra create` runs): whether this system is one Stackra supports. macOS, Linux and Windows
 *          through WSL 2 are; native Windows and WSL 1 are not, and each gets a warning naming WSL 2 and how to move
 *          to it, instead of a later step failing with no hint.
 * Boundary: pure; reads `process.platform`, `os.release()` and `process.env` only as defaults. A warning never fails
 *           the run: the tools may still work, Stackra just does not test them there.
 * Runtime: node
 * Governing contract: STA-2899 (supported systems: macOS, Linux, Windows through WSL 2); STA-1952 spec FR-014.
 */
import { release as osRelease } from "node:os";

import type { DoctorResult } from "#node/doctor/types/doctor-result.type";

/** The check's name in the checklist (the Machine group). */
const PLATFORM_CHECK = "supported system";

/** Where the supported systems and the WSL 2 setup are written down. */
const SUPPORT_DOC = "https://docs.stackra.figentra.com/quickstart";

/**
 * Whether this system is a supported one.
 *
 * @param platform - Node's platform name (default: `process.platform`).
 * @param release - the kernel release (default: `os.release()`); WSL 1 reports `…-Microsoft`, WSL 2 `…-microsoft-standard-WSL2`.
 * @param env - the environment (default: `process.env`); WSL sets `WSL_DISTRO_NAME`.
 * @example
 * platformCheck("win32"); // { name: "supported system", status: "warn", fix: "… WSL 2 …" }
 */
export function platformCheck(
  platform: NodeJS.Platform = process.platform,
  release: string = osRelease(),
  env: NodeJS.ProcessEnv = process.env,
): DoctorResult {
  if (platform === "darwin") return { name: PLATFORM_CHECK, status: "ok", detail: "macOS" };
  if (platform === "win32")
    return {
      name: PLATFORM_CHECK,
      status: "warn",
      detail:
        "native Windows is not supported; Stackra runs on macOS, Linux and Windows through WSL 2",
      fix: `in PowerShell run \`wsl --install\`, then install mise and run stackra inside the Linux distribution, with the app in the Linux file system (~/), not under /mnt/c (${SUPPORT_DOC})`,
    };
  if (platform === "linux") {
    const wsl = env["WSL_DISTRO_NAME"] !== undefined || /microsoft/i.test(release);
    if (!wsl) return { name: PLATFORM_CHECK, status: "ok", detail: "Linux" };
    // WSL 2 runs a real Linux kernel whose release names WSL2; WSL 1 translates system calls and reports `Microsoft`.
    if (/wsl2/i.test(release))
      return { name: PLATFORM_CHECK, status: "ok", detail: "Linux (WSL 2)" };
    return {
      name: PLATFORM_CHECK,
      status: "warn",
      detail: "WSL 1 is not supported: Docker, file watching and the Encore daemon need WSL 2",
      fix: `in PowerShell run \`wsl --set-version ${env["WSL_DISTRO_NAME"] ?? "<distribution>"} 2\` (${SUPPORT_DOC})`,
    };
  }
  return {
    name: PLATFORM_CHECK,
    status: "warn",
    detail: `${platform} is not supported; Stackra runs on macOS, Linux and Windows through WSL 2`,
    fix: `use macOS, Linux or Windows through WSL 2 (${SUPPORT_DOC})`,
  };
}
