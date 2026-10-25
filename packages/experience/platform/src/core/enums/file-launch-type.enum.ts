/**
 * Stackra file contract:
 * Purpose: `FileLaunchType`, how an installed PWA opens files the OS hands it (`PwaConfig.manifest.fileHandlers[]
 *          .launchType`): all in the window already open, or one window per file.
 * Boundary: an `Enum.of` value plus the type of the same name. The codes are the web manifest's own values, a
 *           tool-owned spelling, copied into the manifest by gen.
 * Runtime: isomorphic
 * Governing contract: ADR 0255 (file handlers); ADR 0231 (tool-owned values keep their spelling).
 */
import { Enum } from "@stackra/contracts";

/** Where opened files land. */
export const FileLaunchType = Enum.of({
  /** Every file in the one window already open. */
  SingleClient: "single-client",
  /** A new window per file. */
  MultipleClients: "multiple-clients",
});

/** One of the codes above. */
export type FileLaunchType = Enum.Value<typeof FileLaunchType>;
