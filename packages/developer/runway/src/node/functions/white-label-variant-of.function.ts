/**
 * Stackra file contract:
 * Purpose: `whiteLabelVariantOf(event)`, the `MobileVariant` a `white_label.build.requested.v1` event describes: its
 *          scope, its entitlements and the identity parts the scope sets.
 * Boundary: pure. A null, empty or blank identity part is dropped, so `runMobileJob` keeps the runway entry's value
 *           for it; a name keeps only its non-blank locales.
 * Runtime: node
 * Governing contract: ADR 0439 (decision 8); STA-2074 (os#244, the event's contract).
 */
import type { MobileVariant } from "#node/types/mobile-variant.type";
import type { WhiteLabelBuildRequested } from "#node/types/white-label-build-requested.type";

/** Whether `value` holds more than white space. */
const isSet = (value: string | undefined): value is string =>
  value !== undefined && value.trim() !== "";

/**
 * The variant `event` starts the build with.
 * @example
 * whiteLabelVariantOf(event); // { scope: "scp_1", entitlements: ["storefront.white_label"], identity: { scheme: "acme" } }
 */
export function whiteLabelVariantOf(event: WhiteLabelBuildRequested): MobileVariant {
  const { identity } = event;
  const name = Object.fromEntries(Object.entries(identity.name).filter(([, text]) => isSet(text)));
  const links = identity.links.filter((link) => isSet(link));
  const bundleId = identity.ios?.bundleId;
  const androidPackage = identity.android?.package;
  const scheme = identity.scheme ?? undefined;
  return {
    scope: event.scopeId,
    entitlements: [...event.entitlements],
    identity: {
      ...(Object.keys(name).length === 0 ? {} : { name }),
      ...(isSet(bundleId) ? { ios: { bundleId } } : {}),
      ...(isSet(androidPackage) ? { android: { package: androidPackage } } : {}),
      ...(isSet(scheme) ? { scheme } : {}),
      ...(links.length === 0 ? {} : { links }),
    },
  };
}
