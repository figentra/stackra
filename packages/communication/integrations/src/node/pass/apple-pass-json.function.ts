/**
 * Stackra file contract:
 * Purpose: `applePassJson`, the `pass.json` of an Apple Wallet pass from a `WalletPassRequest`: identifiers, serial,
 *          colours, barcode, expiry and the fields of the kind's style (first field primary, the next four secondary,
 *          the rest on the back), with labels and values shown through `labels`.
 * Boundary: pure; no signing and no bundle (`buildPkpass` does both). The pass web service (`webServiceURL`,
 *           `authenticationToken`) is not written: device updates are not built yet (STA-791).
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 5); Apple "PassKit Package Format Reference" (pass.json keys).
 */
import type { AppleWalletOptions } from "#node/pass/apple-wallet-options.type";
import { shownText } from "#node/pass/shown-text.function";
import type { WalletPassRequest } from "#node/pass/wallet-pass-request.type";

/** Secondary fields one pass shows on its front. */
const SECONDARY = 4;

/** `#rrggbb` as Apple's `rgb(r, g, b)`. */
function rgb(hex: string): string {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (match === null)
    throw new TypeError(`a pass colour must be #rrggbb, got ${JSON.stringify(hex)}`);
  return `rgb(${match
    .slice(1)
    .map((pair) => Number.parseInt(pair, 16))
    .join(", ")})`;
}

/**
 * The `pass.json` object.
 *
 * @throws TypeError when a colour is not `#rrggbb`.
 * @example
 * const json = applePassJson(request, { passTypeIdentifier, teamIdentifier, organizationName });
 */
export function applePassJson(
  request: WalletPassRequest,
  options: AppleWalletOptions,
): Readonly<Record<string, unknown>> {
  const { content } = request;
  const text = (value: string) => shownText(request, value);
  const fields = content.fields.map((field, index) => ({
    key: `field_${index}`,
    label: text(field.label),
    value: text(field.value),
  }));
  const style = options.styles?.[request.kind] ?? "generic";
  return {
    formatVersion: 1,
    passTypeIdentifier: options.passTypeIdentifier,
    teamIdentifier: options.teamIdentifier,
    organizationName: options.organizationName,
    serialNumber: content.serial,
    description: text(content.title),
    logoText: text(content.title),
    ...(content.colors === undefined
      ? {}
      : {
          backgroundColor: rgb(content.colors.background),
          foregroundColor: rgb(content.colors.foreground),
          labelColor: rgb(content.colors.foreground),
        }),
    ...(content.barcode === undefined
      ? {}
      : {
          barcodes: [
            {
              format:
                content.barcode.format === "qr" ? "PKBarcodeFormatQR" : "PKBarcodeFormatCode128",
              message: content.barcode.value,
              messageEncoding: "iso-8859-1",
            },
          ],
        }),
    ...(content.validUntil === undefined
      ? {}
      : { expirationDate: content.validUntil.toISOString() }),
    [style]: {
      ...(style === "boardingPass" ? { transitType: "PKTransitTypeGeneric" } : {}),
      headerFields:
        content.subtitle === undefined
          ? []
          : [{ key: "subtitle", label: "", value: text(content.subtitle) }],
      primaryFields: fields.slice(0, 1),
      secondaryFields: fields.slice(1, 1 + SECONDARY),
      backFields: fields.slice(1 + SECONDARY),
    },
  };
}
