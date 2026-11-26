/**
 * Stackra file contract:
 * Purpose: `commandOnPath(command, env?, platform?, startable?)`, whether `command` would start from the `PATH` of
 *          `env`: each `PATH` folder is tried in order; on Windows the `Path` key is matched without case and each
 *          `PATHEXT` extension is tried (`.COM;.EXE;.BAT;.CMD` when unset), elsewhere the file must be executable. A
 *          command that names a folder (`./bin/tool`) is checked as that path. `stackra doctor` asks this instead of
 *          running `which`, which Windows does not have.
 * Boundary: reads file metadata only (`stat`, and an execute-permission check off Windows) through `startable`, which
 *           tests replace; runs no process and opens no file.
 * Runtime: node
 * Governing contract: ADR 0027 (CLI tools pinned in mise); STA-1952 spec FR-014; STA-2859.
 */
import { accessSync, constants, statSync } from "node:fs";
import { posix, win32 } from "node:path";

/** The extensions Windows tries when `PATHEXT` is unset. */
const DEFAULT_PATHEXT = ".COM;.EXE;.BAT;.CMD";

/** Whether `file` is a file this platform would start. */
function startableFile(file: string, windows: boolean): boolean {
  try {
    if (!statSync(file).isFile()) return false;
    // Windows starts any file with a PATHEXT extension; elsewhere the execute bit decides.
    if (!windows) accessSync(file, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/** The value of `name` in `env`; on Windows the key is matched without case (`Path`, `PATH`). */
function variable(
  env: Readonly<Record<string, string | undefined>>,
  name: string,
  windows: boolean,
): string | undefined {
  if (!windows) return env[name];
  const key = Object.keys(env).find((candidate) => candidate.toUpperCase() === name);
  return key === undefined ? undefined : env[key];
}

/**
 * Whether the command is on `PATH`.
 *
 * @param command - the command name, as a shell would be given it (`gh`, `mise`, `./bin/tool`).
 * @param env - the environment whose `PATH` (and `PATHEXT` on Windows) is searched; the CLI's own by default.
 * @param platform - the platform whose rules apply; this machine's by default.
 * @param startable - whether a candidate file would start (a file, executable off Windows); replaced in tests.
 * @example
 * commandOnPath("gh"); // true when gh is installed
 * commandOnPath("gh", { Path: "C:\\Tools", PATHEXT: ".EXE" }, "win32"); // true when C:\Tools\gh.exe exists
 */
export function commandOnPath(
  command: string,
  env: Readonly<Record<string, string | undefined>> = process.env,
  platform: NodeJS.Platform = process.platform,
  startable: (file: string, windows: boolean) => boolean = startableFile,
): boolean {
  if (command === "") return false;
  const windows = platform === "win32";
  const path = windows ? win32 : posix;
  const extensions = windows
    ? [
        // A name that already carries an extension (`gh.exe`) is tried as given first.
        ...(path.extname(command) === "" ? [] : [""]),
        ...(variable(env, "PATHEXT", windows) || DEFAULT_PATHEXT)
          .split(";")
          .filter((extension) => extension !== ""),
      ]
    : [""];
  const startsAs = (base: string): boolean =>
    extensions.some((extension) => startable(`${base}${extension}`, windows));
  if ((windows ? /[\\/]/ : /\//).test(command)) return startsAs(command);
  return (variable(env, "PATH", windows) ?? "")
    .split(path.delimiter)
    .filter((folder) => folder !== "")
    .some((folder) => startsAs(path.join(folder, command)));
}
