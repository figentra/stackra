/**
 * Stackra file contract:
 * Purpose: `planDevMobile(dir, device)`, the processes a local mobile run starts in the prepared checkout: Expo's iOS
 *          prebuild (with CocoaPods, which needs a UTF-8 locale), then a Release build installed and launched on the
 *          simulator `device` with no bundler, so it needs no Metro port (the JS bundle is embedded).
 * Boundary: pure; `runDevMobile` starts them in order. iOS only: an Android run is the same with `run:android`.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 6); ADR 0439 (decision 5: the embedded bundle).
 */
import type { ToolRun } from "#node/types/tool-run.type";

/** The locale CocoaPods needs. */
const UTF8 = { LANG: "en_US.UTF-8", LC_ALL: "en_US.UTF-8" };

/**
 * The prebuild and run of one app.
 *
 * @example
 * planDevMobile("/repo/.stackra/mobile/app", "A44ABE24-…");
 */
export function planDevMobile(dir: string, device: string): ToolRun[] {
  return [
    {
      command: "expo",
      args: ["prebuild", "--platform", "ios", "--clean"],
      cwd: dir,
      env: { ...UTF8, CI: "1" },
    },
    {
      command: "expo",
      args: ["run:ios", "--configuration", "Release", "--device", device, "--no-bundler"],
      cwd: dir,
      env: UTF8,
    },
  ];
}
