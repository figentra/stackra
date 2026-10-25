/**
 * Stackra file contract:
 * Purpose: `IntegrationCategory`, the shelf an Integration is listed under in the console's integrations marketplace
 *          (`category: IntegrationCategory.Email`).
 * Boundary: an `Enum.of` value plus the type of the same name. Gen derives each category's label from the code; a new
 *           shelf is a new member.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 1: `Integration({ provider, category, ... })`); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * The marketplace shelves.
 *
 * @example
 * Integration({ provider: "resend", category: IntegrationCategory.Email, levels, auth });
 */
export const IntegrationCategory = Enum.of({
  /** Transactional and marketing mail. */
  Email: "email",
  /** SMS, chat and push providers. */
  Messaging: "messaging",
  /** Payment gateways and payouts. */
  Payments: "payments",
  /** Carriers, labels and tracking. */
  Shipping: "shipping",
  /** Calendars and scheduling. */
  Calendar: "calendar",
  /** Booking marketplaces and reservation channels. */
  Booking: "booking",
  /** Telephone calls: numbers, inbound and outbound voice, recordings. */
  Telephony: "telephony",
  /** Wallet passes (Apple Wallet, Google Wallet). */
  Wallet: "wallet",
  /** File and object storage. */
  Storage: "storage",
  /** Customer relationship management. */
  Crm: "crm",
  /** Accounting and invoicing. */
  Accounting: "accounting",
  /** Product and web analytics. */
  Analytics: "analytics",
  /** Advertising and marketing automation. */
  Marketing: "marketing",
  /** Model and AI providers. */
  Ai: "ai",
  /** Anything no other shelf fits. */
  Other: "other",
});

/** One of the codes above. */
export type IntegrationCategory = Enum.Value<typeof IntegrationCategory>;
