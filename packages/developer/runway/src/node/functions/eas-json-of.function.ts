/**
 * Stackra file contract:
 * Purpose: `easJsonOf(base, toolchain)`, the `eas.json` the mobile job writes into the template checkout: the
 *          template's own file with Runway's build profiles (`development`, `preview` and the app's channel, each on
 *          the channel of its name, and `simulator`, the preview build for the iOS simulator and as an Android APK,
 *          STA-265) over a `base` profile holding the exact node and pnpm pins, and the `production` submit profile
 *          on the Play internal track.
 * Boundary: pure. Keeps every other key of `base`; the App Store Connect app id of the submit profile is ADR 0480's
 *           `store eas-submit` step's. Signing is EAS-managed (no credentials key, ADR 0482 decision 3).
 * Runtime: node
 * Governing contract: ADR 0482 (decision 1), ADR 0180 and ADR 0344 (EAS builds and channels); STA-1621; STA-265
 *                     (FR-004).
 */
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";

type Block = Record<string, unknown>;

/** `block[key]` as an object. */
function blockOf(block: unknown, key: string): Block {
  const value = typeof block === "object" && block !== null ? (block as Block)[key] : undefined;
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Block)
    : {};
}

/**
 * The template's `eas.json` with Runway's profiles.
 *
 * @param base - the template checkout's `eas.json` (`{}` when it has none).
 * @param toolchain - the product's pins (`toolVersionOf`) and the app's EAS channel; a missing pin keeps the
 *        template's.
 * @throws RunwayInvalidError when the node version is not exact (`24` instead of `24.22.0`), which eas-cli refuses.
 * @example
 * easJsonOf({}, { node: "24.22.0", pnpm: "12.6.0", channel: "production" });
 */
export function easJsonOf(
  base: Block,
  toolchain: {
    readonly node?: string | undefined;
    readonly pnpm?: string | undefined;
    readonly channel: string;
  },
): Block {
  const build = blockOf(base, "build");
  const pins = blockOf(build, "base");
  const node = toolchain.node ?? pins["node"];
  if (node !== undefined && !(typeof node === "string" && /^\d+\.\d+\.\d+$/.test(node)))
    throw new RunwayInvalidError("mise.toml", [
      {
        path: "tools.node",
        message: `Pin node exactly (x.y.z): eas-cli refuses ${JSON.stringify(node)}`,
      },
    ]);
  const submit = blockOf(base, "submit");
  return {
    ...base,
    cli: { version: ">= 16.0.0", appVersionSource: "remote", ...blockOf(base, "cli") },
    build: {
      ...build,
      base: {
        ...pins,
        ...(node === undefined ? {} : { node }),
        ...(toolchain.pnpm === undefined ? {} : { pnpm: toolchain.pnpm }),
      },
      development: {
        extends: "base",
        developmentClient: true,
        distribution: "internal",
        channel: "development",
        ios: { simulator: true },
      },
      preview: {
        extends: "base",
        distribution: "internal",
        channel: "preview",
        android: { buildType: "apk" },
      },
      // The launch check and the store-screenshot capture install this Release build on a simulator and an emulator.
      simulator: {
        extends: "preview",
        ios: { simulator: true },
      },
      [toolchain.channel]: { extends: "base", autoIncrement: true, channel: toolchain.channel },
    },
    submit: {
      ...submit,
      production: {
        ...blockOf(submit, "production"),
        android: { track: "internal", ...blockOf(blockOf(submit, "production"), "android") },
      },
    },
  };
}
