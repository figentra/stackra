/**
 * Stackra file contract:
 * Purpose: the `AddressAutocomplete` port: suggestions while a person types an address, and the chosen suggestion
 *          resolved to a structured, geocoded address.
 * Boundary: an abstract class that is its own token, key `i18n.AddressAutocomplete`. Drivers are provider Integrations
 *           chosen per tenant and Market through the Connection (ADR 0356, OS-182); none ships here. The session id
 *           groups keystrokes so a provider bills one session. A leaf file.
 * Runtime: isomorphic
 * Governing contract: OS-182; ADR 0356; ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";

import type { AddressSuggestion } from "#contracts/types/address-suggestion.type";
import type { AutocompleteQuery } from "#contracts/types/autocomplete-query.type";
import type { GeocodeResult } from "#contracts/types/geocode-result.type";

/**
 * Address entry help.
 *
 * @example
 * const list = await autocomplete.suggest({ text: "King Fa", session, locale: "en", countries: ["SA"] });
 * const place = await autocomplete.resolve(list[0].id, session, "en");
 */
export abstract class AddressAutocomplete extends Port {
  /** Type-only port key. */
  declare readonly "~key": "i18n.AddressAutocomplete";

  /** Suggestions for what is typed so far, best first. */
  abstract suggest(query: AutocompleteQuery): Promise<readonly AddressSuggestion[]>;

  /**
   * The place of suggestion `id`, which closes the session.
   *
   * @throws NotFoundError when the provider no longer knows the id.
   */
  abstract resolve(id: string, session: string, locale: string): Promise<GeocodeResult>;
}
