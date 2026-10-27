/**
 * Stackra file contract:
 * Purpose: `googleWalletObject`, the Google Wallet `genericObject` of a `WalletPassRequest`: id and class, card title,
 *          header (the subtitle), the fields as text modules, barcode, colour, logo and the end of its valid interval,
 *          with labels and values shown through `labels` in the request's locale.
 * Boundary: pure. Every pass kind is a generic pass, so one object shape serves loyalty cards and awards; the class
 *           (its look) is the issuer's, made once in the Google Pay and Wallet console or by the OS connector.
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 5); Google Wallet API "GenericObject" reference.
 */
import type { GoogleWalletOptions } from "#node/pass/google-wallet-options.type";
import { shownText } from "#node/pass/shown-text.function";
import type { WalletPassRequest } from "#node/pass/wallet-pass-request.type";

/** The characters a Google Wallet object or class id suffix may hold. */
const ID_SUFFIX = /^[\w.-]+$/;

/**
 * The `genericObject` resource.
 *
 * @throws TypeError when the serial or the class suffix holds a character a Google Wallet id may not.
 * @example
 * const object = googleWalletObject(request, { issuerId: "3388000000012345678", serviceAccountEmail });
 */
export function googleWalletObject(
  request: WalletPassRequest,
  options: GoogleWalletOptions,
): Readonly<Record<string, unknown>> & { readonly id: string } {
  const { content, locale } = request;
  const suffix = options.classes?.[request.kind] ?? request.kind;
  for (const part of [content.serial, suffix])
    if (!ID_SUFFIX.test(part))
      throw new TypeError(
        `a Google Wallet id may hold letters, digits, ".", "_" and "-", got ${JSON.stringify(part)}`,
      );
  const localized = (value: string) => ({
    defaultValue: { language: locale, value: shownText(request, value) },
  });
  return {
    id: `${options.issuerId}.${content.serial}`,
    classId: `${options.issuerId}.${suffix}`,
    state: "ACTIVE",
    cardTitle: localized(content.title),
    header: localized(content.subtitle ?? content.title),
    textModulesData: content.fields.map((field, index) => ({
      id: `field_${index}`,
      header: shownText(request, field.label),
      body: shownText(request, field.value),
    })),
    ...(content.barcode === undefined
      ? {}
      : {
          barcode: {
            type: content.barcode.format === "qr" ? "QR_CODE" : "CODE_128",
            value: content.barcode.value,
          },
        }),
    ...(content.colors === undefined ? {} : { hexBackgroundColor: content.colors.background }),
    ...(content.logo === undefined ? {} : { logo: { sourceUri: { uri: content.logo } } }),
    ...(content.validUntil === undefined
      ? {}
      : { validTimeInterval: { end: { date: content.validUntil.toISOString() } } }),
  };
}
