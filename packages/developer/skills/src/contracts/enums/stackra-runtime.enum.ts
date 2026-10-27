/**
 * Stackra file contract:
 * Purpose: `StackraRuntime`, where a `package` item's code runs: the `Runtime:` vocabulary of the file contract header
 *          (ADR 0007), one value per `stackra.runtimes` entry and per `runtime:<r>` turbo tag.
 * Boundary: an `Enum.of` value plus the type of the same name.
 * Runtime: isomorphic
 * Governing contract: ADR 0453 (decision 11, amendment of 2026-10-27); ADR 0007 (the file contract header).
 */
import { Enum } from "@stackra/contracts";

/** One case per runtime of the contract header. */
export const StackraRuntime = Enum.of({
  /** Runs anywhere: no Node, DOM or native import. */
  Isomorphic: "isomorphic",
  /** Node.js only. */
  Node: "node",
  /** A browser (DOM, React DOM). */
  Browser: "browser",
  /** A Cloudflare Worker. */
  Worker: "worker",
  /** React Native (Expo). */
  ReactNative: "react-native",
});

/** One of the codes above. */
export type StackraRuntime = Enum.Value<typeof StackraRuntime>;
