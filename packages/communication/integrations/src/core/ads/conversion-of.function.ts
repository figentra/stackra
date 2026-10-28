/**
 * Stackra file contract:
 * Purpose: `conversionOf(conversion, payload, at, phone)`, the `ConversionEvent` one integration event's payload makes
 *          under a `Conversion`, or `null` when its consent did not grant `marketing`.
 * Boundary: reads the payload by the conversion's dotted paths and hashes the person with `matchKeysOf`; no I/O. Consent
 *           is checked first (ADR 0472 decision 4): a missing consent, one with no snapshot id, or one whose `granted`
 *           lacks `marketing` is `null`, so no person is hashed for a visitor who refused. A missing or blank `ref` is a
 *           `TypeError` (a conversion with no dedup id would be counted twice), as is a person with nothing to match by.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 1); ADR 0472 (decision 4); ADR 0134 (personal data); analytics gap 12
 *                     (stackra-412).
 */
import type { Url } from "@stackra/contracts";
import type { Money } from "@stackra/money";

import type { ConversionEvent } from "#contracts/ads/conversion-event.type";
import { conversionConsentOf } from "#core/ads/conversion-consent-of.function";
import type { Conversion } from "#core/ads/conversion.type";
import { matchKeysOf } from "#core/ads/match-keys-of.function";
import { valueAt } from "#core/ads/value-at.function";

/** The non-blank string at `path`, or `undefined`. */
function textAt(payload: unknown, path: string | undefined): string | undefined {
  if (path === undefined) return undefined;
  const value = valueAt(payload, path);
  if (typeof value === "number") return String(value);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

/**
 * The conversion `payload` makes, or `null` without marketing consent.
 *
 * @param conversion - where each field is in the payload.
 * @param payload - the integration event.
 * @param at - when the fact happened (the listener context's `occurredAt`).
 * @param phone - the platform's phone format before hashing.
 * @throws TypeError when the `ref` is missing or blank, or the person has nothing to match by.
 * @example
 * const purchase = await conversionOf(PURCHASE, orderPlaced, ctx.occurredAt, "digits");
 */
export async function conversionOf(
  conversion: Conversion,
  payload: unknown,
  at: Date,
  phone: "e164" | "digits",
): Promise<ConversionEvent | null> {
  const consent = conversionConsentOf(conversion, payload);
  if (consent === null) return null;
  const eventId = textAt(payload, conversion.ref);
  if (eventId === undefined)
    throw new TypeError(`Conversion ${conversion.name} needs a dedup id at ${conversion.ref}`);
  const email = textAt(payload, conversion.person.email);
  const phoneNumber = textAt(payload, conversion.person.phone);
  const externalId = textAt(payload, conversion.person.externalId);
  const person = await matchKeysOf(
    {
      ...(email === undefined ? {} : { email }),
      ...(phoneNumber?.startsWith("+") ? { phone: phoneNumber as `+${string}` } : {}),
      ...(externalId === undefined ? {} : { externalId }),
    },
    { phone },
  );
  const value = conversion.value === undefined ? undefined : valueAt(payload, conversion.value);
  const items = conversion.items === undefined ? undefined : valueAt(payload, conversion.items);
  const clickId = textAt(payload, conversion.clickId);
  const pageUrl = textAt(payload, conversion.pageUrl);
  const ip = textAt(payload, conversion.ip);
  const userAgent = textAt(payload, conversion.userAgent);
  return {
    eventId,
    name: conversion.name,
    occurredAt: at,
    person,
    ...(value === undefined || value === null ? {} : { value: value as Money }),
    ...(Array.isArray(items)
      ? { items: items as readonly { readonly sku: string; readonly quantity: number }[] }
      : {}),
    ...(clickId === undefined ? {} : { clickId }),
    ...(pageUrl === undefined ? {} : { pageUrl: pageUrl as Url }),
    ...(ip === undefined ? {} : { ip }),
    ...(userAgent === undefined ? {} : { userAgent }),
    consent,
  };
}
